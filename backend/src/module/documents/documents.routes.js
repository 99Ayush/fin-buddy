/**
 * Documents Module - Routes (documents.routes.js)
 * API routes for /documents endpoints
 */

const express = require('express');
const multer = require('multer');
const documentsController = require('./documents.controller');

const router = express.Router();

// Multer configuration for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, PNG, JPG allowed.'), false);
    }
  },
});

/**
 * @route POST /documents/upload
 * @description Upload document, run OCR + PII masking, return masked preview + session token
 * @access Private (requires userId header or auth)
 * @body documentType: 'offer_letter' | 'payslip' | 'form16' | 'loan_agreement'
 * @form file: PDF/PNG/JPG (max 5MB)
 * @returns { sessionToken, maskedPreview, piiDetected, quickTraps, ocrMetadata }
 */
router.post('/upload', upload.single('file'), documentsController.uploadDocument);

/**
 * @route POST /documents/extract
 * @description Extract structured data from confirmed masked text using LLM
 * @access Private
 * @body { sessionToken: string }
 * @returns { extractedData, trapFlags, confidence }
 */
router.post('/extract', documentsController.extractDocument);

/**
 * @route POST /documents/save
 * @description Save reviewed extraction to user's report store
 * @access Private
 * @body { extractedData, userCorrections? }
 * @returns { docId, report }
 */
router.post('/save', documentsController.saveDocument);

/**
 * @route GET /documents
 * @description List all documents for current user
 * @access Private
 * @returns { reports[], count }
 */
router.get('/', documentsController.listDocuments);

/**
 * @route GET /documents/:id
 * @description Get a specific document report
 * @access Private
 * @returns { report }
 */
router.get('/:id', documentsController.getDocument);

/**
 * @route PUT /documents/:id
 * @description Update document fields (user corrections during review)
 * @access Private
 * @body { field1: value, field2: value, ... }
 * @returns { report }
 */
router.put('/:id', documentsController.updateDocument);

/**
 * @route GET /documents/:id/flags
 * @description Get trap flags/clause analysis for a document
 * @access Private
 * @returns { flags[], assessedAt }
 */
router.get('/:id/flags', documentsController.getDocumentFlags);

/**
 * @route DELETE /documents/:id
 * @description Delete a document report
 * @access Private
 * @returns { success: true }
 */
router.delete('/:id', documentsController.deleteDocument);

module.exports = router;