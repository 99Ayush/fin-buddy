/**
 * Report Store - In-Memory Session Storage for Document Extraction Results
 * Provides isolated, module-agnostic storage for document reports.
 * Other modules (P2, P3) must access extraction results ONLY through this interface.
 */

const crypto = require('crypto');

// In-memory storage
const reports = new Map(); // docId -> report object
const userReports = new Map(); // userId -> Set of docIds

/**
 * Generate a unique document ID
 * @returns {string} UUID v4
 */
function generateDocId() {
  return crypto.randomUUID();
}

/**
 * Save a document report
 * @param {string} userId - User identifier
 * @param {object} reportData - Structured document data (validated against schema)
 * @param {string} [docId] - Optional existing document ID for updates
 * @returns {Promise<{docId: string, savedAt: string}>}
 */
async function saveReport(userId, reportData, docId = null) {
  const id = docId || generateDocId();
  const now = new Date().toISOString();

  const report = {
    ...reportData,
    documentId: id,
    savedAt: now,
    updatedAt: now,
  };

  reports.set(id, report);

  // Maintain user index
  if (!userReports.has(userId)) {
    userReports.set(userId, new Set());
  }
  userReports.get(userId).add(id);

  return { docId: id, savedAt: now };
}

/**
 * Retrieve a document report by ID
 * @param {string} docId - Document ID
 * @returns {Promise<object|null>} Report object or null if not found
 */
async function getReport(docId) {
  return reports.get(docId) || null;
}

/**
 * List all report IDs for a user
 * @param {string} userId - User identifier
 * @returns {Promise<Array<string>>} Array of document IDs
 */
async function listReports(userId) {
  const docIds = userReports.get(userId);
  if (!docIds) return [];
  return Array.from(docIds).map(id => {
    const report = reports.get(id);
    return {
      documentId: id,
      documentType: report?.documentType,
      savedAt: report?.savedAt,
      updatedAt: report?.updatedAt,
      sourceFileName: report?.metadata?.sourceFileName,
    };
  });
}

/**
 * List full reports for a user (with data)
 * @param {string} userId - User identifier
 * @returns {Promise<Array<object>>} Array of full report objects
 */
async function listFullReports(userId) {
  const docIds = userReports.get(userId);
  if (!docIds) return [];
  return Array.from(docIds)
    .map(id => reports.get(id))
    .filter(Boolean);
}

/**
 * Update specific fields of a report (for manual review corrections)
 * @param {string} docId - Document ID
 * @param {object} updates - Partial updates to apply
 * @returns {Promise<object|null>} Updated report or null if not found
 */
async function updateReport(docId, updates) {
  const report = reports.get(docId);
  if (!report) return null;

  const updated = {
    ...report,
    ...updates,
    documentId: report.documentId, // Preserve ID
    savedAt: report.savedAt, // Preserve original save time
    updatedAt: new Date().toISOString(),
  };

  reports.set(docId, updated);
  return updated;
}

/**
 * Delete a report
 * @param {string} userId - User identifier (for authorization)
 * @param {string} docId - Document ID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
async function deleteReport(userId, docId) {
  const report = reports.get(docId);
  if (!report) return false;

  // Optional: verify ownership
  const userDocIds = userReports.get(userId);
  if (userDocIds && !userDocIds.has(docId)) {
    throw new Error('Unauthorized: Document does not belong to user');
  }

  reports.delete(docId);
  if (userDocIds) {
    userDocIds.delete(docId);
  }
  return true;
}

/**
 * Get reports by document type for a user
 * @param {string} userId - User identifier
 * @param {string} documentType - Type filter (offer_letter, payslip, form16, loan_agreement)
 * @returns {Promise<Array<object>>}
 */
async function getReportsByType(userId, documentType) {
  const allReports = await listFullReports(userId);
  return allReports.filter(r => r.documentType === documentType);
}

/**
 * Clear all reports for a user (e.g., on logout/account deletion)
 * @param {string} userId - User identifier
 * @returns {Promise<number>} Number of reports cleared
 */
async function clearUserReports(userId) {
  const docIds = userReports.get(userId);
  if (!docIds) return 0;

  let count = 0;
  for (const id of docIds) {
    reports.delete(id);
    count++;
  }
  userReports.delete(userId);
  return count;
}

/**
 * Get storage statistics (for monitoring/debugging)
 * @returns {object} Stats object
 */
function getStats() {
  return {
    totalReports: reports.size,
    totalUsers: userReports.size,
    reportsByType: Array.from(reports.values()).reduce((acc, r) => {
      acc[r.documentType] = (acc[r.documentType] || 0) + 1;
      return acc;
    }, {}),
  };
}

/**
 * Seed with day-zero fixtures (for development/testing)
 * @param {string} userId - User ID to seed for
 * @returns {Promise<Array<{docId: string, documentType: string}>>}
 */
async function seedFixtures(userId = 'demo-user') {
  const fs = require('fs');
  const path = require('path');

  const fixturesDir = path.join(__dirname, '..', 'data', 'fixtures');
  const results = [];

  const fixtureFiles = [
    { file: 'sampleOfferLetter.json', type: 'offer_letter' },
    { file: 'samplePayslip.json', type: 'payslip' },
    { file: 'sampleTrapFlags.json', type: 'trap_flags' },
  ];

  for (const fixture of fixtureFiles) {
    const filePath = path.join(fixturesDir, fixture.file);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const { docId } = await saveReport(userId, data, data.documentId);
      results.push({ docId, documentType: fixture.type });
    }
  }

  return results;
}

module.exports = {
  saveReport,
  getReport,
  listReports,
  listFullReports,
  updateReport,
  deleteReport,
  getReportsByType,
  clearUserReports,
  getStats,
  seedFixtures,
  generateDocId,
};