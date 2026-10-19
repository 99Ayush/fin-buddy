const request = require('supertest');
const app = require('../src/app');
const { maskText, initMaskSession } = require('../src/shared/ai/mask');
const detector = require('../src/module/documents/trapDetector');

const offer = (name, ctc) => ({
  documentType: 'offer_letter', company: { name },
  compensation: { ctcAnnual: ctc, ctcMonthly: Math.round(ctc / 12), fixedComponent: { baseSalary: ctc * 0.4, hra: ctc * 0.16, specialAllowance: ctc * 0.2, pfEmployee: ctc * 0.048, professionalTax: 2400 }, variableComponent: { performanceBonus: ctc * 0.1 } },
  contractualTerms: { noticePeriodDays: 30, bondPenaltyAmount: 0, bondDurationMonths: 0 },
});

describe('P1 core integration', () => {
  test('health endpoint works', async () => expect((await request(app).get('/health')).status).toBe(200));
  test('rejects document access without an authenticated caller id', async () => {
    const response = await request(app).get('/api/documents/not-a-real-id');
    expect(response.status).toBe(401);
  });
  test('masks Indian PII before analysis', () => {
    const masked = maskText('PAN ABCDE1234F, phone +91 9876543210, Aadhaar 1234 5678 9012', initMaskSession());
    expect(masked).not.toMatch(/ABCDE1234F|9876543210|1234 5678 9012/);
  });
  test('detects notice and bond traps', async () => {
    const flags = await detector.detectTraps('Notice period is 90 days. Training bond of ₹200000 applies for 24 months.');
    expect(flags.map(flag => flag.type)).toEqual(expect.arrayContaining(['NOTICE_PERIOD_TRAP', 'TRAINING_BOND']));
  });
  test('compares two offers with traceable in-hand calculation', async () => {
    const response = await request(app).post('/api/offers/compare').send({ manualOffers: [offer('A', 1800000), offer('B', 2000000)] });
    expect(response.status).toBe(200);
    expect(response.body.comparison).toHaveLength(7);
    expect(response.body.offers[0].metadata.monthlyInHand.formula).toBeTruthy();
  });
  test('returns ESOP projections', async () => {
    const response = await request(app).post('/api/offers/esop').send({ totalOptions: 1000, strikePrice: 10, totalCompanyShares: 1000000, currentValuation: 100000000 });
    expect(response.status).toBe(200);
    expect(response.body.projections.base).toHaveLength(5);
  });
});
