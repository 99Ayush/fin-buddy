/**
 * Documents Module - Frontend API Client (documentsApi.js)
 * Communicates with backend /api/documents endpoints with authenticated user header
 */

import { apiUrl } from '../../../services/apiClient';

const API_BASE = apiUrl('/api/documents');

export function getUserId() {
  let userId = localStorage.getItem('fin-buddy-user-id');
  if (!userId) {
    userId = 'user_' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 12));
    localStorage.setItem('fin-buddy-user-id', userId);
  }
  return userId;
}

function authHeaders(isJson = true) {
  const headers = { 'x-user-id': getUserId() };
  if (isJson) headers['Content-Type'] = 'application/json';
  return headers;
}

/**
 * Upload document for OCR + PII masking
 * @param {File} file - PDF/PNG/JPG file
 * @returns {Promise<object>} { sessionToken, classification, maskedPreview, piiDetected, ocrMetadata }
 */
export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  let response;
  try {
    response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: { 'x-user-id': getUserId() },
      body: formData,
    });
  } catch (e) {
    throw new Error(`Failed to reach the backend (${e.message || 'network error'}). Make sure the backend is running.`);
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) {
    const err = new Error(result.error || 'Upload failed');
    err.code = result.code;
    throw err;
  }
  return result;
}

/**
 * Extract structured data from confirmed masked text
 * @param {string} sessionToken - Session token from upload
 * @returns {Promise<object>} { extractedData, trapFlags, confidence }
 */
export async function extractDocument(sessionToken) {
  const response = await fetch(`${API_BASE}/extract`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ sessionToken }),
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    const err = new Error(result.error || 'Extraction failed');
    err.code = result.code;
    throw err;
  }
  return result;
}

/**
 * Save reviewed extraction to user's reports
 * @param {object} extractedData - Validated extracted data
 * @param {object} userCorrections - Optional user corrections
 * @returns {Promise<object>} { docId, report }
 */
export async function saveDocument(extractedData, userCorrections = {}) {
  const response = await fetch(`${API_BASE}/save`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ extractedData, userCorrections }),
  });

  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || 'Save failed');
  return result;
}

/**
 * Get a specific document report
 * @param {string} docId - Document ID
 * @returns {Promise<object>} Report object
 */
export async function getDocument(docId) {
  const response = await fetch(`${API_BASE}/${docId}`, {
    headers: authHeaders(false),
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || 'Get document failed');
  return result.report;
}

/**
 * Update document fields (user corrections)
 * @param {string} docId - Document ID
 * @param {object} updates - Field updates
 * @returns {Promise<object>} Updated report
 */
export async function updateDocument(docId, updates) {
  const response = await fetch(`${API_BASE}/${docId}`, {
    method: 'PUT',
    headers: authHeaders(true),
    body: JSON.stringify(updates),
  });

  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || 'Update failed');
  return result.report;
}

/**
 * Get trap flags for a document
 * @param {string} docId - Document ID
 * @returns {Promise<Array>} Trap flags array
 */
export async function getDocumentFlags(docId) {
  const response = await fetch(`${API_BASE}/${docId}/flags`, {
    headers: authHeaders(false),
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || 'Failed to fetch flags');
  return result.flags;
}

/**
 * List all documents for current user
 * @returns {Promise<Array>} Array of report summaries
 */
export async function listDocuments() {
  const response = await fetch(`${API_BASE}/`, {
    headers: authHeaders(false),
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || 'Failed to list documents');
  return result.reports;
}

/**
 * Delete a document report
 * @param {string} docId - Document ID
 * @returns {Promise<boolean>} Success
 */
export async function deleteDocument(docId) {
  const response = await fetch(`${API_BASE}/${docId}`, {
    method: 'DELETE',
    headers: authHeaders(false),
  });

  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || 'Failed to delete');
  return true;
}

export default {
  uploadDocument,
  extractDocument,
  saveDocument,
  getDocument,
  updateDocument,
  getDocumentFlags,
  listDocuments,
  deleteDocument,
  getUserId,
};
