/**
 * Documents Module - Service Layer (documents.service.js)
 * Pipeline coordination: Upload -> OCR -> Mask -> Extract -> Validate -> Store
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
 * Process uploaded document through full pipeline
 * @param {object} file - Multer file object
 * @param {string} documentType - Document type (offer_letter, payslip, form16, loan_agreement)
 * @param {string} userId - User identifier
 * @returns {Promise<object>} Processing result with masked preview and session token
 */
async function processUpload(file, documentType, userId) {
  purgeExpiredSessions();
  const sessionId = mask.initMaskSession();
  const sessionToken = generateSessionToken();

  try {
    // Step 1: OCR Extraction
    const ocrResult = await ocr.processDocument(file.buffer, file.mimetype);

    // Step 2: PII Masking
    const maskedText = mask.maskText(ocrResult.text, sessionId);
    const piiDetected = mask.detectPii(ocrResult.text);
    const maskStats = mask.getMaskStats(sessionId);

    // Step 3: Quick trap scan (for preview)
    const quickTraps = trapDetector.quickScan(maskedText);

    // Step 4: Store session data for extraction step
    const sessionData = {
      sessionToken,
      sessionId,
      documentType,
      userId,
      originalText: ocrResult.text, // Stored temporarily in memory only
      maskedText,
      ocrMetadata: ocrResult.metadata,
      ocrWords: ocrResult.words,
      ocrPages: ocrResult.pages,
      piiDetected,
      maskStats,
      quickTraps,
      createdAt: new Date().toISOString(),
    };

    // Store in memory (in production, use Redis with TTL)
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
      maskedText,
      piiDetected,
      maskStats,
      quickTraps,
      ocrMetadata: {
        pageCount: ocrResult.metadata.pageCount,
        isScanned: ocrResult.metadata.isScanned,
        processingTimeMs: ocrResult.metadata.processingTimeMs,
      },
      previewPages: ocrResult.pages.map(p => ({
        pageNumber: p.pageNumber,
        text: p.text.substring(0, 500) + (p.text.length > 500 ? '...' : ''),
      })),
    };
  } catch (error) {
    mask.clearMaskMap(sessionId);
    throw error;
  }
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

  try {
    // Get schema for document type
    const schema = getSchema(documentType);
    if (!schema) throw new Error(`No schema for document type: ${documentType}`);

    // Build extraction prompt
    const prompt = buildExtractionPrompt(documentType, maskedText);

    // Call LLM with structured output
    const extracted = await llm.callLlmStructured(prompt, schema);

    // The document identity and extraction metadata are system-owned fields;
    // never rely on an LLM to generate identifiers or timestamps correctly.
    extracted.documentType = documentType;
    extracted.documentId = crypto.randomUUID();
    extracted.metadata = {
      ...extracted.metadata,
      extractedAt: new Date().toISOString(),
      sourceFileName: session.originalFileName || 'uploaded-document',
      pageCount: ocrPages.length,
    };

    // Validate against schema
    const validation = validateDocument(documentType, extracted);
    if (!validation.valid) {
      const error = new Error('The uploaded file could not be reliably identified as the selected document type. Please choose the correct type and upload a clear offer letter, payslip, Form 16, or loan agreement.');
      error.code = 'INCOMPLETE_EXTRACTION';
      throw error;
    }

    // Add metadata
    extracted.metadata = {
      ...extracted.metadata,
      extractionConfidence: calculateConfidence(extracted, maskedText),
      sourceFileName: session.originalFileName || 'unknown',
      pageCount: ocrPages.length,
    };

    // Detect traps on extracted data (using original text for accuracy)
    const trapFlags = await trapDetector.detectTraps(
      session.originalText,
      ocrWords,
      extracted
    );

    // Store trap flags
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

    // Clear session after successful extraction
    clearSession(sessionToken);

    return {
      extractedData: extracted,
      trapFlags,
      confidence: extracted.metadata.extractionConfidence,
    };
  } catch (error) {
    // Don't clear session on error - user may retry
    throw error;
  }
}

/**
 * Build extraction prompt for LLM
 * @param {string} documentType
 * @param {string} maskedText
 * @returns {string}
 */
function buildExtractionPrompt(documentType, maskedText) {
  const prompts = {
    offer_letter: `Extract structured data from this Indian job offer letter. Pay attention to:
- Company details (name, CIN, GSTIN, PAN, address)
- Candidate details (name, email, phone, address)
- Complete CTC breakdown: basic, HRA, special allowance, PF (employer/employee), gratuity, professional tax
- Variable components: performance bonus amount, criteria, frequency
- ESOP details: total options, strike price, total shares, cliff, vesting schedule, current valuation
- Joining bonus and clawback period
- Contractual terms: notice period (days), probation (months), bond duration (months), bond penalty, non-compete radius/duration, moonlighting policy, IP assignment scope
- Work location: city, state, pincode, work mode (office/hybrid/remote)
- All monetary values in INR (₹)`,

    payslip: `Extract structured data from this Indian monthly payslip. Pay attention to:
- Pay period: month, year, start/end dates, days worked/paid
- Company details (name, CIN, GSTIN, PAN, address)
- Employee details (name, employee ID, PAN, Aadhaar, UAN, designation, department, DOJ, bank account, IFSC)
- Earnings: basic, HRA, special allowance, conveyance, medical, LTA, performance bonus, other allowances, gross earnings
- Deductions: PF (employee/employer), ESI (employee/employer), professional tax, TDS, advance, loan recovery, other deductions, total deductions
- Net pay
- YTD: gross, TDS, PF
- All monetary values in INR (₹)`,

    form16: `Extract structured data from this Form 16 (TDS Certificate). Pay attention to:
- Financial year and assessment year
- Employer: name, TAN, PAN, address
- Employee: name, PAN, address
- Part A: total tax deducted/deposited, challan details (BSR code, date, serial, amount)
- Part B: gross salary, exempt allowances, perquisites, profits in lieu, total income from salary
- Chapter VI-A deductions: 80C, 80CCD(1B), 80D, 80E, 80G, 80TTA, others, total
- Taxable income, tax on income, 87A rebate, cess, total tax liability
- Tax paid, refund due, tax payable
- All monetary values in INR (₹)`,

    loan_agreement: `Extract structured data from this loan agreement/sanction letter. Pay attention to:
- Loan type: home/personal/education/vehicle/gold/business
- Sanction date
- Lender: name, type (bank/NBFC/HFC/fintech), license number
- Borrower: name, PAN, income
- Loan terms: principal, interest rate (%), interest type (fixed/floating/hybrid), tenure (months), EMI, processing fee, prepayment charges (%), moratorium months
- All monetary values in INR (₹)`,
  };

  return `${prompts[documentType] || prompts.offer_letter}\n\nDocument text:\n${maskedText}`;
}

/**
 * Calculate extraction confidence based on field completeness
 * @param {object} extracted
 * @param {string} maskedText
 * @returns {number} Confidence 0-1
 */
function calculateConfidence(extracted, maskedText) {
  const schema = getSchema(extracted.documentType);
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
  const textLengthFactor = Math.min(maskedText.length / 5000, 1); // More text = more confidence
  return Math.round((fieldConfidence * 0.7 + textLengthFactor * 0.3) * 100) / 100;
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

  // Verify ownership
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
};
