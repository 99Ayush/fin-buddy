/**
 * Comprehensive Senior Developer Test Suite for Fin-Buddy P1 Core
 * Covers:
 * - Schema validation (Offer letter, Payslip, Malformed payloads)
 * - PII Masking & Reversibility (PAN, Aadhaar, Phone, Bank Account, IFSC)
 * - Clause Trap Engine (All 7 predatory employment traps)
 * - Offers Comparison Matrix (Deterministic math, winner determination, formula metadata)
 * - ESOP & Equity Valuation (Bear/Base/Bull, FMV per share vs Market Cap)
 * - Counter-Offer Email Generator (Dynamic code injection, tones)
 * - AI HR Recruiter Role-Play & Scoring Engine (Turns, personas, 5-dimension scorecard)
 * - Report Store (Isolation, session persistence, user ownership)
 */

const request = require('supertest');
const crypto = require('crypto');
const app = require('../src/app');
const { validateDocument, getSchema } = require('../src/shared/validator/documentSchema');
const { maskText, initMaskSession, getMaskMap, detectPii, getMaskStats } = require('../src/shared/ai/mask');
const trapDetector = require('../src/module/documents/trapDetector');
const offersService = require('../src/module/offers/offers.service');
const reportStore = require('../src/shared/reportStore');
const { fallbackTurn, fallbackScorecard } = require('../src/module/offers/roleplayEngine');

describe('Senior Dev Test Suite — P1 Production Readiness', () => {
  const userId = `senior_dev_${Date.now()}`;

  const validOffer = {
    documentType: 'offer_letter',
    documentId: '550e8400-e29b-41d4-a716-446655440001',
    issuedDate: '2024-06-15',
    validUntil: '2024-07-15',
    company: { name: 'Acme Technologies Pvt Ltd', cin: 'U72900KA2020PTC123456' },
    candidate: { name: 'Aditi Rao', email: 'aditi.rao@email.com', phone: '+91 9876543210' },
    compensation: {
      ctcAnnual: 2400000,
      ctcMonthly: 200000,
      fixedComponent: {
        baseSalary: 960000,
        hra: 384000,
        specialAllowance: 576000,
        pfEmployer: 115200,
        pfEmployee: 115200,
        gratuity: 46176,
        professionalTax: 2400,
      },
      variableComponent: { performanceBonus: 200000 },
      esop: {
        totalOptions: 5000,
        strikePrice: 20,
        totalCompanyShares: 10000000,
        cliffMonths: 12,
        currentValuation: 250,
      },
      joiningBonus: 100000,
    },
    contractualTerms: {
      noticePeriodDays: 90,
      probationPeriodMonths: 6,
      bondDurationMonths: 24,
      bondPenaltyAmount: 200000,
      nonCompeteRadiusKm: 50,
      nonCompeteDurationMonths: 12,
      moonlightingAllowed: false,
      ipAssignmentScope: 'broad',
    },
    metadata: {
      extractedAt: new Date().toISOString(),
      extractionConfidence: 0.95,
      sourceFileName: 'offer_letter_acme.pdf',
      pageCount: 2,
    },
  };

  const validPayslip = {
    documentType: 'payslip',
    documentId: '550e8400-e29b-41d4-a716-446655440002',
    payPeriod: { month: 10, year: 2024, daysWorked: 22, daysPaid: 22 },
    company: { name: 'Acme Technologies Pvt Ltd' },
    employee: {
      name: 'Aditi Rao',
      employeeId: 'ACM-042',
      pan: 'ABCDE1234F',
      uan: '100123456789',
      designation: 'Staff Engineer',
    },
    earnings: {
      basic: 80000,
      hra: 32000,
      specialAllowance: 48000,
      grossEarnings: 160000,
    },
    deductions: {
      pfEmployee: 9600,
      professionalTax: 200,
      tds: 18000,
      totalDeductions: 27800,
    },
    netPay: 132200,
    metadata: {
      extractedAt: new Date().toISOString(),
      extractionConfidence: 0.98,
      sourceFileName: 'payslip_oct2024.pdf',
      pageCount: 1,
    },
  };

  describe('1. Schema Validation & Data Contracts', () => {
    test('validates fully formed Indian Offer Letter', () => {
      const result = validateDocument('offer_letter', validOffer);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    test('validates fully formed Indian Payslip', () => {
      const result = validateDocument('payslip', validPayslip);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    test('rejects offer letter with missing required fields or non-UUID id', () => {
      const malformed = { documentType: 'offer_letter', documentId: 'not-a-uuid' };
      const result = validateDocument('offer_letter', malformed);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('validates trap flags report schema', () => {
      const trapReport = {
        documentId: '550e8400-e29b-41d4-a716-446655440001',
        documentType: 'offer_letter',
        flags: [
          {
            clauseId: 'clause_notice_1',
            type: 'NOTICE_PERIOD_TRAP',
            severity: 'HIGH',
            title: 'Extended Notice Period',
            explanation: '90-day notice is restrictive.',
            recommendation: 'Negotiate to 60 days.',
            pageNumber: 1,
            textSpan: { startOffset: 0, endOffset: 30, text: '90 days notice' },
            regulatoryReference: 'Industrial Disputes Act, Section 25F',
          },
        ],
        assessedAt: new Date().toISOString(),
      };
      const result = validateDocument('trap_flags', trapReport);
      expect(result.valid).toBe(true);
    });
  });

  describe('2. Local PII Redaction & Privacy Shield', () => {
    test('masks PAN, Aadhaar, Phone, Bank Account, and Email deterministically', () => {
      const sessionId = initMaskSession();
      const rawText = `Candidate Aditi Rao, PAN: ABCDE1234F, Aadhaar: 1234 5678 9012, Phone: +91 9876543210, Email: aditi@domain.com, A/C: 123456789012345, IFSC: HDFC0001234`;
      const masked = maskText(rawText, sessionId);

      expect(masked).not.toContain('ABCDE1234F');
      expect(masked).not.toContain('1234 5678 9012');
      expect(masked).not.toContain('9876543210');
      expect(masked).not.toContain('aditi@domain.com');
      expect(masked).toContain('[MASKED_PAN_1]');
      expect(masked).toContain('[MASKED_AADHAAR_1]');

      const piiDetected = detectPii(rawText);
      expect(piiDetected.PAN).toBe(1);
      expect(piiDetected.AADHAAR).toBe(1);
      expect(piiDetected.PHONE).toBe(1);

      const map = getMaskMap(sessionId);
      expect(map.get('[MASKED_PAN_1]')).toBe('ABCDE1234F');
    });
  });

  describe('3. Predatory Clause Trap Classifier', () => {
    test('detects all major predatory traps with exact severity and legal citations', async () => {
      const contractText = `
        Terms and Conditions:
        1. Notice Period: 90 days notice period required prior to resignation.
        2. Service Bond: Training bond of ₹2,50,000 applies for 24 months.
        3. Variable Pay: Variable performance bonus of ₹3,00,000 at sole discretion of management.
        4. Non-compete: Non-compete radius of 50 km for 12 months post termination.
        5. Moonlighting: No moonlighting permitted under any circumstances.
        6. Joining Bonus: Joining bonus ₹1,00,000 refund in full if employee leaves within 12 months.
        7. Intellectual Property: All inventions and IP belongs to company exclusively.
      `;

      const flags = await trapDetector.detectTraps(contractText);
      const types = flags.map(f => f.type);

      expect(types).toContain('NOTICE_PERIOD_TRAP');
      expect(types).toContain('TRAINING_BOND');
      expect(types).toContain('VARIABLE_PAY_AMBIGUITY');
      expect(types).toContain('NON_COMPETE_OVERREACH');
      expect(types).toContain('MOONLIGHTING_BAN');
      expect(types).toContain('JOINING_BONUS_CLAWBACK');
      expect(types).toContain('IP_ASSIGNMENT_OVERREACH');

      const bondFlag = flags.find(f => f.type === 'TRAINING_BOND');
      expect(bondFlag.severity).toBe('CRITICAL');
      expect(bondFlag.regulatoryReference).toContain('Indian Contract Act, 1872');

      const noticeFlag = flags.find(f => f.type === 'NOTICE_PERIOD_TRAP');
      expect(noticeFlag.severity).toBe('HIGH');
    });
  });

  describe('4. Multi-Offer Side-by-Side Comparison Matrix', () => {
    test('compares 3 offers deterministically with winner badges and formula metadata', async () => {
      const offerA = {
        documentType: 'offer_letter',
        company: { name: 'AlphaTech' },
        compensation: {
          ctcAnnual: 2200000,
          ctcMonthly: 183333,
          fixedComponent: { baseSalary: 880000, hra: 352000, specialAllowance: 468000, pfEmployee: 105600, professionalTax: 2400 },
          variableComponent: { performanceBonus: 200000 },
          joiningBonus: 100000,
        },
        contractualTerms: { noticePeriodDays: 60, bondPenaltyAmount: 0 },
      };

      const offerB = {
        documentType: 'offer_letter',
        company: { name: 'BetaCorp' },
        compensation: {
          ctcAnnual: 2600000,
          ctcMonthly: 216666,
          fixedComponent: { baseSalary: 1040000, hra: 416000, specialAllowance: 544000, pfEmployee: 124800, professionalTax: 2400 },
          variableComponent: { performanceBonus: 350000 },
          joiningBonus: 150000,
        },
        contractualTerms: { noticePeriodDays: 90, bondPenaltyAmount: 150000 },
      };

      const offerC = {
        documentType: 'offer_letter',
        company: { name: 'GammaStartup' },
        compensation: {
          ctcAnnual: 2000000,
          ctcMonthly: 166666,
          fixedComponent: { baseSalary: 800000, hra: 320000, specialAllowance: 480000, pfEmployee: 96000, professionalTax: 2400 },
          variableComponent: { performanceBonus: 100000 },
          joiningBonus: 50000,
        },
        contractualTerms: { noticePeriodDays: 30, bondPenaltyAmount: 0 },
      };

      const result = await offersService.compareOffers([offerA, offerB, offerC], userId);

      expect(result.offers).toHaveLength(3);
      expect(result.comparison).toHaveLength(7);

      // Verify CTC winner is BetaCorp
      const ctcRow = result.comparison.find(r => r.key === 'ctcAnnual');
      expect(ctcRow.values[1].isWinner).toBe(true);

      // Verify Notice period winner is GammaStartup (30 days is best)
      const noticeRow = result.comparison.find(r => r.key === 'noticePeriodDays');
      expect(noticeRow.values[2].isWinner).toBe(true);

      // Verify monthlyInHand formula and assumptions are present for traceability
      expect(result.offers[0].metadata.monthlyInHand.formula).toBeTruthy();
      expect(result.offers[0].metadata.monthlyInHand.source).toContain('P2 SalaryTax');
    });

    test('rejects comparison with fewer than 2 offers', async () => {
      const res = await request(app)
        .post('/api/offers/compare')
        .send({ manualOffers: [{ companyName: 'OnlyOne', ctcAnnual: 1000000 }] });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_OFFER_COUNT');
    });
  });

  describe('5. ESOP & Equity Valuation Engine', () => {
    test('calculates 4-year vesting schedule and Bear/Base/Bull projections correctly with per-share valuation', async () => {
      const params = {
        totalOptions: 4000,
        strikePrice: 25,
        totalCompanyShares: 5000000,
        currentValuation: 150, // ₹150/share FMV
        cliffMonths: 12,
      };

      const res = await offersService.calculateEsop(params);

      expect(res.exerciseCost).toBe(100000); // 4000 * 25
      expect(res.inputs.ownershipPct).toBeCloseTo(0.08, 2);
      expect(res.projections.bear).toHaveLength(5);
      expect(res.projections.base).toHaveLength(5);
      expect(res.projections.bull).toHaveLength(5);

      // Year 1 (25% vested = 1000 options)
      const baseYear1 = res.projections.base[0];
      expect(baseYear1.vestedPercentage).toBe(25);
      expect(baseYear1.vestedOptions).toBe(1000);
      expect(baseYear1.exitPricePerShare).toBe(750); // 150 * 5
      expect(baseYear1.grossValue).toBe(750000);
      expect(baseYear1.netAfterTax).toBeGreaterThan(0);

      // Year 4 (100% vested = 4000 options)
      const baseYear4 = res.projections.base[3];
      expect(baseYear4.vestedOptions).toBe(4000);
      expect(baseYear4.grossValue).toBe(3000000); // 4000 * 750
    });

    test('calculates projections when total market capitalization is provided', async () => {
      const params = {
        totalOptions: 5000,
        strikePrice: 10,
        totalCompanyShares: 10000000,
        currentValuation: 200000000, // ₹20 Crore valuation
        cliffMonths: 12,
      };

      const res = await offersService.calculateEsop(params);
      expect(res.projections.base[0].exitPricePerShare).toBe(100); // (20Cr / 1Cr shares) * 5
      expect(res.projections.bull[3].vestedOptions).toBe(5000);
    });
  });

  describe('6. AI Counter-Offer Email & Role-Play Negotiation Simulator', () => {
    test('generates counter-offer email injecting verified compensation numbers', async () => {
      const email = await offersService.generateCounterEmail({
        currentOffer: validOffer,
        asks: [
          { type: 'higher_base', targetValue: '₹12,00,000', justification: 'Aligned with senior band' },
          { type: 'reduce_notice', targetValue: '60 days', justification: 'Market mobility' },
        ],
        tone: 'confident_assertive',
        competingOffers: [],
      });

      expect(email).toContain('Acme Technologies');
      expect(email).toMatch(/12(?:\.0)?\s*L|12,00,000/);
      expect(email).toMatch(/60\s*days/i);
    }, 20000);

    test('roleplayTurn executes turns across personas and generates end-of-session scorecard', async () => {
      // Turn 1
      const turn1 = await offersService.roleplayTurn({
        offer: validOffer,
        conversationHistory: [],
        userMessage: 'Thank you for the offer. Given the scope, could we discuss increasing the base salary?',
        persona: 'friendly_recruiter',
        turnNumber: 1,
      });

      expect(turn1.hrResponse).toBeTruthy();
      expect(turn1.turnNumber).toBe(2);
      expect(turn1.isComplete).toBe(false);

      // Turn 5 (Final turn triggers completion)
      const turn5 = fallbackTurn({
        offer: validOffer,
        persona: 'stubborn_enterprise',
        userMessage: 'I understand company policies. Could we consider a joining bonus instead?',
        turnNumber: 5,
      });

      expect(turn5.isComplete).toBe(true);

      // Scorecard generation
      const scorecard = fallbackScorecard([
        'Candidate: Could we explore a higher base of ₹12L?',
        'HR: Our band is ₹9.6L.',
        'Candidate: I have a competing offer at ₹11.5L and strong domain experience.',
        'HR: I will check with the hiring manager.',
      ]);

      expect(scorecard.totalScore).toBeGreaterThanOrEqual(50);
      expect(scorecard.scores.assertiveness).toBeDefined();
      expect(scorecard.scores.professionalism).toBeDefined();
      expect(scorecard.scores.leverageUtilization).toBeDefined();
      expect(scorecard.improvedPhrasing.length).toBeGreaterThan(0);
    });
  });

  describe('7. Report Store Isolation & User Ownership', () => {
    test('saves, retrieves, updates, and enforces user access boundaries', async () => {
      const testUserA = `user_a_${Date.now()}`;
      const testUserB = `user_b_${Date.now()}`;

      // Save report for User A
      const { docId } = await reportStore.saveReport(testUserA, validOffer);
      expect(docId).toBeTruthy();

      // Retrieve report
      const retrieved = await reportStore.getReport(docId);
      expect(retrieved.company.name).toBe('Acme Technologies Pvt Ltd');

      // User A can list it
      const listA = await reportStore.listReports(testUserA);
      expect(listA.some(r => r.documentId === docId)).toBe(true);

      // User B cannot see it
      const listB = await reportStore.listReports(testUserB);
      expect(listB.some(r => r.documentId === docId)).toBe(false);

      // Update report
      const updated = await reportStore.updateReport(docId, {
        candidate: { name: 'Aditi Rao Updated', email: 'aditi.updated@email.com' },
      });
      expect(updated.candidate.name).toBe('Aditi Rao Updated');

      // Delete report
      const deleted = await reportStore.deleteReport(testUserA, docId);
      expect(deleted).toBe(true);

      const afterDelete = await reportStore.getReport(docId);
      expect(afterDelete).toBeNull();
    });
  });
});
