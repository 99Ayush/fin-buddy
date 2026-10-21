/**
 * Documents Module - Trap Detector (trapDetector.js)
 *
 * Evidence-based clause classifier.
 *
 * A rule produces a finding ONLY when the document literally contains the clause
 * it describes, together with the concrete terms that make it a risk (a stated
 * number of days, an amount, a radius, a duration, explicit prohibition wording).
 *
 * Nothing is inferred, defaulted or invented:
 * - if a number is absent from the clause, the explanation omits it rather than
 *   filling in a typical value;
 * - if the evidence is not present, the rule stays silent. An empty result is a
 *   valid, honest result.
 */

// ============================================
// TEXT HELPERS
// ============================================

const NUMBER_WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, fifteen: 15, eighteen: 18, twenty: 20, thirty: 30,
  forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100,
};

const NUMBER_WORD_ALT = Object.keys(NUMBER_WORDS).join('|');

/** Matches a digit run (up to 3 digits) or a short word-number phrase. */
const NUM = `(\\d{1,3}|(?:(?:${NUMBER_WORD_ALT})(?:[\\s-]+(?:${NUMBER_WORD_ALT})){0,2}))`;

/**
 * Convert "90", "ninety", "twenty four" or "one hundred twenty" to a number.
 * @returns {number|null} null when the phrase is not a number
 */
function wordsToNumber(phrase) {
  const cleaned = String(phrase || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return null;
  if (/^\d+$/.test(cleaned)) return parseInt(cleaned, 10);

  const tokens = cleaned.split(' ');
  let total = 0;
  let current = 0;

  for (const token of tokens) {
    const value = NUMBER_WORDS[token];
    if (value === undefined) return null;
    if (value === 100) {
      current = (current || 1) * 100;
      total += current;
      current = 0;
    } else {
      current += value;
    }
  }

  const result = total + current;
  return result > 0 ? result : null;
}

/**
 * The "clause" around a match: its line, widened to the next line when the line
 * is too short to contain the clause's terms. Keeps number extraction scoped so
 * an unrelated figure elsewhere in the document cannot be picked up.
 * @param {string} text
 * @param {number} index - Match offset
 * @param {number} length - Match length
 * @returns {{ text: string, start: number }} Clause text and its absolute offset
 */
function clauseWindow(text, index, length = 0) {
  const rawStart = Math.max(0, text.lastIndexOf('\n', index) + 1);
  let end = text.indexOf('\n', index + length);
  if (end === -1) end = text.length;

  let raw = text.slice(rawStart, end);

  if (raw.trim().length < 40) {
    const nextEnd = text.indexOf('\n', end + 1);
    raw = text.slice(rawStart, nextEnd === -1 ? text.length : nextEnd);
  }

  const leading = raw.length - raw.trimStart().length;
  const trimmed = raw.trim().slice(0, 600);

  return { text: trimmed, start: rawStart + leading };
}

/** Extract a rupee amount from a clause window, or null when absent. */
function findAmount(text) {
  const patterns = [
    /(?:rs\.?|inr|₹)\s*(\d[\d,]*(?:\.\d+)?)\s*(lakhs?|lacs?|crores?|cr)\b/i,
    /(?:rs\.?|inr|₹)\s*(\d[\d,]*(?:\.\d+)?)([lLkK])\b/,
    /(\d[\d,]*(?:\.\d+)?)\s*(lakhs?|lacs?|crores?)\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;

    const base = parseFloat(match[1].replace(/,/g, ''));
    if (!Number.isFinite(base)) continue;

    const unit = (match[2] || '').toLowerCase();
    if (unit.startsWith('lakh') || unit.startsWith('lac') || unit === 'l') return Math.round(base * 100000);
    if (unit.startsWith('cr')) return Math.round(base * 10000000);
    if (unit === 'k') return Math.round(base * 1000);
    return Math.round(base);
  }

  return null;
}

/** Extract a duration in months from a clause window, or null when absent. */
function findDurationMonths(text) {
  const monthMatch = text.match(new RegExp(`${NUM}\\s*(?:\\([^)]*\\)\\s*)?(?:months?|mos?)\\b`, 'i'));
  if (monthMatch) {
    const months = wordsToNumber(monthMatch[1]);
    if (months) return months;
  }

  const yearMatch = text.match(new RegExp(`${NUM}\\s*(?:\\([^)]*\\)\\s*)?(?:years?|yrs?)\\b`, 'i'));
  if (yearMatch) {
    const years = wordsToNumber(yearMatch[1]);
    if (years) return years * 12;
  }

  return null;
}

/** Extract a day count from a clause window, or null when absent. */
function findDays(text) {
  const match = text.match(new RegExp(`${NUM}\\s*(?:\\([^)]*\\)\\s*)?(?:days?|day)\\b`, 'i'));
  if (!match) return null;
  return wordsToNumber(match[1]);
}

/** Extract a kilometre radius from a clause window, or null when absent. */
function findRadiusKm(text) {
  const match = text.match(new RegExp(`(?:radius\\s*(?:of\\s*)?)?${NUM}\\s*(?:kms?|kilometers?|kilometres?)\\b`, 'i'));
  if (!match) return null;
  return wordsToNumber(match[1]);
}

/** Extract a percentage from a clause window, or null when absent. */
function findPercent(text) {
  const match = text.match(/(\d{1,3}(?:\.\d+)?)\s*(?:%|percent)/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  return Number.isFinite(value) ? value : null;
}

/** True when the window states a pro-rata / proportionate recovery. */
function hasProRata(text) {
  return /pro[\s-]?rata|proportionate|1\s*\/\s*12|monthly\s+reduction|reduc\w+\s+proportionately/i.test(text);
}

/** Indian digit grouping for explanations. */
function inr(value) {
  return Number(value).toLocaleString('en-IN');
}

// ============================================
// TRAP RULES
// ============================================
// Each rule exposes detect(text, structuredData) which returns either null
// (no genuine evidence) or { evidence, offset, severity, explanation, ... }.

const TRAP_RULES = [
  {
    type: 'NOTICE_PERIOD_TRAP',
    title: 'Extended Notice Period',
    regulatoryReference:
      'Industrial Disputes Act, 1947 - Section 25F; there is no statutory maximum in the private sector, but courts scrutinise unreasonably long periods as a restraint on mobility.',
    detect(text) {
      const patterns = [
        new RegExp(`notice\\s*period\\s*(?:is|of|for|:|-)?\\s*${NUM}\\s*(?:\\([^)]*\\)\\s*)?days?`, 'i'),
        new RegExp(`${NUM}\\s*(?:\\([^)]*\\)\\s*)?days'?\\s*(?:prior\\s+)?(?:written\\s+)?notice\\s*period`, 'i'),
        new RegExp(`notice\\s*(?:of|is|for)\\s*${NUM}\\s*(?:\\([^)]*\\)\\s*)?days?`, 'i'),
        new RegExp(`${NUM}\\s*(?:\\([^)]*\\)\\s*)?days'?\\s*(?:prior\\s+)?(?:written\\s+)?notice`, 'i'),
      ];

      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (!match) continue;

        const days = wordsToNumber(match[1]);
        // 30-45 day notice periods are normal in India; only 60+ is worth flagging.
        if (!days || days < 60) continue;

        const { text: window, start } = clauseWindow(text, match.index, match[0].length);

        return {
          evidence: window,
          offset: start,
          severity: days >= 90 ? 'HIGH' : 'MEDIUM',
          explanation:
            `The document states a ${days}-day notice period. The usual private-sector range is 30-60 days, and a longer period delays your ability to join a new employer.`,
          recommendation:
            'Ask HR to reduce the notice period, or to add a written buyout clause allowing you to pay 1-2 months of gross salary in lieu of serving the full period.',
        };
      }

      return null;
    },
  },

  {
    type: 'TRAINING_BOND',
    title: 'Training Bond / Service Bond',
    regulatoryReference:
      'Indian Contract Act, 1872 - Section 74 (liquidated damages must be a genuine pre-estimate of loss). Courts have struck down excessive retention bonds.',
    detect(text) {
      const bondPattern =
        /(training\s+(?:bond|agreement|commitment)|service\s+bond|bond\s+(?:amount|penalty|sum)|liquidated\s+damages|minimum\s+(?:service|retention)\s+period|compulsory\s+(?:service|retention))/i;
      const match = text.match(bondPattern);
      if (!match) return null;

      const { text: window, start } = clauseWindow(text, match.index, match[0].length);
      const amount = findAmount(window);
      const months = findDurationMonths(window);

      // Without a stated amount or a real retention period there is nothing to flag.
      if (!amount && !(months && months >= 6)) return null;

      let severity = 'MEDIUM';
      if ((amount && amount >= 200000) || (months && months >= 24)) severity = 'CRITICAL';
      else if ((amount && amount >= 100000) || (months && months >= 18)) severity = 'HIGH';

      const terms = [];
      if (amount) terms.push(`a ₹${inr(amount)} penalty`);
      if (months) terms.push(`a ${months}-month commitment`);

      return {
        evidence: window,
        offset: start,
        severity,
        explanation:
          `The document ties your exit to ${terms.join(' and ')}. Indian courts enforce such clauses only where the employer can show the amount is a genuine pre-estimate of actual training cost.`,
        recommendation:
          'Ask for the bond to be capped at documented training expenses, reduced pro-rata for each month served, and waived on involuntary termination or medical grounds.',
      };
    },
  },

  {
    type: 'VARIABLE_PAY_AMBIGUITY',
    title: 'Discretionary Variable Pay',
    regulatoryReference:
      'Payment of Bonus Act, 1965 - statutory bonus is 8.33%-20% for eligible establishments. Contractual bonus terms must not be illusory.',
    detect(text, structuredData) {
      const variablePattern = /(variable\s+(?:pay|component|compensation|bonus)|performance\s+bonus|annual\s+bonus|target\s+bonus|incentive\s+(?:pay|plan))/i;
      const discretionPattern =
        /(sole\s+discretion|at\s+the\s+discretion|management\s+discretion|discretion\s+of\s+(?:the\s+)?(?:management|company|board)|subject\s+to\s+(?:performance|management|company|approval|discretion)|not\s+guaranteed|no\s+guarantee|purely\s+discretionary)/i;

      const match = text.match(variablePattern);
      if (!match) return null;

      const { text: window, start } = clauseWindow(text, match.index, match[0].length);
      const discretion = window.match(discretionPattern);
      if (!discretion) return null; // measurable criteria stated -> not a trap

      const amount = findAmount(window);
      const statedPercent = findPercent(window);

      let percent = statedPercent;
      if (percent === null && amount) {
        const ctc = structuredData?.compensation?.ctcAnnual;
        if (Number.isFinite(ctc) && ctc > 0) percent = Math.round((amount / ctc) * 1000) / 10;
      }

      let severity = 'MEDIUM';
      if (percent !== null) {
        if (percent > 25) severity = 'HIGH';
        else if (percent > 15) severity = 'MEDIUM';
        else severity = 'LOW';
      }

      const amountText = amount ? ` of ₹${inr(amount)}` : '';
      const percentText = percent !== null ? ` (${percent}% of CTC)` : '';

      return {
        evidence: window,
        offset: start,
        severity,
        explanation:
          `The variable component${amountText}${percentText} is described as "${discretion[0].trim()}", so the payout is not guaranteed and no measurable target is set in the clause.`,
        recommendation:
          'Ask for written, measurable payout criteria, a minimum guaranteed floor if targets are met, and the review dates in writing.',
      };
    },
  },

  {
    type: 'NON_COMPETE_OVERREACH',
    title: 'Post-Employment Non-Compete Restriction',
    regulatoryReference:
      'Indian Contract Act, 1872 - Section 27 (agreements in restraint of trade are void). Reasonable restraints protecting trade secrets are the recognised exception.',
    detect(text) {
      const pattern =
        /(non[\s-]?compete|non[\s-]?solicit|not\s+(?:directly|indirectly)\s+(?:engage|compete|work)\s+(?:with|for)\s+(?:a\s+)?(?:competitor|competing)|restrict\w*\s+from\s+(?:working|joining)\s+(?:a\s+)?(?:competitor|rival))/i;
      const match = text.match(pattern);
      if (!match) return null;

      const { text: window, start } = clauseWindow(text, match.index, match[0].length);
      const radius = findRadiusKm(window);
      const months = findDurationMonths(window);

      // A bare mention of "non-compete" with no terms is not a finding.
      if (!radius && !months) return null;

      let severity = 'LOW';
      if ((radius && radius >= 50) || (months && months >= 12)) severity = 'HIGH';
      else if ((radius && radius >= 20) || (months && months >= 6)) severity = 'MEDIUM';

      const terms = [];
      if (radius) terms.push(`${radius} km`);
      if (months) terms.push(`${months} months after you leave`);

      return {
        evidence: window,
        offset: start,
        severity,
        explanation:
          `The document restricts you for ${terms.join(' and ')}. Post-employment non-competes are generally unenforceable in India under Section 27 of the Contract Act.`,
        recommendation:
          'Ask to remove the post-employment restriction, or to narrow it to solicitation of named clients, or to make it paid garden leave.',
      };
    },
  },

  {
    type: 'MOONLIGHTING_BAN',
    title: 'Blanket Moonlighting / Side Project Ban',
    regulatoryReference:
      'No dedicated statute; governed by the employment contract and Section 27 of the Contract Act. Courts balance the employer\'s interest against the employee\'s right to livelihood.',
    detect(text) {
      const pattern =
        /(no\s+moonlighting|moonlighting[^.\n]{0,60}(?:not\s+(?:permitted|allowed)|prohibited|not\s+acceptable)|moonlighting\s+is\s+(?:not\s+)?(?:permitted|allowed|prohibited)|shall\s+not\s+(?:engage|undertake|accept)[^.\n]{0,60}(?:any\s+)?(?:other|additional|outside)\s+(?:employment|business|work|activity|assignment)|no\s+(?:other\s+)?(?:employment|business|engagement)[^.\n]{0,40}(?:without|prohibited|not\s+permitted)|exclusive\s+(?:employment|service)|prior\s+written\s+consent[^.\n]{0,60}(?:other|outside|any)\s+(?:employment|work|business))/i;
      const match = text.match(pattern);
      if (!match) return null;

      const { text: window, start } = clauseWindow(text, match.index, match[0].length);

      return {
        evidence: window,
        offset: start,
        severity: 'MEDIUM',
        explanation:
          'The document restricts other employment, business or commercial activity without prior written consent. Depending on how broadly it is worded, this can also cover open-source work, freelancing or unpaid side projects.',
        recommendation:
          'Ask for explicit carve-outs for open-source contributions, passive investments, and unpaid creative work, plus a response deadline for consent requests.',
      };
    },
  },

  {
    type: 'JOINING_BONUS_CLAWBACK',
    title: 'Joining Bonus Clawback',
    regulatoryReference:
      'Indian Contract Act, 1872 - Section 74. Full recovery regardless of tenure may be struck down as a penalty rather than a genuine pre-estimate.',
    detect(text) {
      const bonusPattern = /(joining\s+bonus|sign[\s-]?on\s+bonus|signing\s+bonus)/i;
      const match = text.match(bonusPattern);
      if (!match) return null;

      const { text: window, start } = clauseWindow(text, match.index, match[0].length);
      const clawback = /(refund|repay|repayment|recover\w*|claw[\s-]?back|forfeit\w*)/i.test(window);
      if (!clawback) return null; // a joining bonus with no recovery clause is not a trap

      const amount = findAmount(window);
      const months = findDurationMonths(window);
      const proRata = hasProRata(window);

      let severity = 'LOW';
      if (amount && amount >= 100000 && !proRata) severity = 'HIGH';
      else if (amount && amount >= 50000) severity = 'MEDIUM';
      else if (!amount && !proRata) severity = 'MEDIUM';

      const amountText = amount ? `₹${inr(amount)} ` : '';
      const monthsText = months ? ` within ${months} months of joining` : '';
      const proRataText = proRata
        ? 'The clause does provide for pro-rata reduction.'
        : 'The clause does not provide for any pro-rata reduction.';

      return {
        evidence: window,
        offset: start,
        severity,
        explanation:
          `The ${amountText}joining bonus must be repaid${monthsText}. ${proRataText}`,
        recommendation:
          'Negotiate pro-rata recovery (for example 1/12th reduction per month served) and exclusions for involuntary termination, medical grounds or company breach.',
      };
    },
  },

  {
    type: 'IP_ASSIGNMENT_OVERREACH',
    title: 'Overbroad IP Assignment',
    regulatoryReference:
      'Patents Act, 1970 - Section 6; Copyright Act, 1957 - Section 17. Assignments are enforceable, but courts look at whether the work used employer resources or relates to the employer\'s business.',
    detect(text) {
      const ipPattern = /(intellectual\s+property|\bip\b|inventions?|discoveries|developments?|works?\s+of\s+authorship)/i;
      const assignPattern =
        /(belongs?\s+(?:exclusively\s+)?to\s+(?:the\s+)?company|vests?\s+(?:exclusively\s+)?in\s+(?:the\s+)?company|assigned\s+to\s+(?:the\s+)?company|(?:sole\s+)?property\s+of\s+(?:the\s+)?company|company\s+(?:shall\s+)?(?:solely\s+)?own)/i;
      // Overreach = the clause is not limited to work done for the company.
      const overreachPattern =
        /(all\s+(?:inventions|discoveries|developments|works|ip|intellectual\s+property)|whether\s+(?:or\s+not\s+)?(?:during|outside)|exclusively|at\s+any\s+time|without\s+limitation|arising\s+out\s+of\s+employment)/i;

      const match = text.match(ipPattern);
      if (!match) return null;

      const { text: window, start } = clauseWindow(text, match.index, match[0].length);
      if (!assignPattern.test(window) || !overreachPattern.test(window)) return null;

      return {
        evidence: window,
        offset: start,
        severity: 'MEDIUM',
        explanation:
          'The IP clause assigns inventions and works to the company in broad terms, without clearly limiting the assignment to work done on company time, with company resources, or related to the company\'s business.',
        recommendation:
          'Ask to limit the assignment to work related to the company\'s business or created using company resources, and to list your pre-existing projects as excluded.',
      };
    },
  },

  {
    type: 'PROBATION_EXTENSION_TRAP',
    title: 'Unilateral Probation Extension',
    regulatoryReference:
      'Industrial Employment (Standing Orders) Act, 1946 - probation terms must be defined; indefinite unilateral extension may be challenged as an unfair labour practice.',
    detect(text) {
      const pattern =
        /(probation[^.\n]{0,80}(?:may\s+be\s+)?extend\w*|extend\w*[^.\n]{0,40}probation|probation[^.\n]{0,60}(?:sole\s+)?discretion)/i;
      const match = text.match(pattern);
      if (!match) return null;

      const { text: window, start } = clauseWindow(text, match.index, match[0].length);
      const months = findDurationMonths(window);

      return {
        evidence: window,
        offset: start,
        severity: 'MEDIUM',
        explanation:
          `The document lets the company extend probation${months ? ` by up to ${months} months` : ''} at its discretion, which can delay confirmation and the benefits that come with it.`,
        recommendation:
          'Ask for a cap on total probation, extension only for documented performance reasons, and confirmation if no written extension is issued before the initial period ends.',
      };
    },
  },

  {
    type: 'TERMINATION_WITHOUT_CAUSE',
    title: 'Termination Without Cause / At-Will Clause',
    regulatoryReference:
      'Industrial Disputes Act, 1947 - Section 25F (retrenchment compensation); state Shops and Establishments Acts set notice requirements. At-will employment is not recognised for regular employees in India.',
    detect(text) {
      const pattern =
        /(terminat\w+[^.\n]{0,60}without\s+(?:assigning\s+)?(?:any\s+)?(?:cause|reason)|terminat\w+[^.\n]{0,60}without\s+(?:any\s+)?(?:prior\s+)?notice|terminat\w+[^.\n]{0,40}at\s+any\s+time|at[\s-]will\s+employment|immediate\s+termination\s+without)/i;
      const match = text.match(pattern);
      if (!match) return null;

      const { text: window, start } = clauseWindow(text, match.index, match[0].length);

      return {
        evidence: window,
        offset: start,
        severity: 'HIGH',
        explanation:
          'The document allows the company to end the employment without cause or without notice, leaving no contractual severance beyond the statutory minimum.',
        recommendation:
          'Ask for a minimum notice period or pay in lieu for termination without cause, and for severance expressed in writing.',
      };
    },
  },

  {
    type: 'SALARY_REVISION_UNILATERAL',
    title: 'Unilateral Salary Revision Clause',
    regulatoryReference:
      'Payment of Wages Act, 1936 - unauthorised deductions are prohibited. Material contract terms cannot be altered unilaterally without consideration.',
    detect(text) {
      const revisionPattern = /(salary|compensation|remuneration|ctc)[^.\n]{0,60}(?:revis\w*|reduc\w*|modif\w*|alter\w*|change\w*|adjust\w*)/i;
      const unilateralPattern =
        /(sole\s+discretion|at\s+(?:its|the)\s+(?:sole\s+)?discretion|unilater\w+|without\s+(?:your|the\s+employee'?s?)\s+(?:prior\s+)?consent|reserves?\s+the\s+right)/i;

      const match = text.match(revisionPattern);
      if (!match) return null;

      const { text: window, start } = clauseWindow(text, match.index, match[0].length);
      if (!unilateralPattern.test(window)) return null;

      return {
        evidence: window,
        offset: start,
        severity: 'MEDIUM',
        explanation:
          'The document lets the company revise, reduce or restructure compensation at its own discretion, so the stated CTC is not guaranteed for the full term.',
        recommendation:
          'Ask for revisions to require mutual written agreement, and for protected components that cannot be reduced without consent.',
      };
    },
  },
];

// ============================================
// LOCATION MAPPING
// ============================================

function findLocation(charOffset, charLength, words) {
  let pageNumber = 1;
  let minX = 0, minY = 0, maxX = 0, maxY = 0;
  let found = false;

  if (words && words.length > 0) {
    let charPos = 0;
    for (const word of words) {
      const wordEnd = charPos + word.text.length;

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
      charPos = wordEnd + 1; // +1 for the joining space
    }
  }

  return {
    pageNumber,
    boundingBox: {
      page: pageNumber,
      x: minX,
      y: minY,
      width: Math.max(0, maxX - minX),
      height: Math.max(0, maxY - minY),
    },
  };
}

// ============================================
// MAIN DETECTION FUNCTION
// ============================================

/**
 * Run every rule against the document text.
 * @param {string} text
 * @param {object} [structuredData]
 * @returns {Array<object>} findings (raw, without location data)
 */
function runRules(text, structuredData = null) {
  const findings = [];

  for (const rule of TRAP_RULES) {
    try {
      const finding = rule.detect(text, structuredData);
      if (finding && finding.evidence) {
        findings.push({ rule, finding });
      }
    } catch (error) {
      console.warn(`[TRAPS] Rule ${rule.type} failed: ${error.message}`);
    }
  }

  return findings;
}

/**
 * Detect trap clauses in document text.
 * Returns only findings backed by clause text that is actually present.
 *
 * @param {string} text - Full document text
 * @param {Array} words - Word-level OCR results with bounding boxes
 * @param {object} [structuredData] - Pre-extracted structured data (optional)
 * @returns {Promise<Array>} Array of trap flag objects
 */
async function detectTraps(text, words = [], structuredData = null) {
  if (!text || typeof text !== 'string') return [];

  const findings = runRules(text, structuredData);
  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };

  return findings
    .map(({ rule, finding }, index) => {
      const offset = Math.max(0, finding.offset || 0);
      const location = findLocation(offset, finding.evidence.length, words);

      return {
        clauseId: `clause_${rule.type.toLowerCase()}_${index + 1}_${Date.now().toString(36)}`,
        type: rule.type,
        severity: finding.severity,
        title: rule.title,
        explanation: finding.explanation,
        recommendation: finding.recommendation,
        pageNumber: location.pageNumber,
        textSpan: {
          startOffset: offset,
          endOffset: offset + finding.evidence.length,
          text: finding.evidence,
        },
        boundingBox: location.boundingBox,
        regulatoryReference: rule.regulatoryReference,
      };
    })
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

/**
 * Types of clauses genuinely detected in the text (used for previews).
 * @param {string} text
 * @returns {Array<string>} Detected trap types
 */
function quickScan(text) {
  if (!text || typeof text !== 'string') return [];
  return [...new Set(runRules(text).map(({ rule }) => rule.type))];
}

module.exports = {
  detectTraps,
  quickScan,
  TRAP_RULES,
  // exported for reuse/testing
  wordsToNumber,
  clauseWindow,
  findAmount,
  findDurationMonths,
  findDays,
  findRadiusKm,
  findPercent,
};
