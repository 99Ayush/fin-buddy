/**
 * SalaryTax Module - Public Interface (P2 Owned)
 * P1 imports ONLY from this file for deterministic tax calculations
 */

const express = require('express');
const router = express.Router();

// Placeholder - P2 will implement
router.post('/calculate', (req, res) => {
  res.status(501).json({ error: 'Not implemented - P2 module' });
});

router.post('/in-hand', (req, res) => {
  res.status(501).json({ error: 'Not implemented - P2 module' });
});

// Service interface for programmatic use (P1 calls this)
async function calculateInHand(params, userId) {
  // This is the deterministic calculator P1 uses
  // P2 owns the implementation - P1 only calls this interface
  const {
    ctcAnnual = 0,
    basicAnnual = 0,
    hraAnnual = 0,
    specialAllowanceAnnual = 0,
    pfEmployeeAnnual = 0,
    professionalTaxMonthly = 200,
    regime = 'new',
    cityType = 'metro',
    age = 30,
  } = params;

  // Simplified deterministic calculation (P2 will replace with full implementation)
  const grossMonthly = (basicAnnual + hraAnnual + specialAllowanceAnnual) / 12;
  const pfMonthly = pfEmployeeAnnual / 12 || (basicAnnual * 0.12) / 12;
  const profTaxMonthly = professionalTaxMonthly;

  // Tax calculation (simplified - P2 has full implementation)
  const taxableAnnual = basicAnnual + hraAnnual + specialAllowanceAnnual - pfEmployeeAnnual - 150000; // 80C
  let annualTax = 0;

  if (regime === 'new') {
    // New regime slabs FY 2024-25
    const slabs = [
      { limit: 300000, rate: 0 },
      { limit: 600000, rate: 0.05 },
      { limit: 900000, rate: 0.1 },
      { limit: 1200000, rate: 0.15 },
      { limit: 1500000, rate: 0.2 },
      { limit: Infinity, rate: 0.3 },
    ];
    let remaining = Math.max(0, taxableAnnual);
    let prev = 0;
    for (const s of slabs) {
      const inSlab = Math.min(remaining, s.limit - prev);
      if (inSlab <= 0) break;
      annualTax += inSlab * s.rate;
      remaining -= inSlab;
      prev = s.limit;
    }
    if (taxableAnnual <= 700000) annualTax = Math.max(0, annualTax - 25000);
  } else {
    // Old regime
    const slabs = [
      { limit: 250000, rate: 0 },
      { limit: 500000, rate: 0.05 },
      { limit: 1000000, rate: 0.2 },
      { limit: Infinity, rate: 0.3 },
    ];
    let remaining = Math.max(0, taxableAnnual);
    let prev = 0;
    for (const s of slabs) {
      const inSlab = Math.min(remaining, s.limit - prev);
      if (inSlab <= 0) break;
      annualTax += inSlab * s.rate;
      remaining -= inSlab;
      prev = s.limit;
    }
    if (taxableAnnual <= 500000) annualTax = Math.max(0, annualTax - 12500);
  }

  annualTax = Math.round(annualTax * 1.04); // Cess
  const monthlyTax = annualTax / 12;
  const netMonthly = grossMonthly - pfMonthly - profTaxMonthly - monthlyTax;

  return {
    grossMonthly: Math.round(grossMonthly),
    pfMonthly: Math.round(pfMonthly),
    profTaxMonthly: Math.round(profTaxMonthly),
    taxMonthly: Math.round(monthlyTax),
    netMonthly: Math.round(netMonthly),
    annualTax: Math.round(annualTax),
    regimeUsed: regime,
    breakdown: {
      formula: 'Net = Gross/12 - PF/12 - ProfTax - Tax(regime)',
      inputs: { basicAnnual, hraAnnual, specialAllowanceAnnual, pfEmployeeAnnual },
      assumptions: { regime, cityType, age, section80C: 150000, hraExemption: 'metro 50% basic' },
    },
  };
}

module.exports = {
  router,
  service: { calculateInHand },
  basePath: '/salarytax',
};