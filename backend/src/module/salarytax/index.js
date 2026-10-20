/**
 * SalaryTax Module - Public Interface (P2 Owned)
 * P1 imports ONLY from this file for deterministic tax calculations
 *
 * Source: Income Tax Act, Finance Act 2024 (FY 2024-25 / AY 2025-26)
 * Last verified: October 2024
 */

const express = require('express');
const router = express.Router();

// ─────────────────────────────────────────────────────────────
// ROUTE: POST /api/salarytax/calculate
// ─────────────────────────────────────────────────────────────
router.post('/calculate', async (req, res) => {
  try {
    const result = await calculateInHand(req.body);
    res.json(result);
  } catch (err) {
    console.error('[salarytax] calculate error', err);
    res.status(500).json({ error: err.message });
  }
});

// ROUTE: POST /api/salarytax/in-hand  (alias)
router.post('/in-hand', async (req, res) => {
  try {
    const result = await calculateInHand(req.body);
    res.json(result);
  } catch (err) {
    console.error('[salarytax] in-hand error', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// HELPER: Apply tax slabs and return breakdown per slab
// ─────────────────────────────────────────────────────────────
function applySlabs(taxableIncome, slabs) {
  let tax = 0;
  let prev = 0;
  const slabBreakdown = [];

  for (const s of slabs) {
    const inSlab = Math.min(Math.max(0, taxableIncome - prev), s.limit - prev);
    if (inSlab <= 0) {
      prev = s.limit;
      continue;
    }
    const slabTax = inSlab * s.rate;
    tax += slabTax;
    slabBreakdown.push({
      from: prev,
      to: Math.min(s.limit, taxableIncome),
      rate: `${s.rate * 100}%`,
      taxOnSlab: Math.round(slabTax),
    });
    prev = s.limit;
  }

  return { tax, slabBreakdown };
}

// ─────────────────────────────────────────────────────────────
// HELPER: Surcharge rates (same for old & new regime)
// ─────────────────────────────────────────────────────────────
function getSurcharge(taxableIncome, baseTax, regime) {
  // New regime: surcharge cap at 25% (Budget 2023 onward)
  const maxSurchargeRate = regime === 'new' ? 0.25 : 0.37;

  if (taxableIncome <= 5000000) return 0;
  if (taxableIncome <= 10000000) return baseTax * 0.10;
  if (taxableIncome <= 20000000) return baseTax * 0.15;
  if (taxableIncome <= 50000000) return baseTax * Math.min(0.25, maxSurchargeRate);
  return baseTax * maxSurchargeRate;
}

// ─────────────────────────────────────────────────────────────
// HELPER: HRA exemption (Old Regime only — Sec 10(13A))
// Exempt = min(actualHRA, 50/40% of basic, rent paid - 10% basic)
// ─────────────────────────────────────────────────────────────
function calcHraExemption({ hraAnnual, basicAnnual, rentPaidAnnual = 0, cityType = 'metro' }) {
  if (!rentPaidAnnual || rentPaidAnnual <= 0) return 0; // No rent paid → no exemption

  const rule1 = hraAnnual;                                          // Actual HRA received
  const rule2 = basicAnnual * (cityType === 'metro' ? 0.5 : 0.4);  // 50% or 40% of basic
  const rule3 = Math.max(0, rentPaidAnnual - basicAnnual * 0.1);   // Rent - 10% of basic

  return Math.min(rule1, rule2, rule3);
}

// ─────────────────────────────────────────────────────────────
// SERVICE: calculateInHand — full FY 2024-25 computation
// P1 imports this function; DO NOT change the signature.
// ─────────────────────────────────────────────────────────────
async function calculateInHand(params, userId) {
  const {
    // Salary components (annual)
    ctcAnnual          = 0,
    basicAnnual        = 0,
    hraAnnual          = 0,
    specialAllowanceAnnual = 0,
    pfEmployeeAnnual   = 0,       // Employee PF contribution (annual)
    pfEmployerAnnual   = 0,       // Employer PF (not taxable, just for CTC reconciliation)
    gratuityAnnual     = 0,       // Gratuity (not taxable up to statutory limit)
    bonusAnnual        = 0,       // Fully taxable bonus
    otherTaxableAnnual = 0,       // Any other fully taxable allowances

    // Deductions (annual) — Old Regime only
    section80C         = 0,       // PF + ELSS + LIC etc. (max ₹1,50,000)
    section80D         = 0,       // Health insurance premium (max ₹25,000 / ₹50,000 senior)
    section80CCD1B     = 0,       // NPS additional (max ₹50,000)
    section24b         = 0,       // Home loan interest (max ₹2,00,000 self-occupied)
    homeLoanPrincipal  = 0,       // Under 80C — included in section80C cap

    // HRA exemption inputs (Old Regime)
    rentPaidAnnual     = 0,       // Actual rent paid (0 → no HRA exemption)

    // Other inputs
    professionalTaxAnnual = 2400, // Max ₹2,400/yr (deductible in old regime)
    regime             = 'new',   // 'new' | 'old'
    cityType           = 'metro', // 'metro' | 'non-metro'
    age                = 30,      // Used for senior-citizen rebate thresholds
    financialYear      = '2024-25',
  } = params;

  // ── 1. Gross taxable salary (before regime-specific deductions) ──────────────
  const grossAnnual = basicAnnual + hraAnnual + specialAllowanceAnnual
                    + bonusAnnual + otherTaxableAnnual;

  // ── 2. Regime-specific deductions ────────────────────────────────────────────
  let taxableIncome = 0;
  const deductionLog = {};

  if (regime === 'new') {
    // NEW REGIME FY 2024-25 (Finance Act 2024)
    // Standard deduction: ₹75,000 (increased from ₹50,000 in Budget 2024)
    const stdDeduction = Math.min(75000, grossAnnual);
    deductionLog.standardDeduction = stdDeduction;
    // No HRA exemption, no 80C/80D in new regime
    taxableIncome = Math.max(0, grossAnnual - stdDeduction);

  } else {
    // OLD REGIME FY 2024-25
    // Standard deduction: ₹50,000
    const stdDeduction = Math.min(50000, grossAnnual);
    deductionLog.standardDeduction = stdDeduction;

    // HRA exemption u/s 10(13A)
    const hraExemption = calcHraExemption({ hraAnnual, basicAnnual, rentPaidAnnual, cityType });
    deductionLog.hraExemption = Math.round(hraExemption);

    // Professional tax deduction u/s 16(iii)
    deductionLog.professionalTax = professionalTaxAnnual;

    // Chapter VI-A deductions
    const cap80C = Math.min(section80C + pfEmployeeAnnual, 150000); // PF counts under 80C
    deductionLog.section80C = Math.round(cap80C);

    const cap80D = Math.min(section80D, age >= 60 ? 50000 : 25000);
    deductionLog.section80D = Math.round(cap80D);

    const cap80CCD1B = Math.min(section80CCD1B, 50000);
    deductionLog.section80CCD1B = Math.round(cap80CCD1B);

    const cap24b = Math.min(section24b, 200000);
    deductionLog.section24b = Math.round(cap24b);

    const totalDeductions = stdDeduction + hraExemption + professionalTaxAnnual
                          + cap80C + cap80D + cap80CCD1B + cap24b;
    deductionLog.totalDeductions = Math.round(totalDeductions);

    taxableIncome = Math.max(0, grossAnnual - totalDeductions);
  }

  deductionLog.taxableIncome = Math.round(taxableIncome);

  // ── 3. Tax on taxable income (slab-based) ─────────────────────────────────────
  let baseTax = 0;
  let slabBreakdown = [];

  if (regime === 'new') {
    // FY 2024-25 New Regime slabs (Finance Act 2024)
    // Source: Section 115BAC as amended by Finance Act 2024
    const newSlabs = [
      { limit: 300000,   rate: 0    },
      { limit: 700000,   rate: 0.05 },
      { limit: 1000000,  rate: 0.10 },
      { limit: 1200000,  rate: 0.15 },
      { limit: 1500000,  rate: 0.20 },
      { limit: Infinity, rate: 0.30 },
    ];
    ({ tax: baseTax, slabBreakdown } = applySlabs(taxableIncome, newSlabs));

    // Section 87A Rebate — New Regime: full rebate if taxable ≤ ₹7,00,000
    if (taxableIncome <= 700000) {
      deductionLog.rebate87A = Math.round(baseTax);
      baseTax = 0;
    } else {
      deductionLog.rebate87A = 0;
    }

  } else {
    // FY 2024-25 Old Regime slabs
    const oldSlabs = age >= 80
      ? [ // Super senior citizen (80+): no tax up to ₹5L
          { limit: 500000,   rate: 0    },
          { limit: 1000000,  rate: 0.20 },
          { limit: Infinity, rate: 0.30 },
        ]
      : age >= 60
      ? [ // Senior citizen (60-79): no tax up to ₹3L
          { limit: 300000,   rate: 0    },
          { limit: 500000,   rate: 0.05 },
          { limit: 1000000,  rate: 0.20 },
          { limit: Infinity, rate: 0.30 },
        ]
      : [ // Below 60
          { limit: 250000,   rate: 0    },
          { limit: 500000,   rate: 0.05 },
          { limit: 1000000,  rate: 0.20 },
          { limit: Infinity, rate: 0.30 },
        ];

    ({ tax: baseTax, slabBreakdown } = applySlabs(taxableIncome, oldSlabs));

    // Section 87A Rebate — Old Regime: rebate up to ₹12,500 if taxable ≤ ₹5,00,000
    if (taxableIncome <= 500000) {
      const rebate = Math.min(baseTax, 12500);
      deductionLog.rebate87A = Math.round(rebate);
      baseTax = Math.max(0, baseTax - rebate);
    } else {
      deductionLog.rebate87A = 0;
    }
  }

  // ── 4. Surcharge ──────────────────────────────────────────────────────────────
  const surcharge = getSurcharge(taxableIncome, baseTax, regime);

  // ── 5. Health & Education Cess: 4% on (tax + surcharge) ─────────────────────
  const taxPlusSurcharge = baseTax + surcharge;
  const cess = taxPlusSurcharge * 0.04;

  const annualTax = Math.round(taxPlusSurcharge + cess);

  // ── 6. Monthly take-home breakdown ───────────────────────────────────────────
  const grossMonthly    = grossAnnual / 12;
  const pfMonthly       = pfEmployeeAnnual > 0
                          ? pfEmployeeAnnual / 12
                          : (basicAnnual * 0.12) / 12;  // Default: 12% of basic
  const profTaxMonthly  = professionalTaxAnnual / 12;
  const taxMonthly      = annualTax / 12;
  const netMonthly      = grossMonthly - pfMonthly - profTaxMonthly - taxMonthly;

  return {
    // Monthly figures (primary output)
    grossMonthly:    Math.round(grossMonthly),
    pfMonthly:       Math.round(pfMonthly),
    profTaxMonthly:  Math.round(profTaxMonthly),
    taxMonthly:      Math.round(taxMonthly),
    netMonthly:      Math.round(netMonthly),

    // Annual figures
    grossAnnual:     Math.round(grossAnnual),
    annualTax:       Math.round(annualTax),
    annualNet:       Math.round(netMonthly * 12),

    // Tax components
    taxComponents: {
      baseTax:    Math.round(baseTax),
      surcharge:  Math.round(surcharge),
      cess:       Math.round(cess),
      total:      annualTax,
    },

    // Deduction log (transparent audit trail)
    deductions: deductionLog,

    // Slab-level breakdown
    slabBreakdown,

    // Metadata
    regimeUsed:     regime,
    financialYear,
    disclaimer:     'Estimates only. Consult a tax professional for official calculations.',
    sourceNote:     'Slabs per Finance Act 2024 (FY 2024-25 / AY 2025-26)',
  };
}

// ─────────────────────────────────────────────────────────────
// ROUTE: POST /api/salarytax/regime-compare
// Runs calculateInHand for BOTH regimes and returns side-by-side diff
// ─────────────────────────────────────────────────────────────
router.post('/regime-compare', async (req, res) => {
  try {
    const [newR, oldR] = await Promise.all([
      calculateInHand({ ...req.body, regime: 'new' }),
      calculateInHand({ ...req.body, regime: 'old' }),
    ]);
    const saving = oldR.annualTax - newR.annualTax; // positive = new is better
    res.json({
      new: newR,
      old: oldR,
      betterRegime: saving >= 0 ? 'new' : 'old',
      annualSaving: Math.abs(saving),
      monthlySaving: Math.round(Math.abs(saving) / 12),
      disclaimer: 'Estimates only. Consult a tax professional.',
      sourceNote: 'Finance Act 2024 (FY 2024-25 / AY 2025-26)',
    });
  } catch (err) {
    console.error('[salarytax] regime-compare error', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// ROUTE: POST /api/salarytax/payslip-audit
// Compares declared payslip vs calculated expected; flags anomalies
// ─────────────────────────────────────────────────────────────
router.post('/payslip-audit', async (req, res) => {
  try {
    const {
      basicAnnual = 0,
      hraAnnual = 0,
      pfEmployeeAnnual = 0,
      professionalTaxAnnual = 2400,
      // Payslip actuals (monthly)
      actualBasicMonthly = 0,
      actualHraMonthly = 0,
      actualPfMonthly = 0,
      actualProfTaxMonthly = 0,
      actualTdsMonthly = 0,
      actualNetMonthly = 0,
      regime = 'new',
    } = req.body;

    const flags = [];

    // 1. PF check — statutory minimum: 12% of basic (capped at ₹15,000 basic → ₹1,800/mo)
    const minPfMonthly = Math.min((basicAnnual / 12) * 0.12, 1800);
    if (actualPfMonthly > 0 && actualPfMonthly < minPfMonthly - 10) {
      flags.push({
        field: 'PF (Employee)',
        severity: 'HIGH',
        message: `Your payslip shows PF of ₹${actualPfMonthly}/mo. Statutory minimum is ₹${Math.round(minPfMonthly)}/mo (12% of basic, capped at ₹1,800).`,
        rule: 'EPF Act 1952 — 12% employee contribution on basic wages',
      });
    }

    // 2. Basic vs HRA check — HRA > 50% of basic is unusual (metro)
    if (actualHraMonthly > actualBasicMonthly * 0.55) {
      flags.push({
        field: 'HRA',
        severity: 'MEDIUM',
        message: `HRA (₹${actualHraMonthly}/mo) exceeds 50% of basic (₹${actualBasicMonthly}/mo). Verify this with your offer letter.`,
        rule: 'Typical HRA is 40–50% of basic for metro cities.',
      });
    }

    // 3. Professional tax check — max ₹200/mo
    if (actualProfTaxMonthly > 200) {
      flags.push({
        field: 'Professional Tax',
        severity: 'HIGH',
        message: `Professional Tax of ₹${actualProfTaxMonthly}/mo exceeds the statutory maximum of ₹200/mo (₹2,400/yr).`,
        rule: 'State Professional Tax Act — max ₹2,500/yr nationwide.',
      });
    }

    // 4. Cross-check TDS vs calculated
    const calculated = await calculateInHand({ basicAnnual, hraAnnual, pfEmployeeAnnual, professionalTaxAnnual, regime });
    const expectedTds = calculated.taxMonthly;
    if (actualTdsMonthly > 0 && Math.abs(actualTdsMonthly - expectedTds) > expectedTds * 0.2) {
      flags.push({
        field: 'TDS',
        severity: 'MEDIUM',
        message: `Your payslip TDS (₹${actualTdsMonthly}/mo) differs from estimated (₹${expectedTds}/mo) by more than 20%. Check if bonus/arrears are included.`,
        rule: 'TDS should match your annual tax liability divided by 12.',
      });
    }

    // 5. Net salary sanity check
    const expectedNet = calculated.netMonthly;
    if (actualNetMonthly > 0 && Math.abs(actualNetMonthly - expectedNet) > expectedNet * 0.15) {
      flags.push({
        field: 'Net Salary',
        severity: 'LOW',
        message: `Net salary on payslip (₹${actualNetMonthly}) differs from estimated take-home (₹${expectedNet}) by more than 15%. May include variable pay, arrears, or unlisted deductions.`,
        rule: 'Verify with your HR for a full deduction breakdown.',
      });
    }

    res.json({
      status: 'ok',
      flagCount: flags.length,
      flags,
      calculated,
      disclaimer: 'Flags indicate possible inconsistencies only — not proof of error. Verify with your employer and HR.',
    });
  } catch (err) {
    console.error('[salarytax] payslip-audit error', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// ROUTE: POST /api/salarytax/savings-gap
// Computes current savings vs target and shows shortfall
// ─────────────────────────────────────────────────────────────
router.post('/savings-gap', (req, res) => {
  try {
    const {
      netMonthly = 0,
      currentMonthlySavings = 0,
      targetSavingsRate = 0.3, // 30% default recommendation
      section80C = 0,
      section80D = 0,
      section80CCD1B = 0,
    } = req.body;

    const targetMonthlySavings = netMonthly * targetSavingsRate;
    const gap = Math.max(0, targetMonthlySavings - currentMonthlySavings);
    const actualRate = netMonthly > 0 ? currentMonthlySavings / netMonthly : 0;

    // Unused deduction headroom (old regime)
    const unused80C = Math.max(0, 150000 - section80C);
    const unused80D = Math.max(0, 25000 - section80D);
    const unused80CCD1B = Math.max(0, 50000 - section80CCD1B);

    const suggestions = [];
    if (unused80C > 0) suggestions.push({ label: 'Section 80C (ELSS/PPF/LIC)', unusedAnnual: unused80C, note: 'Invest ₹' + unused80C.toLocaleString('en-IN') + ' more to max 80C deduction' });
    if (unused80D > 0) suggestions.push({ label: 'Section 80D (Health Insurance)', unusedAnnual: unused80D, note: 'Health insurance premium up to ₹25,000 deductible' });
    if (unused80CCD1B > 0) suggestions.push({ label: 'NPS 80CCD(1B)', unusedAnnual: unused80CCD1B, note: 'Extra ₹50,000 NPS deduction over and above 80C' });

    res.json({
      status: 'ok',
      netMonthly: Math.round(netMonthly),
      currentMonthlySavings: Math.round(currentMonthlySavings),
      targetMonthlySavings: Math.round(targetMonthlySavings),
      targetSavingsRate: `${Math.round(targetSavingsRate * 100)}%`,
      actualSavingsRate: `${Math.round(actualRate * 100)}%`,
      monthlySavingsGap: Math.round(gap),
      annualSavingsGap: Math.round(gap * 12),
      unusedDeductions: suggestions,
      disclaimer: 'Target savings rate of 30% is a general guideline, not personalised advice.',
    });
  } catch (err) {
    console.error('[salarytax] savings-gap error', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// ROUTE: POST /api/salarytax/tds-estimate
// Estimates monthly TDS + quarterly advance tax schedule
// ─────────────────────────────────────────────────────────────
router.post('/tds-estimate', async (req, res) => {
  try {
    const { otherIncomeAnnual = 0, ...salaryParams } = req.body;
    const salaryResult = await calculateInHand(salaryParams);

    const salariedTaxAnnual = salaryResult.annualTax;
    // TDS on other income is estimated at marginal rate (simplified)
    const otherTax = otherIncomeAnnual * 0.1; // 10% TDS flat estimate
    const totalTaxAnnual = salariedTaxAnnual + otherTax;
    const monthlyTds = Math.round(salariedTaxAnnual / 12);

    // Advance tax applicable only if tax liability > ₹10,000 after TDS
    // FY 2024-25 advance tax due dates (Section 207/208)
    const advanceTaxSchedule = totalTaxAnnual > 10000
      ? [
          { installment: '1st', dueDate: '15 Jun 2024', percentDue: 15, amountDue: Math.round(totalTaxAnnual * 0.15) },
          { installment: '2nd', dueDate: '15 Sep 2024', percentDue: 45, amountDue: Math.round(totalTaxAnnual * 0.45) },
          { installment: '3rd', dueDate: '15 Dec 2024', percentDue: 75, amountDue: Math.round(totalTaxAnnual * 0.75) },
          { installment: '4th', dueDate: '15 Mar 2025', percentDue: 100, amountDue: Math.round(totalTaxAnnual * 1.0) },
        ]
      : [];

    res.json({
      status: 'ok',
      salariedTaxAnnual,
      otherIncomeTaxEstimate: Math.round(otherTax),
      totalTaxAnnual: Math.round(totalTaxAnnual),
      monthlyTds,
      advanceTaxApplicable: totalTaxAnnual > 10000,
      advanceTaxSchedule,
      assumptions: [
        'TDS deducted monthly by employer covers salary tax.',
        'Other income TDS estimated at flat 10% — actual rate may differ.',
        'Advance tax required if net tax liability > ₹10,000 after TDS credit.',
        'Advance tax due dates per Section 208, Income Tax Act.',
      ],
      disclaimer: 'Estimates only. Consult a CA for advance tax computation.',
      sourceNote: 'Finance Act 2024 (FY 2024-25 / AY 2025-26)',
    });
  } catch (err) {
    console.error('[salarytax] tds-estimate error', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = {
  router,
  service: { calculateInHand },
  basePath: '/salarytax',
};