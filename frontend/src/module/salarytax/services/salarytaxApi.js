// salarytaxApi.js: all HTTP calls for the Salary & Tax module (P2)
const BASE = '/api/salarytax';

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

/** POST /api/salarytax/calculate — in-hand salary calculation */
export const calculateInHand = (params) => post('/calculate', params);

/** POST /api/salarytax/regime-compare — side-by-side old vs new */
export const regimeCompare = (params) => post('/regime-compare', params);

/** POST /api/salarytax/payslip-audit — flag payslip inconsistencies */
export const payslipAudit = (params) => post('/payslip-audit', params);

/** POST /api/salarytax/savings-gap — savings shortfall + unused deductions */
export const savingsGap = (params) => post('/savings-gap', params);

/** POST /api/salarytax/tds-estimate — monthly TDS + advance tax schedule */
export const tdsEstimate = (params) => post('/tds-estimate', params);
