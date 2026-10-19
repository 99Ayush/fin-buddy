/**
 * MoneyPlan Module - Public Interface (P2 Owned)
 * P1 does NOT modify - placeholder for shell mounting
 */

const express = require('express');
const router = express.Router();

// Import sub‑routes
const scoreRoute = require('./score');
router.use('/score', scoreRoute);

const goalsRoute = require('./goals');
router.use('/goals', goalsRoute);

// ─────────────────────────────────────────────────────────────
// ROUTE: POST /api/moneyplan/emi
// EMI, total interest, total repayment + amortization table
// ─────────────────────────────────────────────────────────────
router.post('/emi', (req, res) => {
  try {
    const {
      principal = 0,
      annualInterestRate = 0,   // e.g. 8.5 for 8.5%
      tenureMonths = 0,
    } = req.body;

    if (principal <= 0 || annualInterestRate <= 0 || tenureMonths <= 0) {
      return res.status(400).json({ error: 'principal, annualInterestRate, and tenureMonths must be positive numbers.' });
    }

    const r = annualInterestRate / 12 / 100; // monthly rate
    const n = tenureMonths;
    const emi = Math.round((principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
    const totalPayment = emi * n;
    const totalInterest = totalPayment - principal;

    // First 12 months amortization (to keep response size manageable)
    const schedule = [];
    let balance = principal;
    for (let i = 1; i <= Math.min(n, 12); i++) {
      const interestComp = Math.round(balance * r);
      const principalComp = emi - interestComp;
      balance = Math.max(0, balance - principalComp);
      schedule.push({ month: i, emi, principalComp, interestComp, closingBalance: Math.round(balance) });
    }

    res.json({
      status: 'ok',
      emi,
      totalPayment: Math.round(totalPayment),
      totalInterest: Math.round(totalInterest),
      principal: Math.round(principal),
      tenureMonths: n,
      annualInterestRate,
      amortizationSample: schedule,
      disclaimer: 'EMI is an estimate. Actual EMI may differ due to processing fees, rounding, or prepayments.',
    });
  } catch (err) {
    console.error('[moneyplan] emi error', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// ROUTE: POST /api/moneyplan/prepay-vs-invest
// Compare paying off a loan early vs investing the same amount
// ─────────────────────────────────────────────────────────────
router.post('/prepay-vs-invest', (req, res) => {
  try {
    const {
      loanOutstanding = 0,
      loanInterestRate = 0,    // annual % e.g. 9
      remainingMonths = 0,
      prepayAmount = 0,
      investmentReturnRate = 12, // annual % e.g. 12 (equity MF estimate)
      investmentHorizonMonths = 0,
    } = req.body;

    if (prepayAmount <= 0) return res.status(400).json({ error: 'prepayAmount must be positive.' });

    // Option A: Prepay loan
    const r = loanInterestRate / 12 / 100;
    const n = remainingMonths;
    const currentEmi = n > 0 && r > 0
      ? Math.round((loanOutstanding * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1))
      : 0;
    const totalInterestWithout = currentEmi * n - loanOutstanding;
    // After prepayment, recalculate interest saved (simplified: interest on prepay amount for remaining tenure)
    const interestSaved = prepayAmount * r * n;

    // Option B: Invest instead
    const ir = investmentReturnRate / 12 / 100;
    const h = investmentHorizonMonths || remainingMonths;
    const investedValue = Math.round(prepayAmount * Math.pow(1 + ir, h));
    const investmentGain = investedValue - prepayAmount;

    const netBenefit = investmentGain - interestSaved;

    res.json({
      status: 'ok',
      prepayOption: {
        prepayAmount: Math.round(prepayAmount),
        estimatedInterestSaved: Math.round(interestSaved),
        benefit: Math.round(interestSaved),
        description: `Prepaying ₹${prepayAmount.toLocaleString('en-IN')} saves ~₹${Math.round(interestSaved).toLocaleString('en-IN')} in interest.`,
      },
      investOption: {
        prepayAmount: Math.round(prepayAmount),
        investedValueAfter: investedValue,
        estimatedGain: Math.round(investmentGain),
        assumedReturnRate: `${investmentReturnRate}% p.a.`,
        horizonMonths: h,
        description: `Investing ₹${prepayAmount.toLocaleString('en-IN')} at ${investmentReturnRate}% for ${h} months grows to ~₹${investedValue.toLocaleString('en-IN')}.`,
      },
      recommendation: netBenefit > 0
        ? `Investing appears to generate ~₹${Math.round(netBenefit).toLocaleString('en-IN')} more than prepaying, assuming ${investmentReturnRate}% returns.`
        : `Prepaying appears to save ~₹${Math.round(-netBenefit).toLocaleString('en-IN')} more than investing at ${investmentReturnRate}% returns.`,
      disclaimer: 'Investment returns are NOT guaranteed. Past performance does not indicate future results. This is educational only.',
      assumptions: [
        `Loan interest rate: ${loanInterestRate}% p.a.`,
        `Investment return: ${investmentReturnRate}% p.a. (not guaranteed)`,
        `Horizon: ${h} months`,
        'No tax on investment gains assumed for simplicity.',
      ],
    });
  } catch (err) {
    console.error('[moneyplan] prepay-vs-invest error', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// ROUTE: POST /api/moneyplan/regret
// "What if I had started investing X earlier?" simulator
// ─────────────────────────────────────────────────────────────
router.post('/regret', (req, res) => {
  try {
    const {
      monthlyAmount = 0,       // ₹ per month they wish they had invested
      yearsAgo = 5,            // how many years ago they should have started
      annualReturnRate = 12,   // % e.g. 12 for equity
      scenarioLabel = 'SIP',   // label for the scenario
    } = req.body;

    if (monthlyAmount <= 0 || yearsAgo <= 0) {
      return res.status(400).json({ error: 'monthlyAmount and yearsAgo must be positive.' });
    }

    const r = annualReturnRate / 12 / 100;
    const n = yearsAgo * 12;

    // Future Value of SIP: FV = P × [((1 + r)^n - 1) / r] × (1 + r)
    const futureValue = Math.round(monthlyAmount * (((Math.pow(1 + r, n) - 1) / r) * (1 + r)));
    const totalInvested = monthlyAmount * n;
    const wealthGained = futureValue - totalInvested;

    // If they start today instead — what they get in same period
    const futureValueFromToday = Math.round(monthlyAmount * (((Math.pow(1 + r, n) - 1) / r) * (1 + r)));

    // Daily cost equivalent of the missed wealth
    const dailyCost = Math.round(wealthGained / (yearsAgo * 365));

    res.json({
      status: 'ok',
      scenario: scenarioLabel,
      monthlyAmount: Math.round(monthlyAmount),
      yearsAgo,
      totalInvested: Math.round(totalInvested),
      portfolioValueIfStartedEarlier: futureValue,
      wealthMissed: Math.round(wealthGained),
      equivalentDailyCost: dailyCost,
      message: `If you had invested ₹${monthlyAmount.toLocaleString('en-IN')}/mo for ${yearsAgo} years at ${annualReturnRate}% p.a., your portfolio would be worth ~₹${futureValue.toLocaleString('en-IN')} today. Starting now gives the same outcome in ${yearsAgo} more years.`,
      encouragement: 'The best time to start was then. The second best time is today.',
      disclaimer: 'Hypothetical projections using compound interest. Investment returns are NOT guaranteed.',
      assumptions: [
        `Monthly SIP: ₹${monthlyAmount.toLocaleString('en-IN')}`,
        `Return rate: ${annualReturnRate}% p.a. (not guaranteed)`,
        `Duration: ${yearsAgo} years (${n} months)`,
        'No inflation adjustment applied.',
      ],
    });
  } catch (err) {
    console.error('[moneyplan] regret error', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/', (req, res) => {
  res.json({ message: 'MoneyPlan module - P2 owned', endpoints: ['/health', '/goals', '/score', '/emi', '/prepay-vs-invest', '/regret'] });
});

router.get('/health', (req, res) => res.json({ status: 'ok', module: 'moneyplan' }));

module.exports = {
  router,
  basePath: '/moneyplan',
};