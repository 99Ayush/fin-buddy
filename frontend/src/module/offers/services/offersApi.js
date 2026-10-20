/**
 * Offers Module - Frontend API Client (offersApi.js)
 * Communicates with backend /api/offers endpoints with authenticated user header
 */

import { getUserId } from '../../documents/services/documentsApi';

const API_BASE = '/api/offers';

function authHeaders(isJson = true) {
  const headers = { 'x-user-id': getUserId() };
  if (isJson) headers['Content-Type'] = 'application/json';
  return headers;
}

/**
 * Compare 2-4 offers
 * @param {Array<string>} offerIds - Saved offer document IDs
 * @param {Array<object>} manualOffers - Manual offer objects
 * @returns {Promise<object>} { offers, comparison }
 */
export async function compareOffers(offerIds = [], manualOffers = []) {
  const response = await fetch(`${API_BASE}/compare`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ offerIds, manualOffers }),
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || 'Comparison failed');
  return result;
}

/**
 * Calculate ESOP projections
 * @param {object} params - ESOP parameters
 * @returns {Promise<object>} Projections across scenarios
 */
export async function calculateEsop(params) {
  const response = await fetch(`${API_BASE}/esop`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(params),
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || 'ESOP calculation failed');
  return result;
}

/**
 * Generate counter-offer email
 * @param {object} params - Email generation params
 * @returns {Promise<string>} Generated email
 */
export async function generateCounterEmail(params) {
  const response = await fetch(`${API_BASE}/email`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(params),
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || 'Email generation failed');
  return result.email;
}

/**
 * HR Role-Play turn
 * @param {object} params - Roleplay params
 * @returns {Promise<object>} { hrResponse, turnNumber, isComplete }
 */
export async function roleplayTurn(params) {
  const response = await fetch(`${API_BASE}/roleplay`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(params),
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || 'Roleplay turn failed');
  return result;
}

/**
 * Generate negotiation scorecard
 * @param {object} params - Scorecard params
 * @returns {Promise<object>} Scorecard
 */
export async function generateScorecard(params) {
  const response = await fetch(`${API_BASE}/scorecard`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(params),
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || 'Scorecard generation failed');
  return result.scorecard;
}

/**
 * List user's saved offers
 * @returns {Promise<Array>} Saved offers
 */
export async function listMyOffers() {
  const response = await fetch(`${API_BASE}/my-offers`, {
    headers: authHeaders(false),
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || 'Failed to list offers');
  return result.offers || [];
}

export default {
  compareOffers,
  calculateEsop,
  generateCounterEmail,
  roleplayTurn,
  generateScorecard,
  listMyOffers,
};