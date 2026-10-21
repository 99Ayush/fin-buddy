/**
 * homeApi.js — all HTTP calls for the Home module.
 * Uses the shared api client (credentials: include for cookie auth).
 */
import { api } from '../../../services/api';

/** GET /api/home/overview — user profile + document counts */
export async function getOverview() {
  return api.get('/home/overview');
}

/** GET /api/home/timeline — chronological document events */
export async function getTimeline() {
  return api.get('/home/timeline');
}

/** GET /api/home/activity — recent user activity */
export async function getActivity() {
  return api.get('/home/activity');
}

/** GET /api/home/next-steps — rule-based recommended actions */
export async function getNextSteps() {
  return api.get('/home/next-steps');
}

/** GET /api/home/market-movers — market movers (mock/demo when no provider) */
export async function getMarketMovers() {
  return api.get('/home/market-movers');
}
