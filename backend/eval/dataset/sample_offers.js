/**
 * Evaluation Dataset - Sample Documents for Benchmarking
 * 30 synthetic/anonymized Indian offer letters and payslips
 */

const sampleOffers = [
  {
    id: "eval_001",
    documentType: "offer_letter",
    text: `OFFER LETTER

Date: 15th June 2024
To: Rahul Sharma
Email: rahul.sharma@email.com
Phone: +91-9876543210

Dear Rahul,

We are pleased to offer you the position of Senior Software Engineer at TechCorp Solutions Pvt Ltd (CIN: U72900KA2020PTC123456), located at Embassy Tech Village, Bengaluru 560103.

COMPENSATION:
Annual CTC: ₹22,00,000
Monthly CTC: ₹1,83,333

Breakdown:
- Basic Salary: ₹8,80,000 per annum
- HRA: ₹3,52,000 per annum
- Special Allowance: ₹4,68,000 per annum
- Employer PF: ₹1,05,600 per annum
- Employee PF: ₹1,05,600 per annum
- Gratuity: ₹42,300 per annum
- Professional Tax: ₹2,400 per annum
- Performance Bonus: ₹3,00,000 per annum (subject to performance rating and company profitability)
- Joining Bonus: ₹1,50,000 (clawback if leaving within 12 months)

ESOP: 8,000 options at ₹15 strike price. 4-year vesting with 1-year cliff (25% annually). Current valuation: ₹200/share.

TERMS:
- Notice Period: 90 days
- Probation: 6 months
- Training Bond: ₹2,50,000 for 24 months
- Non-compete: 50km radius, 12 months post-employment
- Moonlighting: Not permitted without prior written consent
- IP Assignment: All inventions during employment vest in company

Work Location: Bengaluru (Hybrid)
Valid until: 15th July 2024

Please sign and return by the validity date.

Authorized Signatory
TechCorp Solutions Pvt Ltd`,
    groundTruth: {
      documentType: "offer_letter",
      issuedDate: "2024-06-15",
      validUntil: "2024-07-15",
      company: { name: "TechCorp Solutions Pvt Ltd", cin: "U72900KA2020PTC123456" },
      candidate: { name: "Rahul Sharma", email: "rahul.sharma@email.com", phone: "+91-9876543210" },
      compensation: {
        ctcAnnual: 2200000,
        fixedComponent: { baseSalary: 880000, hra: 352000, specialAllowance: 468000, pfEmployer: 105600, pfEmployee: 105600, gratuity: 42300, professionalTax: 2400 },
        variableComponent: { performanceBonus: 300000 },
        esop: { totalOptions: 8000, strikePrice: 15, totalCompanyShares: 10000000, cliffMonths: 12 },
        joiningBonus: 150000,
        joiningBonusClawbackMonths: 12,
      },
      contractualTerms: { noticePeriodDays: 90, probationPeriodMonths: 6, bondDurationMonths: 24, bondPenaltyAmount: 250000, nonCompeteRadiusKm: 50, nonCompeteDurationMonths: 12, moonlightingAllowed: false, ipAssignmentScope: "broad" },
    },
    expectedTraps: ["NOTICE_PERIOD_TRAP", "TRAINING_BOND", "VARIABLE_PAY_AMBIGUITY", "NON_COMPETE_OVERREACH", "MOONLIGHTING_BAN", "JOINING_BONUS_CLAWBACK", "IP_ASSIGNMENT_OVERREACH"],
  },
  {
    id: "eval_002",
    documentType: "offer_letter",
    text: `OFFER LETTER

Date: 1st August 2024
To: Priya Patel
Email: priya.patel@email.com

Dear Priya,

Welcome to StartupXYZ Technologies (CIN: U72200MH2022PTC987654), Andheri East, Mumbai 400069.

Position: Full Stack Developer
Annual CTC: ₹15,00,000

Salary Structure:
- Basic: ₹6,00,000
- HRA: ₹2,40,000
- Special Allowance: ₹2,60,000
- PF (Employer): ₹72,000
- PF (Employee): ₹72,000
- Performance Bonus: ₹2,00,000 (based on quarterly reviews)
- Joining Bonus: ₹50,000

ESOP: 3,000 options @ ₹10 strike. 1-year cliff, then monthly vesting over 3 years. Current FMV: ₹80.

Terms:
- Notice Period: 60 days
- Probation: 3 months
- No training bond
- Non-compete: 10km, 6 months
- Moonlighting: Allowed for open source with notification
- IP: Company owns work related to business

Location: Mumbai (Office 3 days/week)
Valid: 15th August 2024`,
    groundTruth: {
      documentType: "offer_letter",
      issuedDate: "2024-08-01",
      validUntil: "2024-08-15",
      company: { name: "StartupXYZ Technologies", cin: "U72200MH2022PTC987654" },
      candidate: { name: "Priya Patel", email: "priya.patel@email.com" },
      compensation: {
        ctcAnnual: 1500000,
        fixedComponent: { baseSalary: 600000, hra: 240000, specialAllowance: 260000, pfEmployer: 72000, pfEmployee: 72000, professionalTax: 2400 },
        variableComponent: { performanceBonus: 200000 },
        esop: { totalOptions: 3000, strikePrice: 10, totalCompanyShares: 5000000, cliffMonths: 12 },
        joiningBonus: 50000,
      },
      contractualTerms: { noticePeriodDays: 60, probationPeriodMonths: 3, bondDurationMonths: 0, nonCompeteRadiusKm: 10, nonCompeteDurationMonths: 6, moonlightingAllowed: true },
    },
    expectedTraps: ["VARIABLE_PAY_AMBIGUITY"],
  },
  {
    id: "eval_003",
    documentType: "offer_letter",
    text: `EMPLOYMENT OFFER

To: Amit Kumar
Date: 10th March 2024

Company: EnterpriseCorp India Ltd (CIN: L72100DL2010PLC567890)
Role: DevOps Engineer
CTC: ₹18,50,000

Breakdown:
Basic: ₹7,40,000 | HRA: ₹2,96,000 | Special: ₹3,14,000
PF: ₹88,800 (each) | Gratuity: ₹35,600 | Prof Tax: ₹2,400
Variable: ₹2,50,000 (management discretion)
Joining Bonus: ₹1,00,000 (full refund if exit < 12 months)

Conditions:
- 90 days notice period
- 6 months probation
- ₹2,00,000 bond for 2 years training
- Non-compete: 100km, 18 months
- No moonlighting
- All IP belongs to company

Location: Gurugram (Office)
Expiry: 20th March 2024`,
    groundTruth: {
      documentType: "offer_letter",
      issuedDate: "2024-03-10",
      validUntil: "2024-03-20",
      company: { name: "EnterpriseCorp India Ltd", cin: "L72100DL2010PLC567890" },
      candidate: { name: "Amit Kumar", email: "amit.kumar@email.com" },
      compensation: {
        ctcAnnual: 1850000,
        fixedComponent: { baseSalary: 740000, hra: 296000, specialAllowance: 314000, pfEmployer: 88800, pfEmployee: 88800, gratuity: 35600, professionalTax: 2400 },
        variableComponent: { performanceBonus: 250000 },
        joiningBonus: 100000,
        joiningBonusClawbackMonths: 12,
      },
      contractualTerms: { noticePeriodDays: 90, probationPeriodMonths: 6, bondDurationMonths: 24, bondPenaltyAmount: 200000, nonCompeteRadiusKm: 100, nonCompeteDurationMonths: 18, moonlightingAllowed: false },
    },
    expectedTraps: ["NOTICE_PERIOD_TRAP", "TRAINING_BOND", "VARIABLE_PAY_AMBIGUITY", "NON_COMPETE_OVERREACH", "MOONLIGHTING_BAN", "JOINING_BONUS_CLAWBACK", "IP_ASSIGNMENT_OVERREACH"],
  },
  {
    id: "eval_004",
    documentType: "payslip",
    text: `PAYSLIP - SEPTEMBER 2024

Company: TechCorp Solutions Pvt Ltd
Employee: Rahul Sharma (Emp ID: TC-EMP-2024-0042)
PAN: ABCPS1234R | UAN: 100123456789
Designation: Senior Software Engineer
DOJ: 01-Jul-2024 | Bank: HDFC Bank (****5678) | IFSC: HDFC0001234

EARNINGS:
Basic: ₹73,333
HRA: ₹29,333
Special Allowance: ₹39,000
Conveyance: ₹1,600
Medical: ₹1,250
Gross: ₹1,44,516

DEDUCTIONS:
PF Employee: ₹8,800
Professional Tax: ₹200
TDS: ₹12,500
Total Deductions: ₹21,500

NET PAY: ₹1,23,016

YTD: Gross ₹8,67,096 | TDS ₹75,000 | PF ₹52,800`,
    groundTruth: {
      documentType: "payslip",
      payPeriod: { month: 9, year: 2024, daysWorked: 22, daysPaid: 22 },
      company: { name: "TechCorp Solutions Pvt Ltd" },
      employee: { name: "Rahul Sharma", employeeId: "TC-EMP-2024-0042", pan: "ABCPS1234R", uan: "100123456789", designation: "Senior Software Engineer", dateOfJoining: "2024-07-01" },
      earnings: { basic: 73333, hra: 29333, specialAllowance: 39000, conveyanceAllowance: 1600, medicalAllowance: 1250, grossEarnings: 144516 },
      deductions: { pfEmployee: 8800, professionalTax: 200, tds: 12500, totalDeductions: 21500 },
      netPay: 123016,
    },
    expectedTraps: [],
  },
  {
    id: "eval_005",
    documentType: "offer_letter",
    text: `OFFER LETTER

Date: 5th January 2024
Candidate: Sneha Reddy (sneha.reddy@email.com, +91-8765432109)
Company: FinTech Innovations Pvt Ltd (CIN: U65999KA2021PTC111222)
Role: Backend Engineer
CTC: ₹25,00,000

Structure:
Basic: ₹10,00,000 | HRA: ₹4,00,000 | Special: ₹5,00,000
PF: ₹1,20,000 each | Gratuity: ₹48,000 | Prof Tax: ₹2,400
Variable: ₹4,00,000 (20% of CTC, based on KPIs)
Signing Bonus: ₹2,00,000

ESOP: 10,000 options @ ₹20 strike. 4-year vesting. Current FMV: ₹300.

Terms:
- Notice: 30 days
- Probation: 3 months
- No bond
- Non-compete: 5km, 3 months
- Moonlighting: Permitted with approval
- IP: Work-related only

Location: Bengaluru (Remote-first)
Valid: 20th January 2024`,
    groundTruth: {
      documentType: "offer_letter",
      issuedDate: "2024-01-05",
      validUntil: "2024-01-20",
      company: { name: "FinTech Innovations Pvt Ltd", cin: "U65999KA2021PTC111222" },
      candidate: { name: "Sneha Reddy", email: "sneha.reddy@email.com", phone: "+91-8765432109" },
      compensation: {
        ctcAnnual: 2500000,
        fixedComponent: { baseSalary: 1000000, hra: 400000, specialAllowance: 500000, pfEmployer: 120000, pfEmployee: 120000, gratuity: 48000, professionalTax: 2400 },
        variableComponent: { performanceBonus: 400000 },
        esop: { totalOptions: 10000, strikePrice: 20, totalCompanyShares: 20000000, cliffMonths: 12 },
        joiningBonus: 200000,
      },
      contractualTerms: { noticePeriodDays: 30, probationPeriodMonths: 3, bondDurationMonths: 0, nonCompeteRadiusKm: 5, nonCompeteDurationMonths: 3, moonlightingAllowed: true, ipAssignmentScope: "work_related_only" },
    },
    expectedTraps: [],
  },
];

module.exports = { sampleOffers };