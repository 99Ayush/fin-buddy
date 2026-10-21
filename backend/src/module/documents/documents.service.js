/**
 * Documents Module - Service Layer (documents.service.js)
 * Pipeline coordination: Upload -> OCR -> Mask -> Grok validation -> Extract -> Validate -> Store
 *
 * HONESTY RULES enforced here:
 * - The document type is decided by Grok reading the redacted text, not by a client hint.
 * - If the model cannot be reached, the request fails with a real error instead of a guess.
 * - Extracted fields that are not present in the document are omitted, never defaulted.
 * - Every monetary value is reported as-is from the document, and flagged when it cannot
 *   be matched verbatim against the source text.
 * - All derived figures (take-home, tax) come from deterministic code, never from the model.
 */

const path = require('path');
const crypto = require('crypto');
const fs = require('fs').promises;

const ocr = require('../../shared/ai/ocr');
const mask = require('../../shared/ai/mask');
const llm = require('../../shared/ai/llm');
const { validateDocument, getSchema } = require('../../shared/validator/documentSchema');
const reportStore = require('../../shared/reportStore');
const trapDetector = require('./trapDetector');

// ============================================
// CONFIGURATION
// ============================================

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];
const SESSION_TTL_MS = 15 * 60 * 1000;
const SUPPORTED_DOCUMENT_TYPES = ['offer_letter', 'payslip', 'form16', 'loan_agreement'];

const DOCUMENT_TYPE_LABELS = {
  offer_letter: 'Offer letter / employment agreement',
  payslip: 'Payslip',
  form16: 'Form 16 / tax certificate',
  loan_agreement: 'Loan agreement / sanction letter',
};

function purgeExpiredSessions() {
  const sessions = global.__docSessions;
  if (!sessions) return;
  const cutoff = Date.now() - SESSION_TTL_MS;
  for (const [token, session] of sessions) {
    if (new Date(session.createdAt).getTime() < cutoff) clearSession(token);
  }
}

/**
 * Validate uploaded file
 * @param {object} file - Multer file object
 * @throws {Error} If validation fails
 */
function validateFile(file) {
  if (!file) throw new Error('No file uploaded');

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size ${file.size} bytes exceeds maximum of ${MAX_FILE_SIZE} bytes (5MB)`);
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new Error(`MIME type ${file.mimetype} not allowed. Supported: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }

  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`File extension ${ext} not allowed. Supported: ${ALLOWED_EXTENSIONS.join(', ')}`);
  }
}

/**
 * Generate session token for document processing
 * @returns {string}
 */
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Process uploaded document through the validation half of the pipeline.
 * @param {object} file - Multer file object
 * @param {string} userId - User identifier
 * @returns {Promise<object>} Processing result with masked preview and session token
 */
async function processUpload(file, userId) {
  purgeExpiredSessions();
  const sessionId = mask.initMaskSession();
  const sessionToken = generateSessionToken();

  try {
    // Step 1: OCR / text-layer extraction (local, no network)
    const ocrResult = await ocr.processDocument(file.buffer, file.mimetype);

    if (!ocrResult.text || !ocrResult.text.trim()) {
      const error = new Error('No readable text was found in this file. If it is a scan, upload a clearer copy or a text-based PDF.');
      error.code = 'NO_TEXT_FOUND';
      error.statusCode = 422;
      throw error;
    }

    // Step 2: PII masking (local, before any external call)
    const maskedText = mask.maskText(ocrResult.text, sessionId);
    const piiDetected = mask.detectPii(ocrResult.text);
    const maskStats = mask.getMaskStats(sessionId);

    // Step 3: Grok reads the redacted document and decides whether it is a supported type.
    const classification = await classifyDocument(maskedText);
    if (!classification.accepted) {
      const error = new Error(
        classification.reason ||
        'This file is not a supported document. Upload an offer letter, payslip, Form 16, loan agreement, or loan sanction letter.'
      );
      error.code = 'UNSUPPORTED_DOCUMENT';
      error.statusCode = 422;
      error.classification = classification;
      throw error;
    }
    const documentType = classification.documentType;

    // Session data for the extraction step. Raw text stays in volatile memory only.
    const sessionData = {
      sessionToken,
      sessionId,
      documentType,
      classification,
      userId,
      originalFileName: file.originalname,
      maskedText,
      ocrMetadata: ocrResult.metadata,
      ocrWords: ocrResult.words,
      ocrPages: ocrResult.pages,
      piiDetected,
      maskStats,
      quickTraps: [],
      createdAt: new Date().toISOString(),
    };

    global.__docSessions = global.__docSessions || new Map();
    global.__docSessions.set(sessionToken, sessionData);

    // Cleanup temp file if multer saved to disk
    if (file.path) {
      try {
        await fs.unlink(file.path);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    return {
      sessionToken,
      documentType,
      classification,
      maskedText,
      piiDetected,
      maskStats,
      quickTraps: [],
      ocrMetadata: {
        pageCount: ocrResult.metadata.pageCount,
        isScanned: ocrResult.metadata.isScanned,
        processingTimeMs: ocrResult.metadata.processingTimeMs,
      },
      // Page-level text is intentionally not echoed back: the redacted full text
      // is the only copy the client receives, so no raw PII leaves the server.
      previewPages: ocrResult.pages.map((p) => ({
        pageNumber: p.pageNumber,
        characterCount: p.text.length,
      })),
    };
  } catch (error) {
    mask.clearMaskMap(sessionId);
    throw error;
  }
}

/**
 * Local keyword classifier. Used ONLY when no LLM provider key is configured, so the
 * app still works offline. Its verdict is labelled `source: 'local'` and shown as such.
 * @param {string} maskedText
 * @returns {object}
 */
function heuristicClassify(maskedText) {
  const text = maskedText.toLowerCase();

  if (/form\s*16|certificate under section 203|tan\s*(?:no|number)/i.test(text)) {
    return { accepted: true, documentType: 'form16', confidence: 0.6, source: 'local', label: DOCUMENT_TYPE_LABELS.form16 };
  }
  if (/payslip|pay\s*slip|net\s*(?:pay|salary)|gross\s*(?:earnings|salary)/i.test(text)) {
    return { accepted: true, documentType: 'payslip', confidence: 0.6, source: 'local', label: DOCUMENT_TYPE_LABELS.payslip };
  }
  if (/loan\s*(?:agreement|sanction|account)|emi|principal\s+amount|interest\s+rate|lender/i.test(text)) {
    return { accepted: true, documentType: 'loan_agreement', confidence: 0.6, source: 'local', label: DOCUMENT_TYPE_LABELS.loan_agreement };
  }
  if (/offer\s+letter|letter\s+of\s+(?:offer|appointment)|cost\s+to\s+company|ctc|notice\s+period/i.test(text)) {
    return { accepted: true, documentType: 'offer_letter', confidence: 0.6, source: 'local', label: DOCUMENT_TYPE_LABELS.offer_letter };
  }

  return {
    accepted: false,
    documentType: null,
    confidence: 0,
    source: 'local',
    reason: 'This file was not recognised as an offer letter, payslip, Form 16, loan agreement, or loan sanction letter.',
  };
}

/**
 * Ask the configured LLM (xAI Grok by default) whether the document is one of the
 * supported types, and which one.
 *
 * @param {string} maskedText - PII-redacted document text
 * @returns {Promise<object>} { accepted, documentType, confidence, reason, label, source }
 * @throws {Error} When a provider is configured but the call fails (no silent guessing)
 */
async function classifyDocument(maskedText) {
  if (!llm.isLlmConfigured()) {
    return heuristicClassify(maskedText);
  }

  const schema = {
    type: 'object',
    properties: {
      accepted: { type: 'boolean', description: 'true only for a supported document type' },
      documentType: { type: 'string', enum: SUPPORTED_DOCUMENT_TYPES },
      confidence: { type: 'number', minimum: 0, maximum: 1 },
      evidence: { type: 'string', description: 'Short verbatim quote from the document that identifies it' },
      reason: { type: 'string', description: 'Why it was accepted or rejected' },
    },
    required: ['accepted', 'documentType', 'confidence', 'reason'],
  };

  const prompt = `You are validating an uploaded Indian financial or employment document before it is processed.

Read the redacted document text below and decide whether it is EXACTLY ONE of these supported types:
- offer_letter: a job offer letter, appointment letter, or employment agreement
- payslip: a monthly salary slip / pay stub
- form16: a Form 16 / TDS certificate issued under Section 203
- loan_agreement: a loan agreement, loan sanction letter, or loan statement

Rules:
1. Set accepted=false for anything else (invoices, bank statements, receipts, resumes, ID cards, tax returns, property papers, random text, blank pages).
2. Set accepted=true only when the document's own text clearly identifies it as one of the four types above. If it is ambiguous, set accepted=false.
3. documentType must be the single best match when accepted=true; use the first enum value when accepted=false.
4. Do not infer content that is not written in the text. Do not guess from the file name.
5. Put a short verbatim quote that proves your decision in "evidence".

Redacted document text:
"""
${maskedText.slice(0, 16000)}
"""`;

  let result;
  try {
    result = await llm.callLlmStructured(prompt, schema);
  } catch (error) {
    console.error('[DOCUMENTS] Document validation failed:', error.message);
    const wrapped = new Error(
      `Document validation could not be completed (${error.message}). Please retry in a moment.`
    );
    wrapped.code = 'VALIDATION_UNAVAILABLE';
    wrapped.statusCode = 503;
    throw wrapped;
  }

  if (result?.accepted === true && SUPPORTED_DOCUMENT_TYPES.includes(result.documentType)) {
    return {
      accepted: true,
      documentType: result.documentType,
      confidence: Number(result.confidence) || 0,
      evidence: result.evidence || '',
      reason: result.reason || '',
      label: DOCUMENT_TYPE_LABELS[result.documentType],
      source: 'ai',
    };
  }

  return {
    accepted: false,
    documentType: null,
    confidence: Number(result?.confidence) || 0,
    evidence: result?.evidence || '',
    reason: result?.reason || 'This file is not one of the supported document categories.',
    label: null,
    source: 'ai',
  };
}

/**
 * Extract structured data from confirmed masked text
 * @param {string} sessionToken - Session token from upload
 * @param {string} userId - User identifier (for authorization)
 * @returns {Promise<object>} Extracted structured data
 */
async function extractStructured(sessionToken, userId) {
  const session = getSession(sessionToken, userId);
  if (!session) throw new Error('Invalid or expired session token');

  const { maskedText, documentType, ocrWords, ocrPages, sessionId } = session;

  const schema = getSchema(documentType);
  if (!schema) throw new Error(`No schema for document type: ${documentType}`);

  const prompt = buildExtractionPrompt(documentType, maskedText);
  const raw = await llm.callLlmStructured(prompt, schema);

  // Drop unknown keys and empty values: a field the document does not state is
  // simply absent, so it can never be reported as a number that was never there.
  const extracted = pruneToSchema(raw, schema);

  // Identity and provenance are system-owned; an LLM never generates them.
  extracted.documentType = documentType;
  extracted.documentId = crypto.randomUUID();

  const confidence = calculateConfidence(extracted, schema, maskedText);
  extracted.metadata = {
    ...(extracted.metadata || {}),
    extractedAt: new Date().toISOString(),
    extractionConfidence: confidence,
    sourceFileName: session.originalFileName || 'uploaded-document',
    pageCount: ocrPages.length || 1,
  };

  const validation = validateDocument(documentType, extracted);
  if (!validation.valid) {
    const missing = (validation.errors || [])
      .map((e) => `${e.instancePath || '/'} ${e.message}`)
      .slice(0, 8);
    const error = new Error(
      `The document could not be read as a complete ${DOCUMENT_TYPE_LABELS[documentType] || documentType}. ` +
      `Missing or invalid: ${missing.join('; ')}`
    );
    error.code = 'INCOMPLETE_EXTRACTION';
    error.statusCode = 422;
    error.details = missing;
    throw error;
  }

  // Numbers that could not be matched verbatim in the source text are reported so
  // the reviewer knows exactly which figures to double-check.
  const unverifiedFields = findUnverifiedNumbers(extracted, maskedText);

  // Derived figures come from deterministic code (P2's salary & tax engine),
  // never from the language model.
  const computed = await computeDerivedFigures(extracted, documentType);

  // Employment-clause rules apply to offer letters only. Other accepted types get
  // no speculative "trap" findings. Detection runs on the REDACTED text so quotes
  // shown in the UI can never contain PII.
  const trapFlags = documentType === 'offer_letter'
    ? await trapDetector.detectTraps(maskedText, ocrWords, extracted)
    : [];

  const trapReport = {
    documentId: extracted.documentId,
    documentType,
    flags: trapFlags,
    assessedAt: new Date().toISOString(),
  };
  const trapValidation = validateDocument('trap_flags', trapReport);
  if (trapValidation.valid) {
    await reportStore.saveReport(userId, trapReport, `${extracted.documentId}_traps`);
  }

  clearSession(sessionToken);

  return {
    extractedData: extracted,
    trapFlags,
    confidence,
    unverifiedFields,
    computed,
  };
}

/**
 * Build extraction prompt for the LLM.
 * The wording is deliberately strict: the model transcribes, it does not estimate.
 * @param {string} documentType
 * @param {string} maskedText
 * @returns {string}
 */
function buildExtractionPrompt(documentType, maskedText) {
  const fieldGuides = {
    offer_letter: `- Company details (name, CIN, GSTIN, PAN, address)
- Candidate details (name, email, phone, address)
- CTC breakdown as written: basic, HRA, special allowance, PF (employer/employee), gratuity, professional tax
- Variable components: amount, stated criteria, frequency
- ESOP: total options, strike price, total company shares, cliff, vesting schedule, current valuation
- Joining bonus and its clawback period
- Contractual terms: notice period (days), probation (months), bond duration (months), bond penalty, non-compete radius/duration, moonlighting policy, IP assignment scope
- Work location: city, state, pincode, work mode`,
    payslip: `- Pay period: month, year, start/end dates, days worked/paid
- Company details (name, CIN, GSTIN, PAN, address)
- Employee details (name, employee ID, PAN, Aadhaar, UAN, designation, department, date of joining, bank account, IFSC)
- Earnings as written: basic, HRA, special allowance, conveyance, medical, LTA, bonus, other allowances, gross earnings
- Deductions as written: PF (employee/employer), ESI, professional tax, TDS, advance, loan recovery, other, total
- Net pay
- Year-to-date gross, TDS, PF`,
    form16: `- Financial year and assessment year
- Employer: name, TAN, PAN, address
- Employee: name, PAN, address
- Part A: total tax deducted and deposited, challan details
- Part B: gross salary, exempt allowances, perquisites, profits in lieu, total income from salary
- Chapter VI-A deductions: 80C, 80CCD(1B), 80D, 80E, 80G, 80TTA, other, total
- Taxable income, tax on income, 87A rebate, cess, total tax liability
- Tax paid, refund due, tax payable`,
    loan_agreement: `- Loan type, sanction date
- Lender: name, type, licence number
- Borrower: name, PAN, income
- Loan terms: principal, interest rate, interest type, tenure (months), EMI, processing fee, prepayment charges, moratorium`,
  };

  return `You are transcribing a real ${DOCUMENT_TYPE_LABELS[documentType] || documentType} into structured JSON.

ABSOLUTE RULES - a wrong number is worse than a missing number:
1. Only output a value when that exact value is written in the document text below. Copy it as-is.
2. If a field is not stated in the document, OMIT the key entirely. Never estimate, never infer, never average, never carry a value over from a similar field, and never fill in a "typical" figure.
3. Never compute or derive a figure. Do not calculate monthly from annual, annual from monthly, totals from components, or percentages from amounts. If the document does not print it, it is not in your output.
4. Copy amounts in rupees as plain numbers without separators or symbols (₹8,80,000 becomes 880000). Keep lakh/crore wording converted only when the document uses it, e.g. "₹12 lakh" becomes 1200000.
5. Dates must be ISO format (YYYY-MM-DD). If the document gives only a month and year, omit the date field rather than guessing the day.
6. Enum fields must use exactly one of the allowed values.
7. Do not add extra keys. Output only keys that appear in the schema.

Look for:
${fieldGuides[documentType] || fieldGuides.offer_letter}

Document text (PII has already been redacted; [MASKED_*] tokens are placeholders, not data):
"""
${maskedText}
"""`;
}

/**
 * Remove keys that are not part of the schema, and treat empty values as absent.
 * @param {*} value
 * @param {object} schema
 * @returns {*}
 */
function pruneToSchema(value, schema) {
  if (Array.isArray(value)) {
    const itemSchema = schema?.items;
    return value
      .map((item) => (itemSchema ? pruneToSchema(item, itemSchema) : item))
      .filter((item) => item !== null && item !== undefined && item !== '');
  }

  if (value && typeof value === 'object') {
    if (!schema?.properties) return value;
    const out = {};
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const child = value[key];
      if (child === undefined || child === null || child === '') continue;
      out[key] = pruneToSchema(child, propSchema);
    }
    return out;
  }

  return value;
}

/**
 * Calculate extraction confidence from field completeness.
 * This measures how much of the schema the document actually filled in - it is not
 * a guarantee of correctness, which is why unverified numbers are reported separately.
 * @param {object} extracted
 * @param {object} schema
 * @param {string} maskedText
 * @returns {number} Confidence 0-1
 */
function calculateConfidence(extracted, schema, maskedText) {
  if (!schema || !schema.properties) return 0.5;

  let totalFields = 0;
  let filledFields = 0;

  function countFields(obj, props) {
    for (const [key, prop] of Object.entries(props)) {
      if (prop.type === 'object' && prop.properties) {
        countFields(obj[key] || {}, prop.properties);
      } else if (prop.type === 'array') {
        totalFields++;
        if (obj[key] && obj[key].length > 0) filledFields++;
      } else {
        totalFields++;
        if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') filledFields++;
      }
    }
  }

  countFields(extracted, schema.properties);

  const fieldConfidence = totalFields > 0 ? filledFields / totalFields : 0.5;
  const textLengthFactor = Math.min(maskedText.length / 5000, 1);
  return Math.round((fieldConfidence * 0.8 + textLengthFactor * 0.2) * 100) / 100;
}

/**
 * Find monetary values that do not appear verbatim in the source text.
 * Amounts written in words ("twelve lakh") are reported as unverified, which is
 * the safe direction: it asks the reviewer to check rather than to trust.
 * @param {object} extracted
 * @param {string} sourceText
 * @returns {Array<string>} Dotted paths of unverified fields
 */
function findUnverifiedNumbers(extracted, sourceText) {
  const digits = String(sourceText || '').replace(/[^\d]/g, '');
  const unverified = [];

  function checkValue(value, path) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return;
    const rounded = Math.round(Math.abs(value));
    if (rounded < 1000) return; // months, days, counts and percentages are not money
    if (!digits.includes(String(rounded))) unverified.push(path);
  }

  function walk(node, prefix) {
    if (Array.isArray(node)) {
      node.forEach((item, index) => walk(item, `${prefix}[${index}]`));
      return;
    }
    if (node && typeof node === 'object') {
      for (const [key, child] of Object.entries(node)) {
        walk(child, prefix ? `${prefix}.${key}` : key);
      }
      return;
    }
    checkValue(node, prefix);
  }

  walk(extracted, '');
  return unverified;
}

/**
 * Deterministic derived figures. Uses P2's salary & tax engine through its public
 * module interface only (module/salarytax/index.js).
 * @param {object} extracted
 * @param {string} documentType
 * @returns {object|null}
 */
async function computeDerivedFigures(extracted, documentType) {
  if (documentType !== 'offer_letter') return null;

  const fixed = extracted.compensation?.fixedComponent || {};
  const basic = fixed.baseSalary;

  // Without a stated basic salary there is nothing honest to compute from.
  if (!Number.isFinite(basic) || basic <= 0) return null;

  let salarytax;
  try {
    salarytax = require('../salarytax');
  } catch (error) {
    console.warn('[DOCUMENTS] Salary & tax engine unavailable:', error.message);
    return null;
  }

  const inputs = {
    ctcAnnual: extracted.compensation?.ctcAnnual ?? 0,
    basicAnnual: basic,
    hraAnnual: fixed.hra ?? 0,
    specialAllowanceAnnual: fixed.specialAllowance ?? 0,
    pfEmployeeAnnual: fixed.pfEmployee ?? 0,
    pfEmployerAnnual: fixed.pfEmployer ?? 0,
    gratuityAnnual: fixed.gratuity ?? 0,
    bonusAnnual: extracted.compensation?.variableComponent?.performanceBonus ?? 0,
    professionalTaxAnnual: fixed.professionalTax ?? 0,
    regime: 'new',
  };

  try {
    const result = await salarytax.service.calculateInHand(inputs, extracted.documentId);
    return {
      inHand: {
        netMonthly: result.netMonthly,
        grossMonthly: result.grossMonthly,
        annualTax: result.annualTax,
        regimeUsed: result.regimeUsed,
        financialYear: result.financialYear,
        inputs,
        disclaimer: result.disclaimer,
        sourceNote: result.sourceNote,
      },
    };
  } catch (error) {
    console.warn('[DOCUMENTS] Take-home calculation failed:', error.message);
    return null;
  }
}

/**
 * Save user-reviewed extraction to report store
 * @param {string} userId
 * @param {object} extractedData - Validated extracted data
 * @param {object} [updates] - User corrections
 * @returns {Promise<object>} Saved report
 */
async function saveReport(userId, extractedData, updates = {}) {
  const finalData = { ...extractedData, ...updates };
  const validation = validateDocument(finalData.documentType, finalData);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
  }

  const result = await reportStore.saveReport(userId, finalData);
  return { docId: result.docId, report: finalData };
}

/**
 * Get session data (internal)
 * @param {string} sessionToken
 * @param {string} userId
 * @returns {object|null}
 */
function getSession(sessionToken, userId) {
  purgeExpiredSessions();
  const sessions = global.__docSessions;
  if (!sessions) return null;

  const session = sessions.get(sessionToken);
  if (!session) return null;

  if (session.userId !== userId) {
    throw new Error('Unauthorized: Session belongs to different user');
  }

  return session;
}

/**
 * Clear session data
 * @param {string} sessionToken
 */
function clearSession(sessionToken) {
  const sessions = global.__docSessions;
  if (sessions) {
    const session = sessions.get(sessionToken);
    if (session) {
      mask.clearMaskMap(session.sessionId);
    }
    sessions.delete(sessionToken);
  }
}

/**
 * Get report by ID
 * @param {string} docId
 * @returns {Promise<object|null>}
 */
async function getReport(docId) {
  return reportStore.getReport(docId);
}

/**
 * Update report (user corrections)
 * @param {string} docId
 * @param {object} updates
 * @returns {Promise<object|null>}
 */
async function updateReport(docId, updates) {
  return reportStore.updateReport(docId, updates);
}

/**
 * List user reports
 * @param {string} userId
 * @returns {Promise<Array>}
 */
async function listReports(userId) {
  return reportStore.listReports(userId);
}

module.exports = {
  processUpload,
  extractStructured,
  saveReport,
  getReport,
  updateReport,
  listReports,
  validateFile,
  generateSessionToken,
  classifyDocument,
  heuristicClassify,
  pruneToSchema,
  findUnverifiedNumbers,
  SUPPORTED_DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
};
