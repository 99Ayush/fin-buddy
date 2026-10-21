/**
 * Document Schema Validator for Fin-Buddy
 * Defines JSON schemas for Indian Offer Letters, Payslips, Form 16, and Loan Letters.
 * Uses AJV (Another JSON Schema Validator) for validation.
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// Extraction runs on PII-redacted text, so identifiers such as PAN, Aadhaar, TAN,
// CIN, GSTIN and IFSC arrive as mask tokens (for example [MASKED_PAN_1]) rather than
// as real values. Patterns below therefore accept either the genuine format or a token.
const MASK_TOKEN = '\\[MASKED_[A-Z0-9_]+\\]';
const withMaskToken = (pattern) => `^(?:${pattern}|${MASK_TOKEN})$`;

// ============================================
// COMMON DEFINITIONS
// ============================================

const compensationBreakdown = {
  type: 'object',
  properties: {
    baseSalary: { type: 'number', minimum: 0, description: 'Basic salary component' },
    hra: { type: 'number', minimum: 0, description: 'House Rent Allowance' },
    specialAllowance: { type: 'number', minimum: 0, description: 'Special/Other allowances' },
    pfEmployer: { type: 'number', minimum: 0, description: 'Employer PF contribution' },
    pfEmployee: { type: 'number', minimum: 0, description: 'Employee PF contribution' },
    gratuity: { type: 'number', minimum: 0, description: 'Gratuity component (4.81% of basic)' },
    professionalTax: { type: 'number', minimum: 0, maximum: 2500, description: 'Monthly professional tax (max ₹2500)' },
    performanceBonus: { type: 'number', minimum: 0, description: 'Annual performance bonus' },
    joiningBonus: { type: 'number', minimum: 0, description: 'One-time joining bonus' },
    retentionBonus: { type: 'number', minimum: 0, description: 'Retention/stay bonus' },
    clawbackPeriodMonths: { type: 'integer', minimum: 0, description: 'Clawback period in months for bonuses' },
  },
  additionalProperties: false,
  // Only the base salary is required: every other line item is optional so a document
  // that does not print it is reported as absent instead of being invented.
  required: ['baseSalary'],
};

const esopGrant = {
  type: 'object',
  properties: {
    totalOptions: { type: 'integer', minimum: 0, description: 'Total stock options granted' },
    strikePrice: { type: 'number', minimum: 0, description: 'Exercise/strike price per option (₹)' },
    totalCompanyShares: { type: 'integer', minimum: 1, description: 'Total outstanding shares of company' },
    cliffMonths: { type: 'integer', minimum: 0, default: 12, description: 'Cliff period in months' },
    vestingSchedule: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          month: { type: 'integer', minimum: 1 },
          percentage: { type: 'number', minimum: 0, maximum: 100 },
        },
        required: ['month', 'percentage'],
        additionalProperties: false,
      },
      description: 'Monthly/quarterly vesting schedule',
    },
    currentValuation: { type: 'number', minimum: 0, description: 'Current fair market value per share (₹)' },
  },
  additionalProperties: false,
  required: ['totalOptions', 'strikePrice'],
};

const contractualTerms = {
  type: 'object',
  properties: {
    noticePeriodDays: { type: 'integer', minimum: 0, description: 'Notice period in days' },
    probationPeriodMonths: { type: 'integer', minimum: 0, default: 6, description: 'Probation period in months' },
    bondDurationMonths: { type: 'integer', minimum: 0, description: 'Training/service bond duration in months' },
    bondPenaltyAmount: { type: 'number', minimum: 0, description: 'Bond penalty/liquidated damages (₹)' },
    nonCompeteRadiusKm: { type: 'integer', minimum: 0, description: 'Non-compete geographic radius in km' },
    nonCompeteDurationMonths: { type: 'integer', minimum: 0, description: 'Non-compete duration in months' },
    moonlightingAllowed: { type: 'boolean', default: false, description: 'Whether moonlighting/side projects are permitted' },
    ipAssignmentScope: { type: 'string', enum: ['broad', 'narrow', 'work_related_only'], description: 'IP assignment clause scope' },
  },
  additionalProperties: false,
};

const companyInfo = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    cin: { type: 'string', pattern: withMaskToken('[LU]\\d{5}[A-Z]{2}\\d{4}[A-Z]{3}\\d{6}'), description: 'Corporate Identity Number' },
    gstin: { type: 'string', pattern: withMaskToken('\\d{2}[A-Z]{5}\\d{4}[A-Z]{1}[A-Z\\d]{1}[Z]{1}[A-Z\\d]{1}'), description: 'GST Identification Number' },
    address: { type: 'string' },
    pan: { type: 'string', pattern: withMaskToken('[A-Z]{5}[0-9]{4}[A-Z]'), description: 'Company PAN' },
  },
  additionalProperties: false,
  required: ['name'],
};

const employeeInfo = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    employeeId: { type: 'string' },
    pan: { type: 'string', pattern: withMaskToken('[A-Z]{5}[0-9]{4}[A-Z]'), description: 'Employee PAN' },
    aadhaar: { type: 'string', pattern: withMaskToken('\\d{4}\\s?\\d{4}\\s?\\d{4}'), description: 'Employee Aadhaar (masked)' },
    uan: { type: 'string', pattern: withMaskToken('\\d{12}'), description: 'Universal Account Number' },
    designation: { type: 'string' },
    department: { type: 'string' },
    dateOfJoining: { type: 'string', format: 'date', description: 'YYYY-MM-DD' },
    bankAccount: { type: 'string', description: 'Bank account number (masked)' },
    ifsc: { type: 'string', pattern: withMaskToken('[A-Z]{4}0[A-Z0-9]{6}'), description: 'IFSC code' },
  },
  additionalProperties: false,
  required: ['name'],
};

// ============================================
// OFFER LETTER SCHEMA
// ============================================

const offerLetterSchema = {
  $id: 'https://fin-buddy.dev/schemas/offerLetter.json',
  title: 'Indian Offer Letter',
  type: 'object',
  properties: {
    documentType: { const: 'offer_letter' },
    documentId: { type: 'string', format: 'uuid' },
    version: { type: 'string', default: '1.0' },
    issuedDate: { type: 'string', format: 'date' },
    validUntil: { type: 'string', format: 'date' },
    company: companyInfo,
    candidate: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1 },
        email: { type: 'string', format: 'email' },
        phone: { type: 'string', pattern: withMaskToken('(?:(?:\\+|0{0,2})91[\\s-]*)?[6-9]\\d{9}') },
        address: { type: 'string' },
      },
      required: ['name'],
      additionalProperties: false,
    },
    compensation: {
      type: 'object',
      properties: {
        ctcAnnual: { type: 'number', minimum: 0, description: 'Total Cost to Company per annum (₹)' },
        ctcMonthly: { type: 'number', minimum: 0, description: 'Monthly CTC (₹)' },
        fixedComponent: compensationBreakdown,
        variableComponent: {
          type: 'object',
          properties: {
            performanceBonus: { type: 'number', minimum: 0 },
            bonusCriteria: { type: 'string', description: 'Criteria for bonus payout' },
            bonusFrequency: { type: 'string', enum: ['monthly', 'quarterly', 'half_yearly', 'annual'] },
          },
          additionalProperties: false,
        },
        esop: esopGrant,
        joiningBonus: { type: 'number', minimum: 0 },
        joiningBonusClawbackMonths: { type: 'integer', minimum: 0 },
      },
      additionalProperties: false,
      required: ['ctcAnnual', 'fixedComponent'],
    },
    contractualTerms: contractualTerms,
    workLocation: {
      type: 'object',
      properties: {
        city: { type: 'string' },
        state: { type: 'string' },
        pincode: { type: 'string', pattern: '^\\d{6}$' },
        workMode: { type: 'string', enum: ['office', 'hybrid', 'remote'] },
      },
      required: ['city', 'state', 'workMode'],
      additionalProperties: false,
    },
    metadata: {
      type: 'object',
      properties: {
        extractedAt: { type: 'string', format: 'date-time' },
        extractionConfidence: { type: 'number', minimum: 0, maximum: 1 },
        sourceFileName: { type: 'string' },
        pageCount: { type: 'integer', minimum: 1 },
      },
      required: ['extractedAt', 'extractionConfidence'],
      additionalProperties: false,
    },
  },
  additionalProperties: false,
  required: ['documentType', 'documentId', 'issuedDate', 'company', 'candidate', 'compensation', 'contractualTerms', 'metadata'],
};

// ============================================
// PAYSLIP SCHEMA
// ============================================

const payslipSchema = {
  $id: 'https://fin-buddy.dev/schemas/payslip.json',
  title: 'Indian Monthly Payslip',
  type: 'object',
  properties: {
    documentType: { const: 'payslip' },
    documentId: { type: 'string', format: 'uuid' },
    version: { type: 'string', default: '1.0' },
    payPeriod: {
      type: 'object',
      properties: {
        month: { type: 'integer', minimum: 1, maximum: 12 },
        year: { type: 'integer', minimum: 2020 },
        startDate: { type: 'string', format: 'date' },
        endDate: { type: 'string', format: 'date' },
        daysWorked: { type: 'number', minimum: 0, maximum: 31 },
        daysPaid: { type: 'number', minimum: 0, maximum: 31 },
      },
      required: ['month', 'year'],
      additionalProperties: false,
    },
    company: companyInfo,
    employee: employeeInfo,
    earnings: {
      type: 'object',
      properties: {
        basic: { type: 'number', minimum: 0 },
        hra: { type: 'number', minimum: 0 },
        specialAllowance: { type: 'number', minimum: 0 },
        conveyanceAllowance: { type: 'number', minimum: 0 },
        medicalAllowance: { type: 'number', minimum: 0 },
        leaveTravelAllowance: { type: 'number', minimum: 0 },
        performanceBonus: { type: 'number', minimum: 0 },
        otherAllowances: { type: 'number', minimum: 0 },
        grossEarnings: { type: 'number', minimum: 0 },
      },
      additionalProperties: false,
      required: ['grossEarnings'],
    },
    deductions: {
      type: 'object',
      properties: {
        pfEmployee: { type: 'number', minimum: 0, description: 'Employee PF (12% of basic)' },
        pfEmployer: { type: 'number', minimum: 0, description: 'Employer PF (12% of basic, not deducted from net)' },
        esiEmployee: { type: 'number', minimum: 0, description: 'Employee ESI (0.75% of gross)' },
        esiEmployer: { type: 'number', minimum: 0, description: 'Employer ESI (3.25% of gross)' },
        professionalTax: { type: 'number', minimum: 0, maximum: 2500 },
        tds: { type: 'number', minimum: 0, description: 'Tax Deducted at Source' },
        advanceSalary: { type: 'number', minimum: 0 },
        loanRecovery: { type: 'number', minimum: 0 },
        otherDeductions: { type: 'number', minimum: 0 },
        totalDeductions: { type: 'number', minimum: 0 },
      },
      additionalProperties: false,
      required: ['totalDeductions'],
    },
    netPay: { type: 'number', minimum: 0, description: 'Net take-home pay' },
    ytd: {
      type: 'object',
      properties: {
        grossYtd: { type: 'number', minimum: 0 },
        tdsYtd: { type: 'number', minimum: 0 },
        pfYtd: { type: 'number', minimum: 0 },
      },
      additionalProperties: false,
    },
    metadata: {
      type: 'object',
      properties: {
        extractedAt: { type: 'string', format: 'date-time' },
        extractionConfidence: { type: 'number', minimum: 0, maximum: 1 },
        sourceFileName: { type: 'string' },
        pageCount: { type: 'integer', minimum: 1 },
      },
      required: ['extractedAt', 'extractionConfidence'],
      additionalProperties: false,
    },
  },
  additionalProperties: false,
  required: ['documentType', 'documentId', 'payPeriod', 'company', 'employee', 'earnings', 'deductions', 'netPay', 'metadata'],
};

// ============================================
// FORM 16 SCHEMA
// ============================================

const form16Schema = {
  $id: 'https://fin-buddy.dev/schemas/form16.json',
  title: 'Form 16 (TDS Certificate)',
  type: 'object',
  properties: {
    documentType: { const: 'form16' },
    documentId: { type: 'string', format: 'uuid' },
    version: { type: 'string', default: '1.0' },
    financialYear: { type: 'string', pattern: '^\\d{4}-\\d{2}$', description: 'e.g., 2024-25' },
    assessmentYear: { type: 'string', pattern: '^\\d{4}-\\d{2}$' },
    employer: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        tan: { type: 'string', pattern: withMaskToken('[A-Z]{4}\\d{5}[A-Z]'), description: 'Tax Deduction Account Number' },
        pan: { type: 'string', pattern: withMaskToken('[A-Z]{5}[0-9]{4}[A-Z]') },
        address: { type: 'string' },
      },
      required: ['name'],
      additionalProperties: false,
    },
    employee: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        pan: { type: 'string', pattern: withMaskToken('[A-Z]{5}[0-9]{4}[A-Z]') },
        address: { type: 'string' },
      },
      required: ['name'],
      additionalProperties: false,
    },
    partA: {
      type: 'object',
      properties: {
        totalTaxDeducted: { type: 'number', minimum: 0 },
        totalTaxDeposited: { type: 'number', minimum: 0 },
        challanDetails: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              bsrCode: { type: 'string' },
              dateOfDeposit: { type: 'string', format: 'date' },
              challanSerial: { type: 'string' },
              amount: { type: 'number', minimum: 0 },
            },
            required: ['bsrCode', 'dateOfDeposit', 'amount'],
            additionalProperties: false,
          },
        },
      },
      required: ['totalTaxDeducted', 'totalTaxDeposited'],
      additionalProperties: false,
    },
    partB: {
      type: 'object',
      properties: {
        grossSalary: { type: 'number', minimum: 0 },
        allowancesExempt: { type: 'number', minimum: 0 },
        perquisites: { type: 'number', minimum: 0 },
        profitsInLieuOfSalary: { type: 'number', minimum: 0 },
        totalIncomeFromSalary: { type: 'number', minimum: 0 },
        deductionsUnderChapterVIA: {
          type: 'object',
          properties: {
            section80C: { type: 'number', minimum: 0, maximum: 150000 },
            section80CCD1B: { type: 'number', minimum: 0, maximum: 50000 },
            section80D: { type: 'number', minimum: 0 },
            section80E: { type: 'number', minimum: 0 },
            section80G: { type: 'number', minimum: 0 },
            section80TTA: { type: 'number', minimum: 0, maximum: 10000 },
            otherDeductions: { type: 'number', minimum: 0 },
            totalDeductions: { type: 'number', minimum: 0 },
          },
          required: ['totalDeductions'],
          additionalProperties: false,
        },
        taxableIncome: { type: 'number', minimum: 0 },
        taxOnTaxableIncome: { type: 'number', minimum: 0 },
        rebateUnder87A: { type: 'number', minimum: 0, maximum: 12500 },
        healthAndEducationCess: { type: 'number', minimum: 0 },
        totalTaxLiability: { type: 'number', minimum: 0 },
        taxAlreadyPaid: { type: 'number', minimum: 0 },
        taxRefundDue: { type: 'number', minimum: 0 },
        taxPayable: { type: 'number', minimum: 0 },
      },
      required: ['grossSalary', 'totalIncomeFromSalary', 'taxableIncome', 'totalTaxLiability'],
      additionalProperties: false,
    },
    metadata: {
      type: 'object',
      properties: {
        extractedAt: { type: 'string', format: 'date-time' },
        extractionConfidence: { type: 'number', minimum: 0, maximum: 1 },
        sourceFileName: { type: 'string' },
        pageCount: { type: 'integer', minimum: 1 },
      },
      required: ['extractedAt', 'extractionConfidence'],
      additionalProperties: false,
    },
  },
  additionalProperties: false,
  required: ['documentType', 'documentId', 'financialYear', 'employer', 'employee', 'partA', 'partB', 'metadata'],
};

// ============================================
// LOAN AGREEMENT SCHEMA
// ============================================

const loanAgreementSchema = {
  $id: 'https://fin-buddy.dev/schemas/loanAgreement.json',
  title: 'Loan Agreement / Sanction Letter',
  type: 'object',
  properties: {
    documentType: { const: 'loan_agreement' },
    documentId: { type: 'string', format: 'uuid' },
    version: { type: 'string', default: '1.0' },
    loanType: { type: 'string', enum: ['home', 'personal', 'education', 'vehicle', 'gold', 'business'] },
    sanctionedDate: { type: 'string', format: 'date' },
    lender: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        type: { type: 'string', enum: ['bank', 'nbfc', 'hfc', 'fintech'] },
        licenseNumber: { type: 'string' },
      },
      required: ['name'],
      additionalProperties: false,
    },
    borrower: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        pan: { type: 'string', pattern: withMaskToken('[A-Z]{5}[0-9]{4}[A-Z]') },
        income: { type: 'number', minimum: 0 },
      },
      required: ['name'],
      additionalProperties: false,
    },
    loanTerms: {
      type: 'object',
      properties: {
        principalAmount: { type: 'number', minimum: 0 },
        interestRate: { type: 'number', minimum: 0, maximum: 50, description: 'Annual interest rate %' },
        interestType: { type: 'string', enum: ['fixed', 'floating', 'hybrid'] },
        tenureMonths: { type: 'integer', minimum: 1, maximum: 360 },
        emi: { type: 'number', minimum: 0 },
        processingFee: { type: 'number', minimum: 0 },
        prepaymentCharges: { type: 'number', minimum: 0, description: 'Prepayment penalty %' },
        moratoriumMonths: { type: 'integer', minimum: 0 },
      },
      required: ['principalAmount'],
      additionalProperties: false,
    },
    metadata: {
      type: 'object',
      properties: {
        extractedAt: { type: 'string', format: 'date-time' },
        extractionConfidence: { type: 'number', minimum: 0, maximum: 1 },
        sourceFileName: { type: 'string' },
        pageCount: { type: 'integer', minimum: 1 },
      },
      required: ['extractedAt', 'extractionConfidence'],
      additionalProperties: false,
    },
  },
  additionalProperties: false,
  required: ['documentType', 'documentId', 'loanType', 'lender', 'borrower', 'loanTerms', 'metadata'],
};

// ============================================
// TRAP FLAGS SCHEMA
// ============================================

const trapFlagsSchema = {
  $id: 'https://fin-buddy.dev/schemas/trapFlags.json',
  title: 'Clause Trap Flags',
  type: 'object',
  properties: {
    documentId: { type: 'string', format: 'uuid' },
    documentType: { type: 'string', enum: ['offer_letter', 'payslip', 'form16', 'loan_agreement'] },
    flags: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          clauseId: { type: 'string', minLength: 1 },
          type: {
            type: 'string',
            enum: [
              'NOTICE_PERIOD_TRAP',
              'TRAINING_BOND',
              'VARIABLE_PAY_AMBIGUITY',
              'NON_COMPETE_OVERREACH',
              'MOONLIGHTING_BAN',
              'JOINING_BONUS_CLAWBACK',
              'IP_ASSIGNMENT_OVERREACH',
              'PROBATION_EXTENSION_TRAP',
              'TERMINATION_WITHOUT_CAUSE',
              'SALARY_REVISION_UNILATERAL',
            ],
          },
          severity: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] },
          title: { type: 'string' },
          explanation: { type: 'string' },
          recommendation: { type: 'string' },
          pageNumber: { type: 'integer', minimum: 1 },
          textSpan: {
            type: 'object',
            properties: {
              startOffset: { type: 'integer', minimum: 0 },
              endOffset: { type: 'integer', minimum: 0 },
              text: { type: 'string' },
            },
            required: ['startOffset', 'endOffset', 'text'],
            additionalProperties: false,
          },
          boundingBox: {
            type: 'object',
            properties: {
              page: { type: 'integer', minimum: 1 },
              x: { type: 'number', minimum: 0 },
              y: { type: 'number', minimum: 0 },
              width: { type: 'number', minimum: 0 },
              height: { type: 'number', minimum: 0 },
            },
            required: ['page', 'x', 'y', 'width', 'height'],
            additionalProperties: false,
          },
          regulatoryReference: { type: 'string', description: 'Relevant law/section (e.g., Industrial Disputes Act, Contract Act)' },
        },
        required: ['clauseId', 'type', 'severity', 'title', 'explanation', 'pageNumber', 'textSpan'],
        additionalProperties: false,
      },
    },
    assessedAt: { type: 'string', format: 'date-time' },
  },
  additionalProperties: false,
  required: ['documentId', 'documentType', 'flags', 'assessedAt'],
};

// ============================================
// COMPILE VALIDATORS
// ============================================

const validateOfferLetter = ajv.compile(offerLetterSchema);
const validatePayslip = ajv.compile(payslipSchema);
const validateForm16 = ajv.compile(form16Schema);
const validateLoanAgreement = ajv.compile(loanAgreementSchema);
const validateTrapFlags = ajv.compile(trapFlagsSchema);

/**
 * Validate a document against its schema
 * @param {string} documentType - Type of document
 * @param {object} data - Document data to validate
 * @returns {{ valid: boolean, errors: Array|null }} Validation result
 */
function validateDocument(documentType, data) {
  let validate;
  switch (documentType) {
    case 'offer_letter':
      validate = validateOfferLetter;
      break;
    case 'payslip':
      validate = validatePayslip;
      break;
    case 'form16':
      validate = validateForm16;
      break;
    case 'loan_agreement':
      validate = validateLoanAgreement;
      break;
    case 'trap_flags':
      validate = validateTrapFlags;
      break;
    default:
      return { valid: false, errors: [{ message: `Unknown document type: ${documentType}` }] };
  }

  const valid = validate(data);
  return {
    valid,
    errors: valid ? null : validate.errors.map(e => ({
      keyword: e.keyword,
      instancePath: e.instancePath,
      schemaPath: e.schemaPath,
      message: e.message,
      params: e.params,
    })),
  };
}

/**
 * Get schema for a document type (for external reference)
 * @param {string} documentType
 * @returns {object|null} JSON Schema
 */
function getSchema(documentType) {
  const schemas = {
    offer_letter: offerLetterSchema,
    payslip: payslipSchema,
    form16: form16Schema,
    loan_agreement: loanAgreementSchema,
    trap_flags: trapFlagsSchema,
  };
  return schemas[documentType] || null;
}

module.exports = {
  validateDocument,
  getSchema,
  schemas: {
    offerLetter: offerLetterSchema,
    payslip: payslipSchema,
    form16: form16Schema,
    loanAgreement: loanAgreementSchema,
    trapFlags: trapFlagsSchema,
    // Re-export common definitions for reuse
    compensationBreakdown,
    esopGrant,
    contractualTerms,
    companyInfo,
    employeeInfo,
  },
};