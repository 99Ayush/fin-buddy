/**
 * Local PII Masker (mask.js)
 * High-precision regex and deterministic tokenizers for Indian identifiers.
 * All masking is done locally BEFORE any text reaches external LLMs.
 * Masking map is stored only in volatile memory for the active session.
 */

const crypto = require('crypto');

// In-memory reversible masking map (session-scoped)
const maskMaps = new Map(); // sessionId -> Map<maskedToken, originalValue>

/**
 * Generate a deterministic masked token for a given type and index
 * @param {string} type - PII type (PAN, AADHAAR, PHONE, BANK_ACCOUNT, NAME, EMAIL, ADDRESS, IFSC, UAN, TAN, CIN, GSTIN)
 * @param {number} index - Occurrence index
 * @returns {string} Masked token like [MASKED_PAN_1]
 */
function generateMaskedToken(type, index) {
  return `[MASKED_${type}_${index}]`;
}

/**
 * Initialize a new masking session
 * @param {string} [sessionId] - Optional session ID, generated if not provided
 * @returns {string} Session ID
 */
function initMaskSession(sessionId = null) {
  const id = sessionId || crypto.randomUUID();
  if (!maskMaps.has(id)) {
    maskMaps.set(id, new Map());
  }
  return id;
}

/**
 * Get the masking map for a session
 * @param {string} sessionId
 * @returns {Map<string, string>} Reversible mapping
 */
function getMaskMap(sessionId) {
  return maskMaps.get(sessionId) || new Map();
}

/**
 * Clear masking map for a session (call after processing complete)
 * @param {string} sessionId
 */
function clearMaskMap(sessionId) {
  maskMaps.delete(sessionId);
}

/**
 * Core masking function - replaces PII with tokens and stores reversible mapping
 * @param {string} text - Input text
 * @param {string} sessionId - Session ID for reversible mapping
 * @returns {string} Masked text
 */
function maskText(text, sessionId) {
  if (!text || typeof text !== 'string') return text;

  const map = getMaskMap(sessionId);
  let masked = text;
  let counters = {
    PAN: 0, AADHAAR: 0, PHONE: 0, BANK_ACCOUNT: 0,
    NAME: 0, EMAIL: 0, ADDRESS: 0, IFSC: 0, UAN: 0, TAN: 0, CIN: 0, GSTIN: 0
  };

  // ============================================
  // PATTERN DEFINITIONS (ordered by specificity)
  // ============================================

  // PAN: AAAAA9999A (5 letters, 4 digits, 1 letter)
  const panRegex = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g;

  // Aadhaar: 12 digits with optional spaces (XXXX XXXX XXXX or XXXXXXXXXXXX)
  const aadhaarRegex = /\b\d{4}\s?\d{4}\s?\d{4}\b/g;

  // Indian Mobile: starts with 6-9, 10 digits with optional +91/0 prefix, anchored
  const phoneRegex = /(?<!\d)(?:\+?91[\s-]?)?[6-9]\d{9}(?!\d)/g;

  // Bank Account: 9-18 digits (various banks)
  const bankAccountRegex = /\b\d{9,18}\b/g;

  // IFSC: 4 letters + 0 + 6 alphanumeric
  const ifscRegex = /\b[A-Z]{4}0[A-Z0-9]{6}\b/g;

  // UAN: 12 digits
  const uanRegex = /\b\d{12}\b/g;

  // TAN: 4 letters + 5 digits + 1 letter
  const tanRegex = /\b[A-Z]{4}\d{5}[A-Z]\b/g;

  // CIN: L/U + 5 digits + 2 letters + 4 digits + 3 letters + 6 digits
  const cinRegex = /\b[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}\b/g;

  // GSTIN: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanum + Z + 1 alphanum
  const gstinRegex = /\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}\b/g;

  // Email
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

  // ============================================
  // MASKING PASSES (order matters - specific first)
  // ============================================

  // 1. PAN
  masked = masked.replace(panRegex, (match) => {
    counters.PAN++;
    const token = generateMaskedToken('PAN', counters.PAN);
    map.set(token, match);
    return token;
  });

  // 2. Aadhaar
  masked = masked.replace(aadhaarRegex, (match) => {
    // Validate it's actually Aadhaar (12 digits, not part of longer number)
    const digitsOnly = match.replace(/\s/g, '');
    if (digitsOnly.length === 12) {
      counters.AADHAAR++;
      const token = generateMaskedToken('AADHAAR', counters.AADHAAR);
      map.set(token, match);
      return token;
    }
    return match;
  });

  // 3. IFSC (before bank account to avoid partial matches)
  masked = masked.replace(ifscRegex, (match) => {
    counters.IFSC++;
    const token = generateMaskedToken('IFSC', counters.IFSC);
    map.set(token, match);
    return token;
  });

  // 4. UAN
  masked = masked.replace(uanRegex, (match) => {
    counters.UAN++;
    const token = generateMaskedToken('UAN', counters.UAN);
    map.set(token, match);
    return token;
  });

  // 5. TAN
  masked = masked.replace(tanRegex, (match) => {
    counters.TAN++;
    const token = generateMaskedToken('TAN', counters.TAN);
    map.set(token, match);
    return token;
  });

  // 6. CIN
  masked = masked.replace(cinRegex, (match) => {
    counters.CIN++;
    const token = generateMaskedToken('CIN', counters.CIN);
    map.set(token, match);
    return token;
  });

  // 7. GSTIN
  masked = masked.replace(gstinRegex, (match) => {
    counters.GSTIN++;
    const token = generateMaskedToken('GSTIN', counters.GSTIN);
    map.set(token, match);
    return token;
  });

  // 8. Phone numbers
  masked = masked.replace(phoneRegex, (match) => {
    counters.PHONE++;
    const token = generateMaskedToken('PHONE', counters.PHONE);
    map.set(token, match);
    return token;
  });

  // 9. Email
  masked = masked.replace(emailRegex, (match) => {
    counters.EMAIL++;
    const token = generateMaskedToken('EMAIL', counters.EMAIL);
    map.set(token, match);
    return token;
  });

  // 10. Bank Account (after IFSC/UAN to avoid double-masking)
  // More conservative: only mask if near keywords
  const bankContextRegex = /\b(?:account|a\/c|acct|salary)\s*(?:no|number|#)?\s*[:.]?\s*(\d{9,18})\b/gi;
  masked = masked.replace(bankContextRegex, (match, accountNum) => {
    counters.BANK_ACCOUNT++;
    const token = generateMaskedToken('BANK_ACCOUNT', counters.BANK_ACCOUNT);
    map.set(token, accountNum);
    return match.replace(accountNum, token);
  });

  // 11. Candidate Name (heuristic: near "Name", "Candidate", "Employee" labels)
  const nameContextRegex = /\b(?:name|candidate|employee|applicant)\s*[:.]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/gi;
  masked = masked.replace(nameContextRegex, (match, name) => {
    // Skip if it looks like a company name or common words
    const skipWords = ['company', 'limited', 'private', 'solutions', 'technologies', 'india', 'pvt', 'ltd'];
    if (skipWords.some(w => name.toLowerCase().includes(w))) return match;

    counters.NAME++;
    const token = generateMaskedToken('NAME', counters.NAME);
    map.set(token, name);
    return match.replace(name, token);
  });

  // 12. Address (heuristic: multi-line after "Address", "Residence")
  // This is more complex, basic version masks lines containing address keywords
  const addressLines = masked.split('\n');
  for (let i = 0; i < addressLines.length; i++) {
    const line = addressLines[i];
    if (/\b(?:address|residence|flat|house|floor|block|sector|colony|nagar|road|street|lane|avenue)\b/i.test(line) &&
        /\d/.test(line) && // Contains numbers (house/flat no)
        !/^\s*$/.test(line)) {
      counters.ADDRESS++;
      const token = generateMaskedToken('ADDRESS', counters.ADDRESS);
      map.set(token, line.trim());
      addressLines[i] = line.replace(line.trim(), token);
    }
  }
  masked = addressLines.join('\n');

  return masked;
}

/**
 * Unmask text using session mapping (for display to user after confirmation)
 * @param {string} maskedText - Text with masked tokens
 * @param {string} sessionId - Session ID
 * @returns {string} Unmasked text
 */
function unmaskText(maskedText, sessionId) {
  if (!maskedText || typeof maskedText !== 'string') return maskedText;

  const map = getMaskMap(sessionId);
  let unmasked = maskedText;

  // Sort tokens by length descending to avoid partial replacements
  const sortedTokens = Array.from(map.keys()).sort((a, b) => b.length - a.length);

  for (const token of sortedTokens) {
    const original = map.get(token);
    if (original) {
      unmasked = unmasked.split(token).join(original);
    }
  }

  return unmasked;
}

/**
 * Get masking statistics for a session
 * @param {string} sessionId
 * @returns {object} Count of each PII type masked
 */
function getMaskStats(sessionId) {
  const map = getMaskMap(sessionId);
  const stats = {};
  for (const token of map.keys()) {
    const type = token.match(/MASKED_(\w+)_\d+/)?.[1] || 'UNKNOWN';
    stats[type] = (stats[type] || 0) + 1;
  }
  return stats;
}

/**
 * Check if text contains likely PII (for preview/confirmation UI)
 * @param {string} text
 * @returns {object} Detected PII types and counts (without masking)
 */
function detectPii(text) {
  if (!text) return {};

  const patterns = {
    PAN: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g,
    AADHAAR: /\b\d{4}\s?\d{4}\s?\d{4}\b/g,
    PHONE: /(?<!\d)(?:\+?91[\s-]?)?[6-9]\d{9}(?!\d)/g,
    IFSC: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g,
    UAN: /\b\d{12}\b/g,
    EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  };

  const detected = {};
  for (const [type, regex] of Object.entries(patterns)) {
    const matches = text.match(regex);
    if (matches) detected[type] = matches.length;
  }
  return detected;
}

module.exports = {
  maskText,
  unmaskText,
  initMaskSession,
  getMaskMap,
  clearMaskMap,
  getMaskStats,
  detectPii,
};
