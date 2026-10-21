/**
 * Offers Module - Service Layer (offers.service.js)
 * Business logic for offer comparison, ESOP calculator, counter-email, roleplay
 */

const reportStore = require('../../shared/reportStore');
const { validateDocument } = require('../../shared/validator/documentSchema');
const salaryTaxModule = require('../salarytax'); // public P2 module interface only
const llm = require('../../shared/ai/llm');
const { fallbackTurn, fallbackScorecard } = require('./roleplayEngine');

/**
 * Compare 2-4 job offers side-by-side
 * @param {Array<object>} offers - Array of offer objects (from reportStore or manual)
 * @param {string} userId - For salarytax calculations
 * @returns {Promise<object>} Comparison matrix with "Why this number?" metadata
 */
async function compareOffers(offers, userId) {
  if (offers.length < 2 || offers.length > 4) {
    throw new Error('Comparison requires 2-4 offers');
  }

  const results = [];

  for (const offer of offers) {
    // Calculate monthly in-hand using P2's deterministic calculator
    const salaryCalc = await salaryTaxModule.service.calculateInHand({
      ctcAnnual: offer.compensation?.ctcAnnual || 0,
      basicAnnual: offer.compensation?.fixedComponent?.baseSalary || 0,
      hraAnnual: offer.compensation?.fixedComponent?.hra || 0,
      specialAllowanceAnnual: offer.compensation?.fixedComponent?.specialAllowance || 0,
      pfEmployeeAnnual: offer.compensation?.fixedComponent?.pfEmployee || 0,
      professionalTaxMonthly: offer.compensation?.fixedComponent?.professionalTax / 12 || 200,
      regime: 'new', // Default to new regime
      cityType: 'metro',
      age: 30,
    }, userId);

    const fixedMonthly = (offer.compensation?.fixedComponent?.baseSalary || 0) / 12 +
      (offer.compensation?.fixedComponent?.hra || 0) / 12 +
      (offer.compensation?.fixedComponent?.specialAllowance || 0) / 12;

    const variablePct = offer.compensation?.variableComponent?.performanceBonus
      ? (offer.compensation.variableComponent.performanceBonus / offer.compensation.ctcAnnual) * 100
      : 0;

    results.push({
      documentId: offer.documentId,
      companyName: offer.company?.name,
      ctcAnnual: offer.compensation?.ctcAnnual,
      ctcMonthly: offer.compensation?.ctcMonthly,
      monthlyInHand: salaryCalc.netMonthly,
      fixedMonthly,
      variablePct: Math.round(variablePct * 10) / 10,
      joiningBonus: offer.compensation?.joiningBonus || 0,
      noticePeriodDays: offer.contractualTerms?.noticePeriodDays,
      bondLiability: offer.contractualTerms?.bondPenaltyAmount || 0,
      bondDurationMonths: offer.contractualTerms?.bondDurationMonths || 0,
      // Metadata for "Why this number?" tooltips
      metadata: {
        ctcAnnual: { value: offer.compensation?.ctcAnnual, formula: 'Sum of all fixed + variable components', source: 'Offer letter' },
        monthlyInHand: {
          value: salaryCalc.netMonthly,
          formula: '(Gross annual salary − employee PF − professional tax − income tax) / 12',
          inputs: {
            grossAnnual: salaryCalc.grossAnnual,
            pfAnnual: salaryCalc.pfMonthly * 12,
            professionalTaxAnnual: salaryCalc.profTaxMonthly * 12,
            incomeTaxAnnual: salaryCalc.annualTax,
          },
          assumptions: ['New tax regime', 'Metro city', 'Age 30'],
          source: 'P2 SalaryTax calculator (deterministic)',
        },
        fixedMonthly: { value: fixedMonthly, formula: '(Basic + HRA + Special Allowance) / 12', inputs: { basic: offer.compensation?.fixedComponent?.baseSalary, hra: offer.compensation?.fixedComponent?.hra, special: offer.compensation?.fixedComponent?.specialAllowance }, source: 'Offer letter fixed components' },
        variablePct: { value: variablePct, formula: 'Performance Bonus / CTC × 100', inputs: { bonus: offer.compensation?.variableComponent?.performanceBonus, ctc: offer.compensation?.ctcAnnual }, source: 'Offer letter variable component' },
      },
    });
  }

  // Determine winners per row
  const rows = [
    { key: 'ctcAnnual', label: 'CTC (Annual)', higherIsBetter: true, format: 'currency' },
    { key: 'monthlyInHand', label: 'Monthly In-Hand', higherIsBetter: true, format: 'currency' },
    { key: 'fixedMonthly', label: 'Guaranteed Fixed/Month', higherIsBetter: true, format: 'currency' },
    { key: 'variablePct', label: 'Variable % of CTC', higherIsBetter: false, format: 'percent' },
    { key: 'joiningBonus', label: 'Joining Bonus', higherIsBetter: true, format: 'currency' },
    { key: 'noticePeriodDays', label: 'Notice Period (Days)', higherIsBetter: false, format: 'number' },
    { key: 'bondLiability', label: 'Bond Liability', higherIsBetter: false, format: 'currency' },
  ];

  const comparison = rows.map(row => {
    const values = results.map(r => r[row.key]);
    const bestIdx = row.higherIsBetter
      ? values.indexOf(Math.max(...values))
      : values.indexOf(Math.min(...values));

    return {
      ...row,
      values: results.map((r, i) => ({
        value: r[row.key],
        formatted: formatValue(r[row.key], row.format),
        isWinner: i === bestIdx,
        metadata: r.metadata[row.key],
      })),
    };
  });

  return { offers: results, comparison };
}

/**
 * ESOP & Equity Valuation Calculator
 * @param {object} params - ESOP parameters
 * @returns {Promise<object>} Year-by-year projections across Bear/Base/Bull scenarios
 */
async function calculateEsop(params) {
  const {
    totalOptions = 0,
    strikePrice = 0,
    totalCompanyShares = 1,
    cliffMonths = 12,
    vestingSchedule = [],
    currentValuation = 0,
    scenarios = { bear: 1.5, base: 5, bull: 12 },
  } = params;

  // Default 4-year annual vesting if not provided
  const schedule = vestingSchedule.length > 0
    ? vestingSchedule
    : [
        { month: 12, percentage: 25 },
        { month: 24, percentage: 25 },
        { month: 36, percentage: 25 },
        { month: 48, percentage: 25 },
      ];

  const ownershipPct = (totalOptions / totalCompanyShares) * 100;
  const exerciseCost = totalOptions * strikePrice;

  // Year-by-year projections
  const projections = {};
  const years = [1, 2, 3, 4, 5];

  // Determine whether currentValuation was given per share (e.g. ₹150) or company total (e.g. ₹100Cr)
  const isPerShare = Boolean(params.isPerShare) || (currentValuation > 0 && currentValuation < 100000 && totalCompanyShares > 10000);
  const currentPricePerShare = isPerShare ? currentValuation : (currentValuation / totalCompanyShares);

  for (const scenarioName of ['bear', 'base', 'bull']) {
    const multiple = scenarios[scenarioName];
    const exitPricePerShare = currentPricePerShare * multiple;

    projections[scenarioName] = years.map(year => {
      const vestedPct = schedule
        .filter(v => v.month <= year * 12)
        .reduce((sum, v) => sum + v.percentage, 0);
      const vestedOptions = Math.floor(totalOptions * vestedPct / 100);
      const grossValue = vestedOptions * exitPricePerShare;
      const netValue = grossValue - vestedOptions * strikePrice;

      // Tax calculation (simplified)
      // Perquisite tax on exercise: (FMV at exercise - strike) * options exercised
      // Capital gains on sale: (Sale price - FMV at exercise) * options
      // For projection, assume exercise at exit
      const perquisiteGain = vestedOptions * (exitPricePerShare - strikePrice);
      const perquisiteTax = perquisiteGain * 0.312; // 30% + 4% cess (highest slab)
      const netAfterTax = netValue - perquisiteTax;

      return {
        year,
        vestedPercentage: vestedPct,
        vestedOptions,
        exitPricePerShare: Math.round(exitPricePerShare * 100) / 100,
        grossValue: Math.round(grossValue),
        exerciseCost: Math.round(vestedOptions * strikePrice),
        netValue: Math.round(netValue),
        perquisiteTax: Math.round(perquisiteTax),
        netAfterTax: Math.round(netAfterTax),
      };
    });
  }

  return {
    inputs: { totalOptions, strikePrice, totalCompanyShares, currentValuation, ownershipPct: Math.round(ownershipPct * 10000) / 10000 },
    exerciseCost: Math.round(exerciseCost),
    vestingSchedule: schedule,
    projections,
    assumptions: {
      taxSlab: '30% + 4% cess (highest)',
      exerciseTiming: 'At exit (simplified)',
      capitalGains: 'Long-term (10% over 1L) not modeled separately',
      dilution: 'Not modeled',
    },
  };
}

/**
 * Generate AI Counter-Offer Email
 * @param {object} params - Negotiation parameters
 * @returns {Promise<string>} Formatted email
 */
async function generateCounterEmail(params) {
  const {
    currentOffer,
    targetCompany,
    asks = [],
    tone = 'polite_enthusiastic',
    competingOffers = [],
  } = params;

  // Build structured prompt with verified numbers only
  const verifiedNumbers = {
    currentCtc: currentOffer.compensation?.ctcAnnual,
    currentBase: currentOffer.compensation?.fixedComponent?.baseSalary,
    currentVariable: currentOffer.compensation?.variableComponent?.performanceBonus,
    currentNotice: currentOffer.contractualTerms?.noticePeriodDays,
    currentBond: currentOffer.contractualTerms?.bondPenaltyAmount,
    competingOffers: competingOffers.map(o => ({
      company: o.company?.name,
      ctc: o.compensation?.ctcAnnual,
    })),
  };

  const toneInstructions = {
    polite_enthusiastic: 'Polite, enthusiastic, and collaborative. Express genuine excitement about the role. Frame requests as "would it be possible" or "I would appreciate".',
    confident_assertive: 'Confident and professional. Direct about value brought. Use "I would like to propose" or "Based on market data". Firm but not aggressive.',
    high_leverage: 'High-leverage multi-offer stance. Reference competing offers explicitly. "I have another offer at X CTC" - use as leverage. Professional but clear about alternatives.',
  };

  const parseVal = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const str = String(val).replace(/[₹,\sLakhacCr]/gi, '');
    const num = parseFloat(str);
    if (isNaN(num)) return 0;
    return num < 100 ? num * 100000 : num;
  };

  const getFormattedLakh = (type) => {
    const ask = asks.find(a => a.type === type);
    if (!ask) return '0.0';
    return (parseVal(ask.targetValue) / 100000).toFixed(1);
  };

  const askDescriptions = {
    higher_base: `Increase base salary from ₹${(verifiedNumbers.currentBase/100000).toFixed(1)}L to ₹${getFormattedLakh('higher_base')}L (Target: ${asks.find(a=>a.type==='higher_base')?.targetValue})`,
    joining_bonus: `Add joining bonus of ₹${getFormattedLakh('joining_bonus')}L (Target: ${asks.find(a=>a.type==='joining_bonus')?.targetValue})`,
    reduce_notice: `Reduce notice period from ${verifiedNumbers.currentNotice} days to ${String(asks.find(a=>a.type==='reduce_notice')?.targetValue).replace(/\D/g, '') || 30} days`,
    reduce_bond: `Reduce/remove training bond of ₹${(verifiedNumbers.currentBond/100000).toFixed(1)}L`,
    better_esop: `Improve ESOP grant (current: ${currentOffer.compensation?.esop?.totalOptions || 0} options)`,
    signing_bonus: `Add signing bonus of ₹${getFormattedLakh('signing_bonus')}L (Target: ${asks.find(a=>a.type==='signing_bonus')?.targetValue})`,
  };

  const prompt = `Write a professional counter-offer email for a job negotiation.

CURRENT OFFER:
- Company: ${currentOffer.company?.name}
- CTC: ₹${(verifiedNumbers.currentCtc/100000).toFixed(1)}L
- Base: ₹${(verifiedNumbers.currentBase/100000).toFixed(1)}L
- Variable: ₹${(verifiedNumbers.currentVariable/100000).toFixed(1)}L
- Notice: ${verifiedNumbers.currentNotice} days
- Bond: ₹${(verifiedNumbers.currentBond/100000).toFixed(1)}L

NEGOTIATION ASKS:
${asks.map(a => `- ${askDescriptions[a.type] || a.type}: ${a.justification || ''}`).join('\n')}

COMPETING OFFERS:
${verifiedNumbers.competingOffers.length > 0
  ? verifiedNumbers.competingOffers.map(c => `- ${c.company}: ₹${(c.ctc/100000).toFixed(1)}L`).join('\n')
  : 'None disclosed'}

TONE: ${toneInstructions[tone]}

RULES:
- Use ONLY the verified numbers above. Do NOT invent numbers.
- Keep email concise (150-250 words).
- Include specific numbers in the asks.
- Professional sign-off.
- Subject line included.`;

  try {
    return await llm.callLlm(prompt, {
      system: 'You are a professional negotiation coach writing counter-offer emails. Use only provided numbers. Be concise and professional.',
      temperature: 0.3,
      maxTokens: 1024,
    });
  } catch (error) {
    const company = currentOffer.company?.name || 'your company';
    const requestLines = asks.map((ask) => askDescriptions[ask.type]).filter(Boolean).join('; ');
    return `Subject: Offer discussion\n\nDear Hiring Team,\n\nThank you for the offer to join ${company}. I am enthusiastic about the role and would appreciate discussing ${requestLines || 'the compensation structure'}. I believe this would better align the offer with the responsibilities and value I will bring.\n\nThank you for considering my request.\n\nSincerely,\nCandidate`;
  }
}

/**
 * HR Role-Play Simulation
 * @param {object} params - Roleplay parameters
 * @returns {Promise<object>} HR response + updated state
 */
async function roleplayTurn(params) {
  const {
    offer,
    conversationHistory = [],
    userMessage,
    persona = 'friendly_recruiter',
    turnNumber,
  } = params;

  const personas = {
    friendly_recruiter: 'Warm, collaborative, wants to help. Uses "we" language. Open to creative solutions. May need approval for big changes.',
    stubborn_enterprise: 'Rigid, policy-driven. "This is our standard package." Requires strong justification. Slow to concede. Escalates to "band limits".',
    aggressive_startup: 'Fast-paced, equity-focused. "Cash is tight but upside is huge." Pushes back on cash asks, offers more equity. May use pressure tactics.',
  };

  const systemPrompt = `You are an HR recruiter negotiating a job offer.

PERSONA: ${personas[persona] || personas.friendly_recruiter}

OFFER CONTEXT:
- Company: ${offer.company?.name}
- Role: ${offer.candidate?.designation || 'Software Engineer'}
- CTC: ₹${(offer.compensation?.ctcAnnual/100000).toFixed(1)}L
- Base: ₹${(offer.compensation?.fixedComponent?.baseSalary/100000).toFixed(1)}L
- Variable: ₹${(offer.compensation?.variableComponent?.performanceBonus/100000).toFixed(1)}L
- Notice: ${offer.contractualTerms?.noticePeriodDays} days
- Bond: ₹${(offer.contractualTerms?.bondPenaltyAmount/100000).toFixed(1)}L for ${offer.contractualTerms?.bondDurationMonths} months
- ESOP: ${offer.compensation?.esop?.totalOptions || 0} options @ ₹${offer.compensation?.esop?.strikePrice}/share

CONVERSATION HISTORY:
${conversationHistory.map((m, i) => `${i % 2 === 0 ? 'Candidate' : 'HR'}: ${m}`).join('\n')}

CANDIDATE'S LATEST MESSAGE: "${userMessage}"

RESPOND AS HR:
- Stay in character for the persona
- Reference specific numbers from the offer
- Be realistic - don't agree to everything immediately
- Push back appropriately for the persona
- Keep response to 2-3 sentences
- If this is turn 5, provide a natural closing`;

  try {
    const response = await llm.callLlm(systemPrompt, { temperature: 0.7, maxTokens: 300 });
    return { hrResponse: response, turnNumber: turnNumber + 1, isComplete: turnNumber >= 5 };
  } catch (error) {
    return fallbackTurn({ offer, persona, userMessage, turnNumber });
  }
}

/**
 * Generate Negotiation Scorecard
 * @param {object} params - Conversation history and offer
 * @returns {Promise<object>} Scorecard with scores and feedback
 */
async function generateScorecard(params) {
  const { conversationHistory, offer, persona } = params;

  const prompt = `Evaluate this negotiation conversation and provide a scorecard.

OFFER: ${offer.company?.name} - ₹${(offer.compensation?.ctcAnnual/100000).toFixed(1)}L CTC
PERSONA: ${persona}

CONVERSATION:
${conversationHistory.map((m, i) => `${i % 2 === 0 ? 'Candidate' : 'HR'}: ${m}`).join('\n')}

SCORE EACH DIMENSION (0-100):
1. Assertiveness - Did they clearly state wants and push back?
2. Professionalism - Tone, respect, relationship preservation?
3. Leverage Utilization - Used competing offers/data effectively?
4. Preparation - Referenced specific numbers, market data?
5. Creative Problem Solving - Proposed win-win alternatives?

OUTPUT JSON ONLY:
{
  "scores": { "assertiveness": 0, "professionalism": 0, "leverageUtilization": 0, "preparation": 0, "creativeProblemSolving": 0 },
  "totalScore": 0,
  "feedback": "Specific, actionable feedback (3-4 sentences)",
  "improvedPhrasing": ["Better way to phrase ask 1", "Better way to phrase ask 2"],
  "missedOpportunities": ["What they could have asked for"]
}`;

  try {
    return await llm.callLlmStructured(prompt, {
    type: 'object',
    properties: {
      scores: {
        type: 'object',
        properties: {
          assertiveness: { type: 'number' },
          professionalism: { type: 'number' },
          leverageUtilization: { type: 'number' },
          preparation: { type: 'number' },
          creativeProblemSolving: { type: 'number' },
        },
      },
      totalScore: { type: 'number' },
      feedback: { type: 'string' },
      improvedPhrasing: { type: 'array', items: { type: 'string' } },
      missedOpportunities: { type: 'array', items: { type: 'string' } },
    },
    });
  } catch (error) {
    return fallbackScorecard(conversationHistory);
  }
}

/**
 * Load offers from reportStore for a user
 * @param {string} userId
 * @returns {Promise<Array>} Offer letter reports
 */
async function getUserOffers(userId) {
  return reportStore.getReportsByType(userId, 'offer_letter');
}

function formatValue(value, format) {
  if (value === null || value === undefined) return 'N/A';
  switch (format) {
    case 'currency': return `₹${(value/100000).toFixed(2)}L`;
    case 'percent': return `${value}%`;
    case 'number': return value.toLocaleString();
    default: return value.toString();
  }
}

module.exports = {
  compareOffers,
  calculateEsop,
  generateCounterEmail,
  roleplayTurn,
  generateScorecard,
  getUserOffers,
};
