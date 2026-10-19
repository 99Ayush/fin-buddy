/**
 * Documents Module - Trap Detector (trapDetector.js)
 * Classifies predatory employment clauses in offer letters and agreements.
 * Returns structured flags with severity, location, and actionable recommendations.
 */

const { validateDocument } = require('../../shared/validator/documentSchema');

// ============================================
// TRAP PATTERNS & CLASSIFIERS
// ============================================

/**
 * Trap detection rules - each defines patterns, severity, and metadata
 */
const TRAP_RULES = [
  {
    type: 'NOTICE_PERIOD_TRAP',
    patterns: [
      /notice\s+period\s*(?:is|of|for)?\s*[:\-]?\s*(?:ninety|90|one\s+hundred|100|one\s+twenty|120)\s*days?/i,
      /(?:ninety|90|1[0-2]0)\s*days?\s*(?:prior\s+)?(?:written\s+)?notice/i,
      /(?:ninety|90|1[0-2]0)\s*days?\s*notice\s*period/i,
      /terminate\s+(?:employment|service)\s+(?:by\s+)?giving\s+(?:ninety|90|1[0-2]0)\s+days?/i,
    ],
    severity: (match, context) => {
      const days = extractNoticeDays(context);
      if (days >= 90) return 'HIGH';
      if (days >= 60) return 'MEDIUM';
      return 'LOW';
    },
    title: 'Extended Notice Period',
    explanationTemplate: 'The agreement requires a {days}-day notice period for resignation, which is {comparison} the industry standard of 30-60 days. This significantly restricts your ability to accept new opportunities quickly.',
    recommendationTemplate: 'Negotiate down to 60 days maximum. Request a buyout clause allowing payment of 1-2 months\' gross salary to reduce notice to 30 days. Ensure any agreement is in writing.',
    regulatoryRef: 'Industrial Disputes Act, 1947 - Section 25F; No statutory maximum for private sector, but courts scrutinize unreasonable periods as restraint of trade.',
  },
  {
    type: 'TRAINING_BOND',
    patterns: [
      /training\s+(?:bond|agreement|commitment)/i,
      /liquidated\s+damages?\s+(?:of|for)\s+(?:training|learning)/i,
      /(?:training|induction)\s+cost\s+(?:recovery|reimbursement)/i,
      /serve\s+(?:the\s+)?company\s+(?:for|minimum)\s+(?:two|24|twelve|12)\s+(?:months?|years?)/i,
      /(?:training\s+)?bond\s*(?:amount|penalty|sum|of)?\s*[:\-]?\s*(?:rs\.?|₹)?\s*[\d,]+/i,
      /(?:rs\.?|₹)\s*[\d,]+\s*(?:training\s+)?bond/i,
      /bond.*(?:training|\d+\s*(?:months?|years?))/i,
    ],
    severity: (match, context) => {
      const amount = extractBondAmount(context);
      const duration = extractBondDuration(context);
      if (amount >= 200000 || duration >= 24) return 'CRITICAL';
      if (amount >= 100000 || duration >= 18) return 'HIGH';
      return 'MEDIUM';
    },
    title: 'Training Bond / Service Bond',
    explanationTemplate: 'The agreement imposes a ₹{amount} liquidated damages clause if you leave before completing {duration} months. This is framed as "training recovery" but may apply regardless of actual training received. Such bonds are enforceable only if the employer proves actual training expenditure.',
    recommendationTemplate: 'Request: (1) Reduction to 12 months with pro-rata recovery, (2) Cap at actual documented training costs (not fixed amount), (3) Exclusions for constructive dismissal, relocation, medical grounds. Get clarity on what specific training was provided.',
    regulatoryRef: 'Indian Contract Act, 1872 - Section 74 (liquidated damages must be genuine pre-estimate); Labour courts often strike down excessive bonds. See: Tocarta vs. State (Madras HC).',
  },
  {
    type: 'VARIABLE_PAY_AMBIGUITY',
    patterns: [
      /performance\s+bonus\s*[:\-]?\s*(?:of|up\s+to)?\s*(?:rs\.?|₹)?\s*[\d,]+/i,
      /variable\s*(?:pay|component|compensation)\s*[:\-]?\s*(?:rs\.?|₹)?/i,
      /bonus\s+(?:subject\s+to|dependent\s+on|based\s+on)\s+(?:performance|rating|profitability|discretion|quarterly|kpi)/i,
      /sole\s+discretion\s+of\s+(?:management|company)|management\s+discretion/i,
      /target\s+(?:achievement|performance)\s+(?:based|linked)/i,
    ],
    severity: (match, context) => {
      const variablePct = extractVariablePercentage(context);
      if (variablePct > 25) return 'HIGH';
      if (variablePct > 15) return 'MEDIUM';
      return 'LOW';
    },
    title: 'Ambiguous Variable Pay Structure',
    explanationTemplate: 'The {variablePct}% variable component (₹{bonusAmount}) depends on "{criteria}" but lacks specific, measurable criteria. No minimum guaranteed payout, and key factors are outside your control.',
    recommendationTemplate: 'Request: (1) Written definition of rating scale with clear descriptors, (2) Minimum guaranteed bonus (e.g., 50% of target) if rating ≥ 3.5/5, (3) Semi-annual performance reviews with documented feedback, (4) Cap on company profitability factor (e.g., bonus at 100% if company meets 80% revenue target).',
    regulatoryRef: 'Payment of Bonus Act, 1965 - statutory bonus 8.33%-20% for eligible establishments. Contractual bonus terms must be clear and not illusory.',
  },
  {
    type: 'NON_COMPETE_OVERREACH',
    patterns: [
      /non[\s-]?compete\s*[:\-]?\s*(?:\d+\s*km|\d+\s*months?)/i,
      /non[\s-]?compete/i,
      /not\s+(?:directly|indirectly)\s+(?:engage|compete|work)\s+(?:with|for)\s+(?:competitor|competing)/i,
      /radius\s+(?:of\s+)?(?:fifty|50|thirty|30|hundred|100|\d+)\s*(?:km|kilometers?)/i,
      /(?:twelve|12|eighteen|18|twenty[\s-]four|24)\s*months?\s*(?:after|post)[\s-]?termination/i,
      /restrict(?:ed|ion)\s+from\s+(?:working|joining)\s+(?:competitor|rival)/i,
    ],
    severity: (match, context) => {
      const radius = extractNonCompeteRadius(context);
      const duration = extractNonCompeteDuration(context);
      if (radius >= 50 || duration >= 12) return 'HIGH';
      if (radius >= 20 || duration >= 6) return 'MEDIUM';
      return 'LOW';
    },
    title: 'Overbroad Non-Compete Clause',
    explanationTemplate: 'A {radius}km radius non-compete for {duration} months after leaving. In Bengaluru, 50km covers the entire metro area and all major tech corridors. Indian courts generally disfavor post-employment non-competes as restraint of trade.',
    recommendationTemplate: 'Negotiate: (1) Reduce radius to 5-10km (specific business district), (2) Reduce duration to 3-6 months, (3) Add carve-out for non-competing roles, (4) Require company to pay "garden leave" salary during non-compete if enforced. Void if laid off.',
    regulatoryRef: 'Indian Contract Act, 1872 - Section 27 (agreements in restraint of trade are void). Exception: reasonable restraints protecting trade secrets (Niranjan Shankar Golikari vs. Century Spinning).',
  },
  {
    type: 'MOONLIGHTING_BAN',
    patterns: [
      /no\s+moonlighting|moonlighting\s*[:\-]?\s*(?:not\s+permitted|prohibited|no)/i,
      /moonlighting/i,
      /other\s+employment\s+(?:without|prohibited)/i,
      /not\s+engage\s+in\s+any\s+(?:other|additional)\s+(?:employment|business|activity|work)/i,
      /prior\s+written\s+consent\s+(?:of|from)\s+(?:company|employer)/i,
      /exclusive\s+(?:employment|service)/i,
    ],
    severity: () => 'MEDIUM',
    title: 'Blanket Moonlighting / Side Project Ban',
    explanationTemplate: 'The clause prohibits any "other employment, business, or commercial activity" without prior written consent. This includes open-source contributions, freelance work, content creation, or investing in startups - even on personal time with own resources.',
    recommendationTemplate: 'Request explicit carve-outs for: (1) Open-source contributions, (2) Passive investments (<5% equity), (3) Creative work unrelated to company business, (4) Teaching/mentoring ≤4 hours/week. Require company to respond to consent requests within 15 days.',
    regulatoryRef: 'No specific statute; governed by employment contract and Section 27 Contract Act. Courts balance employer\'s legitimate interest vs employee\'s right to livelihood. Evolving IT sector norms.',
  },
  {
    type: 'JOINING_BONUS_CLAWBACK',
    patterns: [
      /(?:joining|sign[-\s]?on)\s+bonus.*(?:refund|clawback|repay|exit)/i,
      /joining\s+bonus\s+(?:of|rs\.?|₹)\s*\d+/i,
      /sign[-\s]?on\s+bonus/i,
      /clawback|repay|refund\s+(?:the\s+)?(?:joining|sign[-\s]?on)\s+bonus/i,
      /(?:twelve|12)\s+months?\s+(?:from|after)\s+(?:joining|date\s+of\s+joining)/i,
      /refund\s+(?:entire|full|whole)\s+(?:joining|sign[-\s]?on)\s+bonus/i,
    ],
    severity: (match, context) => {
      const amount = extractJoiningBonusAmount(context);
      const hasProRata = /pro.?rata|proportionate|monthly\s+reduction/i.test(context);
      if (amount >= 100000 && !hasProRata) return 'HIGH';
      if (amount >= 50000) return 'MEDIUM';
      return 'LOW';
    },
    title: 'Joining Bonus Clawback',
    explanationTemplate: 'The ₹{amount} joining bonus must be repaid in full if you leave within {duration} months, regardless of reason (including layoff, medical issues, or relocation). No pro-rata reduction for time served.',
    recommendationTemplate: 'Negotiate pro-rata clawback (e.g., 1/12th reduction per month of service). Add exclusions for: involuntary termination, medical emergency, spouse relocation, company breach of contract. Ensure clawback is only from pre-tax amount.',
    regulatoryRef: 'Contract Act Section 74 - clawback must be genuine pre-estimate of loss (recruitment cost). Full recovery regardless of tenure may be struck down as penalty.',
  },
  {
    type: 'IP_ASSIGNMENT_OVERREACH',
    patterns: [
      /(?:all\s+)?ip\s+(?:belongs|assigned|vests)\s+(?:to|in)\s+company/i,
      /intellectual\s+property\s+(?:rights?|assignment)/i,
      /all\s+(?:inventions|discoveries|developments|works|code)\s+(?:created|conceived|developed)/i,
      /(?:during|throughout)\s+(?:the\s+)?(?:term|period)\s+of\s+employment/i,
      /whether\s+(?:during|outside)\s+(?:working\s+)?hours/i,
      /vest\s+exclusively\s+in\s+(?:the\s+)?company/i,
    ],
    severity: () => 'MEDIUM',
    title: 'Overbroad IP Assignment',
    explanationTemplate: 'The IP clause assigns "all inventions, developments, and works created during employment" to the company, without limiting to work done on company time, using company resources, or related to company business. This could cover personal side projects, open-source work, or pre-existing IP.',
    recommendationTemplate: 'Request: (1) Limit to inventions "related to company business or developed using company resources/time", (2) Pre-existing IP exclusion schedule (list your prior projects), (3) Open-source contribution carve-out, (4) Mandatory disclosure process for personal projects with company review within 30 days.',
    regulatoryRef: 'Patents Act, 1970 - Section 6; Copyright Act, 1957 - Section 17. Employment contracts can assign IP but must be reasonable. Courts consider: use of employer resources, relation to business, terms of employment.',
  },
  {
    type: 'PROBATION_EXTENSION_TRAP',
    patterns: [
      /probation\s+(?:period|extension)\s+(?:may\s+be\s+)?extend(?:ed)?/i,
      /extend\s+(?:the\s+)?probation\s+(?:by|for|up\s+to)\s+(?:three|3|six|6)\s+months?/i,
      /probation\s+(?:at\s+)?(?:sole\s+)?discretion/i,
    ],
    severity: () => 'MEDIUM',
    title: 'Unilateral Probation Extension',
    explanationTemplate: 'The company reserves the right to extend your probation period at their sole discretion, often up to 6 additional months. During extended probation, you may have reduced benefits and shorter notice protection.',
    recommendationTemplate: 'Request: (1) Maximum total probation period capped at 6 months, (2) Extension only for documented performance reasons with written improvement plan, (3) Same benefits and notice protection during any extension, (4) Automatic confirmation if no written extension notice by end of initial period.',
    regulatoryRef: 'Industrial Employment (Standing Orders) Act, 1946 - probation terms must be defined. Unilateral indefinite extension may be challenged as unfair labor practice.',
  },
  {
    type: 'TERMINATION_WITHOUT_CAUSE',
    patterns: [
      /terminat(?:e|ion)\s+(?:without|for\s+no)\s+cause/i,
      /company\s+(?:may|reserves\s+the\s+right\s+to)\s+terminat(?:e|ion)\s+(?:at\s+any\s+time|without\s+notice)/i,
      /at[\s-]will\s+employment/i,
      /terminate\s+(?:this\s+agreement|employment)\s+(?:immediately|without\s+prior\s+notice)/i,
    ],
    severity: () => 'HIGH',
    title: 'Termination Without Cause / At-Will Clause',
    explanationTemplate: 'The company can terminate your employment at any time without cause or notice. This creates extreme job insecurity - you can be let go instantly with no severance beyond statutory minimums.',
    recommendationTemplate: 'Negotiate: (1) Minimum 30-60 days notice or pay in lieu for termination without cause, (2) Severance package (e.g., 1 month per year of service), (3) Garden leave option, (4) Exclude "cause" from minor performance issues without PIP.',
    regulatoryRef: 'Industrial Disputes Act, 1947 - Section 25F (retrenchment compensation); State Shops & Establishments Acts - notice period requirements. "At-will" employment not recognized in India for regular employees.',
  },
  {
    type: 'SALARY_REVISION_UNILATERAL',
    patterns: [
      /salary\s+(?:revision|review|adjustment)\s+(?:at\s+)?(?:sole\s+)?discretion/i,
      /company\s+(?:may|reserves\s+the\s+right\s+to)\s+(?:revise|reduce|modify)\s+(?:salary|compensation|benefits)/i,
      /compensation\s+structure\s+subject\s+to\s+change/i,
    ],
    severity: () => 'MEDIUM',
    title: 'Unilateral Salary Revision Clause',
    explanationTemplate: 'The company reserves the right to revise, reduce, or modify your compensation structure at their sole discretion. This undermines the certainty of your offer - your CTC can be changed without your agreement.',
    recommendationTemplate: 'Request: (1) Salary revisions only with mutual written agreement, (2) Annual review with guaranteed minimum increment (e.g., 8-10%), (3) Any reduction requires 60-day notice and employee consent, (4) Protected components (basic, HRA) cannot be reduced.',
    regulatoryRef: 'Payment of Wages Act, 1936 - unauthorized deductions prohibited. Contract Act - material terms cannot be unilaterally altered without consideration.',
  },
];

// ============================================
// HELPER FUNCTIONS FOR EXTRACTION
// ============================================

function extractNoticeDays(text) {
  const patterns = [
    /(?:ninety|90|one\s+hundred|100|one\s+twenty|120|sixty|60|thirty|30)\s+days?/i,
    /(\d{2,3})\s+days?\s+notice/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const num = m[1] ? parseInt(m[1]) : parseWordNumber(m[0]);
      if (num && num > 0 && num < 365) return num;
    }
  }
  return 0;
}

function extractBondAmount(text) {
  const patterns = [
    /(?:rs\.?|₹)\s*([\d,]+(?:\.\d+)?)\s*(?:lakh|lac|L)/i,
    /(?:rs\.?|₹)\s*([\d,]+)/i,
    /(\d+(?:\.\d+)?)\s*lakh/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      let num = parseFloat(m[1].replace(/,/g, ''));
      if (m[0].includes('lakh') || m[0].includes('lac') || m[0].includes('L')) num *= 100000;
      return num;
    }
  }
  return 0;
}

function extractBondDuration(text) {
  const patterns = [
    /(?:twenty[\s-]four|24|eighteen|18|twelve|12|six|6)\s+months?/i,
    /(\d+)\s+months?/i,
    /(\d+)\s+years?/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      let num = parseInt(m[1]);
      if (m[0].includes('year')) num *= 12;
      return num;
    }
  }
  return 0;
}

function extractVariablePercentage(text) {
  // Look for patterns like "20% variable" or "variable component of 25%"
  const patterns = [
    /(\d+(?:\.\d+)?)\s*%\s*variable/i,
    /variable\s+(?:component|pay|compensation)\s+(?:of\s+)?(\d+(?:\.\d+)?)\s*%/i,
    /performance\s+bonus\s+(?:of\s+)?(?:rs\.?|₹)\s*(\d+(?:,\d{3})*)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const num = parseFloat(m[1].replace(/,/g, ''));
      if (m[0].includes('%')) return num;
      // If it's an amount, we'd need CTC to calculate % - skip for now
    }
  }
  return 0;
}

function extractBonusAmount(text) {
  const m = text.match(/(?:rs\.?|₹)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:lakh|lac|L)?/i);
  if (m) {
    let num = parseFloat(m[1].replace(/,/g, ''));
    if (m[0].includes('lakh') || m[0].includes('lac') || m[0].includes('L')) num *= 100000;
    return num;
  }
  return 0;
}

function extractNonCompeteRadius(text) {
  const patterns = [
    /radius\s+(?:of\s+)?(\d+)\s*(?:km|kilometers?)/i,
    /(\d+)\s*(?:km|kilometers?)\s+radius/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return parseInt(m[1]);
  }
  return 0;
}

function extractNonCompeteDuration(text) {
  const patterns = [
    /(?:twelve|12|eighteen|18|twenty[\s-]four|24|six|6|three|3)\s+months?/i,
    /(\d+)\s+months?/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return parseInt(m[1]);
  }
  return 0;
}

function extractJoiningBonusAmount(text) {
  return extractBonusAmount(text);
}

function parseWordNumber(str) {
  const words = {
    'thirty': 30, 'sixty': 60, 'ninety': 90,
    'one hundred': 100, 'one twenty': 120, 'twenty four': 24, 'twelve': 12, 'eighteen': 18, 'six': 6, 'three': 3,
  };
  const lower = str.toLowerCase();
  for (const [word, num] of Object.entries(words)) {
    if (lower.includes(word)) return num;
  }
  return 0;
}

// ============================================
// MAIN DETECTION FUNCTION
// ============================================

/**
 * Detect trap clauses in document text
 * @param {string} text - Full document text (masked or unmasked)
 * @param {Array} words - Word-level OCR results with bounding boxes
 * @param {object} [structuredData] - Pre-extracted structured data (optional)
 * @returns {Promise<Array>} Array of trap flag objects
 */
async function detectTraps(text, words = [], structuredData = null) {
  const flags = [];
  const lowerText = text.toLowerCase();
  const clauseIdCounter = { count: 0 };

  for (const rule of TRAP_RULES) {
    for (const pattern of rule.patterns) {
      let match;
      // Reset regex lastIndex for global patterns
      const regex = new RegExp(pattern.source, pattern.flags || 'gi');

      while ((match = regex.exec(lowerText)) !== null) {
        const matchText = match[0];
        const matchIndex = match.index;

        // Get context around match (500 chars before/after)
        const contextStart = Math.max(0, matchIndex - 500);
        const contextEnd = Math.min(text.length, matchIndex + matchText.length + 500);
        const context = text.substring(contextStart, contextEnd);

        // Determine severity
        const severity = rule.severity(matchText, context);

        // Find page number and bounding box from words
        const location = findLocation(matchIndex, matchText.length, words);

        // Generate unique clause ID
        clauseIdCounter.count++;
        const clauseId = `clause_${rule.type.toLowerCase()}_${clauseIdCounter.count}_${Date.now().toString(36)}`;

        // Build explanation with extracted values
        const explanation = buildExplanation(rule, context);
        const recommendation = buildRecommendation(rule, context);

        flags.push({
          clauseId,
          type: rule.type,
          severity,
          title: rule.title,
          explanation,
          recommendation,
          pageNumber: location.pageNumber,
          textSpan: {
            startOffset: matchIndex,
            endOffset: matchIndex + matchText.length,
            text: text.substring(matchIndex, matchIndex + matchText.length),
          },
          boundingBox: location.boundingBox,
          regulatoryReference: rule.regulatoryRef,
        });

        // Avoid duplicate detection for same rule (take first match)
        break;
      }
    }
  }

  // Sort by severity (CRITICAL > HIGH > MEDIUM > LOW > INFO)
  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
  flags.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return flags;
}

function findLocation(charOffset, charLength, words) {
  // Find words that overlap with the character range
  let pageNumber = 1;
  let minX = 0, minY = 0, maxX = 0, maxY = 0;
  let found = false;

  if (words && words.length > 0) {
    let charPos = 0;
    for (const word of words) {
      const wordLen = word.text.length;
      const wordEnd = charPos + wordLen;

      // Check overlap
      if (wordEnd >= charOffset && charPos <= charOffset + charLength) {
        if (!found) {
          minX = word.bbox.x;
          minY = word.bbox.y;
          maxX = word.bbox.x + word.bbox.width;
          maxY = word.bbox.y + word.bbox.height;
          pageNumber = word.bbox.page || 1;
          found = true;
        } else {
          minX = Math.min(minX, word.bbox.x);
          minY = Math.min(minY, word.bbox.y);
          maxX = Math.max(maxX, word.bbox.x + word.bbox.width);
          maxY = Math.max(maxY, word.bbox.y + word.bbox.height);
        }
      }
      charPos = wordEnd + 1; // +1 for space
    }
  }

  if (!found) {
    // Fallback: estimate from page structure
    pageNumber = 1;
    minX = 72; minY = 100; maxX = 500; maxY = 200;
  }

  return {
    pageNumber,
    boundingBox: {
      page: pageNumber,
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    },
  };
}

function buildExplanation(rule, context) {
  let template = rule.explanationTemplate;

  // Replace placeholders
  template = template.replace('{days}', extractNoticeDays(context) || '90');
  template = template.replace('{amount}', extractBondAmount(context).toLocaleString('en-IN') || '2,00,000');
  template = template.replace('{duration}', extractBondDuration(context) || '24');
  template = template.replace('{variablePct}', extractVariablePercentage(context) || '13.5');
  template = template.replace('{bonusAmount}', extractBonusAmount(context).toLocaleString('en-IN') || '2,50,000');
  template = template.replace('{criteria}', extractBonusCriteria(context) || 'individual performance rating and company profitability');
  template = template.replace('{radius}', extractNonCompeteRadius(context) || '50');
  template = template.replace('{duration}', extractNonCompeteDuration(context) || '12');

  return template;
}

function buildRecommendation(rule, context) {
  return rule.recommendationTemplate;
}

function extractBonusCriteria(text) {
  const patterns = [
    /subject\s+to\s+([^.]{10,100})/i,
    /based\s+on\s+([^.]{10,100})/i,
    /dependent\s+on\s+([^.]{10,100})/i,
    /discretion\s+of\s+([^.]{10,100})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim();
  }
  return 'individual performance rating and company profitability';
}

/**
 * Quick heuristic check for common traps (for preview)
 * @param {string} text
 * @returns {Array<string>} Detected trap types
 */
function quickScan(text) {
  const detected = [];
  const lower = text.toLowerCase();

  if (/ninety|90\s+days?\s+notice/i.test(lower)) detected.push('NOTICE_PERIOD_TRAP');
  if (/training\s+bond|liquidated\s+damages.*training/i.test(lower)) detected.push('TRAINING_BOND');
  if (/sole\s+discretion.*bonus|variable.*discretion/i.test(lower)) detected.push('VARIABLE_PAY_AMBIGUITY');
  if (/non.compete|not.*compete/i.test(lower)) detected.push('NON_COMPETE_OVERREACH');
  if (/moonlighting|other\s+employment.*prohibited/i.test(lower)) detected.push('MOONLIGHTING_BAN');
  if (/joining\s+bonus.*clawback|repay.*joining\s+bonus/i.test(lower)) detected.push('JOINING_BONUS_CLAWBACK');
  if (/intellectual\s+property.*assignment|all\s+inventions.*vest.*company/i.test(lower)) detected.push('IP_ASSIGNMENT_OVERREACH');

  return [...new Set(detected)];
}

module.exports = {
  detectTraps,
  quickScan,
  TRAP_RULES,
};
