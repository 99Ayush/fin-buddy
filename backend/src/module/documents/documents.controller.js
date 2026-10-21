/**
 * Documents Module - Controller (documents.controller.js)
 * Route handlers & validation for /documents endpoints
 */

const documentsService = require('./documents.service');
const { validateDocument } = require('../../shared/validator/documentSchema');
const reportStore = require('../../shared/reportStore');

function requireUserId(req) {
  const userId = req.user?.id || req.headers['x-user-id'];
  if (!userId || typeof userId !== 'string' || userId.length > 128) {
    const error = new Error('Authentication required');
    error.statusCode = 401;
    throw error;
  }
  return userId;
}

async function assertOwnership(userId, documentId) {
  const reports = await reportStore.listReports(userId);
  if (!reports.some((report) => report.documentId === documentId)) {
    const error = new Error('Access denied');
    error.statusCode = 403;
    throw error;
  }
}

/**
 * POST /documents/upload
 * Upload document, run OCR + PII masking, return masked preview + session token
 */
async function uploadDocument(req, res) {
  try {
    const userId = requireUserId(req);
    const file = req.file;

    // Validate file
    documentsService.validateFile(file);

    // The server classifies the redacted OCR text. Never trust a client-selected type.
    const result = await documentsService.processUpload(file, userId);

    // Sanitize logs - no PII or salary figures
    console.log(`[DOCUMENTS] Upload processed: type=${result.documentType}, source=${result.classification?.source}, pages=${result.ocrMetadata.pageCount}, piiTypes=${Object.keys(result.piiDetected).join(',')}`);

    res.json({
      success: true,
      sessionToken: result.sessionToken,
      documentType: result.documentType,
      classification: result.classification,
      maskedPreview: {
        text: result.maskedText,
        pages: result.previewPages,
      },
      piiDetected: result.piiDetected,
      maskStats: result.maskStats,
      quickTraps: result.quickTraps,
      ocrMetadata: result.ocrMetadata,
      message: 'Document validated and redacted. Review the masked preview and confirm to proceed with AI extraction.',
    });
  } catch (error) {
    console.error('[DOCUMENTS] Upload error:', error.message);
    res.status(error.statusCode || 400).json({
      error: error.message,
      code: error.code || 'UPLOAD_FAILED',
      classification: error.classification || undefined,
    });
  }
}

/**
 * POST /documents/extract
 * Take user-confirmed masked text, call LLM extraction, validate against schema
 */
async function extractDocument(req, res) {
  try {
    const userId = requireUserId(req);
    const { sessionToken } = req.body;

    if (!sessionToken) {
      return res.status(400).json({ error: 'Session token required', code: 'MISSING_SESSION' });
    }

    const result = await documentsService.extractStructured(sessionToken, userId);

    // Log sanitized
    console.log(`[DOCUMENTS] Extraction complete: docId=${result.extractedData.documentId}, type=${result.extractedData.documentType}, confidence=${result.confidence}, traps=${result.trapFlags.length}, unverified=${result.unverifiedFields.length}`);

    res.json({
      success: true,
      extractedData: result.extractedData,
      trapFlags: result.trapFlags,
      confidence: result.confidence,
      unverifiedFields: result.unverifiedFields,
      computed: result.computed,
      message: 'Extraction complete. Review the extracted values and clause findings below.',
    });
  } catch (error) {
    console.error('[DOCUMENTS] Extraction error:', error.message);
    const status = error.statusCode || (error.message.includes('session') ? 404 : 500);
    res.status(status).json({
      error: error.message,
      code: status === 404 ? 'SESSION_EXPIRED' : (error.code || 'EXTRACTION_FAILED'),
      details: error.details || undefined,
    });
  }
}

/**
 * GET /documents/:id
 * Retrieve saved structured report from reportStore
 */
async function getDocument(req, res) {
  try {
    const { id } = req.params;
    const userId = requireUserId(req);

    const report = await documentsService.getReport(id);

    if (!report) {
      return res.status(404).json({ error: 'Document not found', code: 'NOT_FOUND' });
    }

    await assertOwnership(userId, id);

    res.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('[DOCUMENTS] Get error:', error.message);
    res.status(error.statusCode || 500).json({ error: error.message, code: 'GET_FAILED' });
  }
}

/**
 * PUT /documents/:id
 * Update fields edited by user during manual review
 */
async function updateDocument(req, res) {
  try {
    const { id } = req.params;
    const userId = requireUserId(req);
    const updates = req.body;

    // Remove immutable fields
    const { documentId, documentType, metadata, savedAt, ...allowedUpdates } = updates;

    await assertOwnership(userId, id);
    const updated = await documentsService.updateReport(id, allowedUpdates);

    if (!updated) {
      return res.status(404).json({ error: 'Document not found', code: 'NOT_FOUND' });
    }

    console.log(`[DOCUMENTS] Updated: docId=${id}, fields=${Object.keys(allowedUpdates).join(', ')}`);

    res.json({
      success: true,
      report: updated,
      message: 'Document updated successfully',
    });
  } catch (error) {
    console.error('[DOCUMENTS] Update error:', error.message);
    res.status(400).json({ error: error.message, code: 'UPDATE_FAILED' });
  }
}

/**
 * GET /documents/:id/flags
 * Evaluate and return all flagged clauses and risks
 */
async function getDocumentFlags(req, res) {
  try {
    const { id } = req.params;
    const userId = requireUserId(req);

    // Get main report
    const report = await documentsService.getReport(id);
    if (!report) {
      return res.status(404).json({ error: 'Document not found', code: 'NOT_FOUND' });
    }
    await assertOwnership(userId, id);

    // Get trap flags report
    const trapReport = await reportStore.getReport(`${id}_traps`);

    if (!trapReport) {
      return res.status(404).json({ error: 'Trap analysis not found', code: 'TRAPS_NOT_FOUND' });
    }

    res.json({
      success: true,
      documentId: id,
      documentType: report.documentType,
      flags: trapReport.flags,
      assessedAt: trapReport.assessedAt,
    });
  } catch (error) {
    console.error('[DOCUMENTS] Flags error:', error.message);
    res.status(500).json({ error: error.message, code: 'FLAGS_FAILED' });
  }
}

/**
 * POST /documents/save
 * Save extraction result after user review (alternative to PUT /documents/:id)
 */
async function saveDocument(req, res) {
  try {
    const userId = requireUserId(req);
    const { extractedData, userCorrections } = req.body;

    if (!extractedData || !extractedData.documentType) {
      return res.status(400).json({ error: 'extractedData with documentType required', code: 'INVALID_DATA' });
    }

    const result = await documentsService.saveReport(userId, extractedData, userCorrections);

    console.log(`[DOCUMENTS] Saved: docId=${result.docId}, type=${extractedData.documentType}`);

    res.json({
      success: true,
      docId: result.docId,
      report: result.report,
      message: 'Document saved to your reports',
    });
  } catch (error) {
    console.error('[DOCUMENTS] Save error:', error.message);
    res.status(400).json({ error: error.message, code: 'SAVE_FAILED' });
  }
}

/**
 * GET /documents
 * List all documents for user
 */
async function listDocuments(req, res) {
  try {
    const userId = requireUserId(req);
    const reports = await documentsService.listReports(userId);

    res.json({
      success: true,
      reports,
      count: reports.length,
    });
  } catch (error) {
    console.error('[DOCUMENTS] List error:', error.message);
    res.status(500).json({ error: error.message, code: 'LIST_FAILED' });
  }
}

/**
 * DELETE /documents/:id
 * Delete a document report
 */
async function deleteDocument(req, res) {
  try {
    const { id } = req.params;
    const userId = requireUserId(req);

    const deleted = await reportStore.deleteReport(userId, id);

    if (!deleted) {
      return res.status(404).json({ error: 'Document not found', code: 'NOT_FOUND' });
    }

    console.log(`[DOCUMENTS] Deleted: docId=${id}`);

    res.json({
      success: true,
      message: 'Document deleted',
    });
  } catch (error) {
    console.error('[DOCUMENTS] Delete error:', error.message);
    res.status(500).json({ error: error.message, code: 'DELETE_FAILED' });
  }
}

module.exports = {
  uploadDocument,
  extractDocument,
  getDocument,
  updateDocument,
  getDocumentFlags,
  saveDocument,
  listDocuments,
  deleteDocument,
};
