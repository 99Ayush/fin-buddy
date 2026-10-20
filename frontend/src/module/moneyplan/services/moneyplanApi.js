// moneyplanApi.js: all HTTP calls for the Money Plan module (P2)
const BASE = '/api/moneyplan';

const get = async (path, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  const url = `${BASE}${path}${qs ? '?' + qs : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
};

const post = async (path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
};

/** GET /api/moneyplan/score — financial health score */
export const getHealthScore = (params) => get('/score', params);

/** GET /api/moneyplan/goals — list all goals */
export const getGoals = () => get('/goals');

/** POST /api/moneyplan/goals — create a goal */
export const createGoal = (body) => post('/goals', body);

/** POST /api/moneyplan/emi — loan EMI calculator */
export const calcEmi = (params) => post('/emi', params);

/** POST /api/moneyplan/prepay-vs-invest — prepay vs invest simulator */
export const prepayVsInvest = (params) => post('/prepay-vs-invest', params);

/** POST /api/moneyplan/regret — regret simulator */
export const regretSimulator = (params) => post('/regret', params);
