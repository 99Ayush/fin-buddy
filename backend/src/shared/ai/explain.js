/**
 * Plain-Language Explainer (explain.js)
 * Translates complex legal/financial jargon into plain language.
 * Supports Fresher Depth ("Explain like I'm 5") vs Veteran Depth ("Explain like a pro").
 * Localization: English + Hindi.
 */

// Explanation depth: 'fresher' or 'veteran'
let currentDepth = 'fresher';
// Language: 'en' or 'hi'
let currentLanguage = 'en';

// ============================================
// EXPLANATION TEMPLATES (ENGLISH)
// ============================================

const explanationsEn = {
  fresher: {
    // Compensation terms
    'base_salary': 'This is your fixed monthly salary before any extras. It\'s the foundation of your pay.',
    'hra': 'House Rent Allowance - money to help pay rent. You can save tax on this if you actually pay rent.',
    'special_allowance': 'Extra money added to your salary. Fully taxable, no special rules.',
    'pf_employer': 'Money your company adds to your retirement fund (PF). You don\'t see this in hand, but it\'s yours.',
    'pf_employee': 'Your contribution to PF (12% of basic). Deducted from your salary, goes to your retirement account.',
    'gratuity': 'A thank-you payment when you leave after 5+ years. About 4.81% of your basic salary per year.',
    'professional_tax': 'State tax (max ₹2,500/year). Small deduction, varies by state.',
    'performance_bonus': 'Extra money if you and the company do well. Not guaranteed - depends on ratings.',
    'joining_bonus': 'One-time payment when you join. Often has a "clawback" - you must return it if you leave early.',
    'retention_bonus': 'Bonus to stay longer. Usually paid after 1-2 years.',
    'clawback_period': 'Time period where you must return bonuses if you leave. E.g., 12 months = repay if you quit within a year.',
    'esop': 'Employee Stock Options - right to buy company shares at a fixed price later. Value depends on company growth.',
    'strike_price': 'Price you pay per share when exercising ESOPs. Lower is better for you.',
    'vesting_schedule': 'Timeline when your ESOPs become yours. Typical: 25% per year after 1-year cliff.',
    'cliff': 'Waiting period before any ESOPs vest. Usually 1 year - you get nothing if you leave before.',

    // Contractual terms
    'notice_period': 'Days you must work after resigning. 90 days is HIGH - industry standard is 30-60. Negotiate down!',
    'probation_period': 'Trial period (usually 3-6 months). Either side can leave with shorter notice.',
    'bond_duration': 'Commitment to stay (e.g., 2 years). Leaving early triggers a penalty.',
    'bond_penalty': 'Money you pay if you break the bond. ₹2L is HIGH. Must reflect actual training cost.',
    'non_compete': 'Restriction on working for competitors after leaving. 50km radius in Bangalore = entire city. Often unenforceable.',
    'moonlighting': 'Ban on side work/freelancing. Blanket bans are questionable for personal-time projects.',
    'ip_assignment': 'Company owns what you create. Should only cover work done on company time/resources for company business.',

    // Traps
    'NOTICE_PERIOD_TRAP': '⚠️ 90-day notice traps you. Hard to switch jobs. Negotiate 60 days max or buyout clause.',
    'TRAINING_BOND': '🚨 ₹2L bond for 2 years is aggressive. Ask for pro-rata reduction and actual cost proof.',
    'VARIABLE_PAY_AMBIGUITY': '⚠️ Bonus criteria vague. Get written targets, minimum guarantee, and semi-annual reviews.',
    'NON_COMPETE_OVERREACH': '🚨 50km non-compete covers all Bangalore tech. Negotiate 5-10km, 3-6 months, with garden leave pay.',
    'MOONLIGHTING_BAN': '⚠️ Blanket ban on side projects. Request carve-outs for open source, passive investing, unrelated creative work.',
    'JOINING_BONUS_CLAWBACK': '⚠️ Full ₹1L repay if you leave in 1 year. Negotiate pro-rata (1/12th per month).',
    'IP_ASSIGNMENT_OVERREACH': '⚠️ Company claims ALL your IP. Limit to company-business-related work on company time.',
  },
  veteran: {
    'base_salary': 'Basic salary (40-50% of CTC). Determines PF, Gratuity, HRA exemption. Fully taxable.',
    'hra': 'HRA exemption = min(Actual HRA, 50% Basic [metro]/40% [non-metro], Rent - 10% Basic). Requires rent receipts.',
    'special_allowance': 'Fully taxable balancing component. No exemptions. Often used to adjust CTC structure.',
    'pf_employer': '12% of Basic (capped at ₹15,000/month = ₹1,800). Part of CTC, not in-hand. EPS portion (8.33%) goes to pension.',
    'pf_employee': '12% of Basic deducted from gross. 80C eligible. Can opt for VPF (voluntary) up to 100% of Basic.',
    'gratuity': '15/26 × Basic × Years of Service. Payable after 5 years continuous service. Tax-free up to ₹20L.',
    'professional_tax': 'State levy (Karnataka: ₹200/month). Deductible from gross salary under Section 16.',
    'performance_bonus': 'Variable pay component. Taxed at slab rate. Ensure KPIs are SMART and documented.',
    'joining_bonus': 'Sign-on bonus. Taxable as salary. Clawback clauses must be genuine pre-estimate of loss (Sec 74 Contract Act).',
    'retention_bonus': 'Retention bonus. Often structured as deferred bonus with vesting. Taxable on receipt.',
    'clawback_period': 'Repayment obligation period. Pro-rata reduction per month served is standard market practice.',
    'esop': 'ESOPs = right to purchase shares at strike price. Taxed twice: (1) Perquisite tax on exercise (Sec 17(2)), (2) Capital gains on sale.',
    'strike_price': 'Exercise price. For unlisted companies, often at last funding round valuation / 10-20.',
    'vesting_schedule': 'Standard: 4-year, 25% annual vesting, 1-year cliff. Accelerated vesting on change of control (single/double trigger).',
    'cliff': 'Cliff period. No vesting before cliff. Leaving at 11 months = 0% vested.',

    'notice_period': '90 days exceeds market norm (30-60). Impacts job mobility. Negotiate buyout (1-2 months gross) or garden leave.',
    'probation_period': 'Statutory max varies. During probation, notice period typically 15-30 days.',
    'bond_duration': 'Training bond enforceable only if: (1) Actual training provided, (2) Amount = genuine pre-estimate, (3) Reasonable duration.',
    'bond_penalty': 'Liquidated damages under Sec 74. Courts reduce excessive amounts. Request itemized training cost breakdown.',
    'non_compete': 'Post-employment non-competes prima facie void under Sec 27 Contract Act. Exception: trade secret protection (Golikari precedent).',
    'moonlighting': 'No statutory ban. Enforceability depends on: conflict of interest, IP overlap, resource misuse. Carve-outs are standard.',
    'ip_assignment': 'Employer owns IP created in course of employment (Sec 17 Copyright Act). Personal projects on own time/resources = yours.',

    'NOTICE_PERIOD_TRAP': '🔴 90-day notice = reduced bargaining power. Counter: 60 days + 30-day buyout option at 1x gross.',
    'TRAINING_BOND': '🔴 ₹2L/2yr bond. Demand: (1) Itemized training costs, (2) Pro-rata recovery, (3) Exclusions for layoff/medical/relocation.',
    'VARIABLE_PAY_AMBIGUITY': '🟡 >20% variable with undefined KPIs. Insist on: documented scorecard, 50% floor at 3.5/5 rating, quarterly check-ins.',
    'NON_COMPETE_OVERREACH': '🔴 50km/12mo = de facto industry ban in Bengaluru. Counter: 5km/6mo + 3mo garden leave at 100% pay.',
    'MOONLIGHTING_BAN': '🟡 Blanket ban. Standard carve-outs: OSS (<20hrs/mo), passive investing (<5%), unrelated creative, teaching ≤4hrs/wk.',
    'JOINING_BONUS_CLAWBACK': '🔴 Full clawback regardless of tenure. Negotiate: monthly pro-rata, waiver on involuntary exit, pre-tax recovery only.',
    'IP_ASSIGNMENT_OVERREACH': '🟡 Overbroad assignment. Add: "related to Company business", "using Company resources", pre-existing IP schedule.',
  },
};

// ============================================
// EXPLANATION TEMPLATES (HINDI)
// ============================================

const explanationsHi = {
  fresher: {
    'base_salary': 'यह आपकी निश्चित मासिक तनख्वाह है, बिना किसी एक्स्ट्रा के। यही आपकी सैलरी का आधार है।',
    'hra': 'हाउस रेंट अलाउंस - किराया चुकाने में मदद के लिए पैसा। अगर आप सच में किराया देते हैं तो इस पर टैक्स बचा सकते हैं।',
    'special_allowance': 'सैलरी में जुड़ा हुआ एक्स्ट्रा पैसा। पूरी तरह टैक्सेबल, कोई खास नियम नहीं।',
    'pf_employer': 'कंपनी आपकी रिटायरमेंट फंड (PF) में जो पैसा डालती है। यह आपके हाथ में नहीं आता, लेकिन आपका ही है।',
    'pf_employee': 'आपका PF योगदान (बेसिक का 12%)। सैलरी से कटता है, आपके रिटायरमेंट अकाउंट में जाता है।',
    'gratuity': '5+ साल बाद नौकरी छोड़ने पर मिलने वाला धन्यवाद भुगतान। लगभग बेसिक का 4.81% प्रति वर्ष।',
    'professional_tax': 'राज्य टैक्स (अधिकतम ₹2,500/साल)। छोटी कटौती, राज्य अनुसार अलग।',
    'performance_bonus': 'अगर आप और कंपनी अच्छा करें तो एक्स्ट्रा पैसा। गारंटी नहीं - रेटिंग पर निर्भर।',
    'joining_bonus': 'जॉइन करते समय एकमुश्त भुगतान। अक्सर "क्लॉबैक" होता है - जल्दी छोड़ने पर वापस करना पड़ता है।',
    'retention_bonus': 'लंबे समय तक रुकने के लिए बोनस। आमतौर पर 1-2 साल बाद मिलता है।',
    'clawback_period': 'वह अवधि जिसमें बोनस वापस करना पड़ता है अगर आप छोड़ दें। जैसे 12 महीने = एक साल के अंदर छोड़ा तो चुकाना पड़ता है।',
    'esop': 'एम्प्लॉई स्टॉक ऑप्शन - बाद में कंपनी के शेयर खरीदने का अधिकार एक ﬁक्स्ड दाम पर। वैल्यू कंपनी की ग्रोथ पर निर्भर।',
    'strike_price': 'वह दाम जो आप प्रति शेयर चुकाते हैं ESOP एक्सरसाइज करते समय। कम होना आपके लिए अच्छा।',
    'vesting_schedule': 'टाइमलाइन जब आपके ESOP आपके होते हैं। आम: 1 साल क्लिफ के बाद 25% प्रति वर्ष।',
    'cliff': 'इंतजार की अवधि जब कोई ESOP नहीं मिलता। आमतौर पर 1 साल - उससे पहले छोड़ा तो कुछ नहीं मिलता।',

    'notice_period': 'इस्तीफा देने के बाद काम करने के दिन। 90 दिन बहुत ज्यादा है - इंडस्ट्री मानक 30-60 है। कम करवाएं!',
    'probation_period': 'ट्रायल पीरियड (आमतौर पर 3-6 महीने)। दोनों तरफ से कम नोटिस पर छोड़ा जा सकता है।',
    'bond_duration': 'रुकने की प्रतिबद्धता (जैसे 2 साल)। जल्दी छोड़ा तो जुर्माना।',
    'bond_penalty': 'बॉन्ड तोड़ने पर देने वाला पैसा। ₹2L बहुत ज्यादा है। वास्तविक ट्रेनिंग खर्च के बराबर होना चाहिए।',
    'non_compete': 'नौकरी छोड़ने के बाद प्रतिस्पर्धी के लिए काम न करने की रोक। बैंगलोर में 50km = पूरा शहर। अक्सर लागू नहीं होता।',
    'moonlighting': 'साइड वर्क/फ्रीलांसिंग पर रोक। पर्सनल टाइम के प्रोजेक्ट्स के लिए ब्लैंकेट बैन सवालिया है।',
    'ip_assignment': 'कंपनी आपके बनाए सब चीजों की मालिक। केवल कंपनी के समय/संसाधन से बने काम के लिए होना चाहिए।',

    'NOTICE_PERIOD_TRAP': '⚠️ 90-दिन का नोटिस आपको फंसा देता है। नौकरी बदलना मुश्किल। 60 दिन मैक्स या बायआउट क्लॉज मांगें।',
    'TRAINING_BOND': '🚨 2 साल के लिए ₹2L बॉन्ड आक्रामक है। प्रो-रेटा कमी और वास्तविक लागत का प्रमाण मांगें।',
    'VARIABLE_PAY_AMBIGUITY': '⚠️ बोनस के नियम अस्पष्ट हैं। लिखित टार्गेट, न्यूनतम गारंटी, और छमाही रिव्यू मांगें।',
    'NON_COMPETE_OVERREACH': '🚨 50km नॉन-कॉम्पीट = पूरा बैंगलोर टेक। 5-10km, 3-6 महीने, गार्डन लीव पे के साथ मांगें।',
    'MOONLIGHTING_BAN': '⚠️ साइड प्रोजेक्ट्स पर पूरी रोक। ओपन सोर्स, पैसिव इन्वेस्टिंग, अनरिलेटेड क्रिएटिव वर्क के लिए छूट मांगें।',
    'JOINING_BONUS_CLAWBACK': '⚠️ 1 साल में छोड़ा तो पूरा ₹1L वापस। प्रो-रेटा (हर महीने 1/12वां कम) मांगें।',
    'IP_ASSIGNMENT_OVERREACH': '⚠️ कंपनी आपके सारे IP की मालिक। केवल कंपनी-बिजनेस से जुड़े काम तक सीमित करें।',
  },
  veteran: {
    'base_salary': 'बेसिक सैलरी (CTC का 40-50%)। PF, ग्रेच्युटी, HRA छूट तय करता है। पूरी तरह टैक्सेबल।',
    'hra': 'HRA छूट = min(वास्तविक HRA, 50% बेसिक [मेट्रो]/40% [नॉन-मेट्रो], किराया - 10% बेसिक)। किराया रसीद चाहिए।',
    'special_allowance': 'पूरी तरह टैक्सेबल बैलेंसिंग कंपोनेंट। कोई छूट नहीं। CTC स्ट्रक्चर एडजस्ट करने के लिए।',
    'pf_employer': 'बेसिक का 12% (₹15,000/माह पर कैप = ₹1,800)। CTC का हिस्सा, इन-हैंड नहीं। EPS हिस्सा (8.33%) पेंशन में।',
    'pf_employee': 'बेसिक का 12% ग्रॉस से कटता है। 80C योग्य। VPF (स्वैच्छिक) बेसिक के 100% तक कर सकते हैं।',
    'gratuity': '15/26 × बेसिक × सेवा वर्ष। 5 साल लगातार सेवा के बाद। ₹20L तक टैक्स-मुक्त।',
    'professional_tax': 'राज्य लेवी (कर्नाटक: ₹200/माह)। सेक्शन 16 के तहत ग्रॉस सैलरी से कटौती योग्य।',
    'performance_bonus': 'वेरिएबल पे कंपोनेंट। स्लैब रेट पर टैक्सेबल। सुनिश्चित करें KPIs SMART और डॉक्यूमेंटेड हों।',
    'joining_bonus': 'साइन-ऑन बोनस। सैलरी के रूप में टैक्सेबल। क्लॉबैक क्लॉज वास्तविक नुकसान का पूर्वानुमान होना चाहिए (सेक्शन 74)।',
    'retention_bonus': 'रिटेंशन बोनस। अक्सर डिफर्ड बोनस के रूप में वेस्टिंग के साथ। प्राप्ति पर टैक्सेबल।',
    'clawback_period': 'चुकौती दायित्व अवधि। प्रति माह सेवा पर प्रो-रेटा कमी मार्केट स्टैंडर्ड है।',
    'esop': 'ESOPs = स्ट्राइक प्राइस पर शेयर खरीदने का अधिकार। दोहरा टैक्स: (1) एक्सरसाइज पर पर्क्विजिट टैक्स (सेक्शन 17(2)), (2) बिक्री पर कैपिटल गेन्स।',
    'strike_price': 'एक्सरसाइज प्राइस। अनलिस्टेड कंपनियों के लिए, अक्सर लास्ट फंडिंग राउंड वैल्यूएशन / 10-20।',
    'vesting_schedule': 'मानक: 4-वर्ष, 25% वार्षिक वेस्टिंग, 1-वर्ष क्लिफ। चेंज ऑफ कंट्रोल पर त्वरित वेस्टिंग (सिंगल/डबल ट्रिगर)।',
    'cliff': 'क्लिफ अवधि। क्लिफ से पहले कोई वेस्टिंग नहीं। 11 महीने में छोड़ा = 0% वेस्टेड।',

    'notice_period': '90 दिन मार्केट मानदंड (30-60) से ज्यादा। जॉब मोबिलिटी प्रभावित। बायआउट (1-2 माह ग्रॉस) या गार्डन लीव नेगोशिएट करें।',
    'probation_period': 'कानूनी अधिकतम अलग-अलग। प्रोबेशन में नोटिस आमतौर पर 15-30 दिन।',
    'bond_duration': 'ट्रेनिंग बॉन्ड केवल लागू करने योग्य अगर: (1) वास्तविक ट्रेनिंग दी गई, (2) राशि वास्तविक पूर्वानुमान, (3) उचित अवधि।',
    'bond_penalty': 'सेक्शन 74 के तहत लिक्विडेटेड डैमेज। कोर्ट अत्यधिक राशि कम करते हैं। आइटमाइज्ड ट्रेनिंग लागत मांगें।',
    'non_compete': 'नौकरी के बाद नॉन-कॉम्पीट सेक्शन 27 के तहत प्रथम दृष्टया शून्य। अपवाद: ट्रेड सीक्रेट सुरक्षा (गोलिकरी मिसाल)।',
    'moonlighting': 'कोई वैधानिक प्रतिबंध नहीं। लागू करने योग्यता निर्भर: हितों का टकराव, IP ओवरलैप, संसाधन दुरुपयोग। कार्व-आउट मानक।',
    'ip_assignment': 'नियोक्ता रोजगार के दौरान बने IP का मालिक (सेक्शन 17 कॉपीराइट एक्ट)। अपने समय/संसाधन से पर्सनल प्रोजेक्ट्स = आपके।',

    'NOTICE_PERIOD_TRAP': '🔴 90-दिन नोटिस = कम बार्गेनिंग पावर। काउंटर: 60 दिन + 30-दिन बायआउट ऑप्शन 1x ग्रॉस पर।',
    'TRAINING_BOND': '🔴 ₹2L/2yr बॉन्ड। मांगें: (1) आइटमाइज्ड ट्रेनिंग लागत, (2) प्रो-रेटा रिकवरी, (3) छंटनी/मेडिकल/रिलोकेशन पर छूट।',
    'VARIABLE_PAY_AMBIGUITY': '🟡 >20% वेरिएबल अनडिफाइंड KPIs के साथ। मांगें: डॉक्यूमेंटेड स्कोरकार्ड, 3.5/5 रेटिंग पर 50% फ्लोर, तिमाही चेक-इन।',
    'NON_COMPETE_OVERREACH': '🔴 50km/12mo = बैंगलोर में डी-फैक्टो इंडस्ट्री बैन। काउंटर: 5km/6mo + 3मो गार्डन लीव 100% पे पर।',
    'MOONLIGHTING_BAN': '🟡 ब्लैंकेट बैन। स्टैंडर्ड कार्व-आउट: OSS (<20घंटे/मो), पैसिव इन्वेस्टिंग (<5%), अनरिलेटेड क्रिएटिव, टीचिंग ≤4घंटे/सप्ताह।',
    'JOINING_BONUS_CLAWBACK': '🔴 टेन्योर बावजूद फुल क्लॉबैक। नेगोशिएट: मासिक प्रो-रेटा, अनैच्छिक एग्जिट पर छूट, केवल प्री-टैक्स रिकवरी।',
    'IP_ASSIGNMENT_OVERREACH': '🟡 ओवरब्रॉड असाइनमेंट। जोड़ें: "कंपनी बिजनेस से संबंधित", "कंपनी संसाधनों का उपयोग", प्री-एक्सिस्टिंग IP शेड्यूल।',
  },
};

/**
 * Set explanation depth
 * @param {'fresher'|'veteran'} depth
 */
function setDepth(depth) {
  if (['fresher', 'veteran'].includes(depth)) {
    currentDepth = depth;
  }
}

/**
 * Set explanation language
 * @param {'en'|'hi'} lang
 */
function setLanguage(lang) {
  if (['en', 'hi'].includes(lang)) {
    currentLanguage = lang;
  }
}

/**
 * Get current settings
 * @returns {object}
 */
function getSettings() {
  return { depth: currentDepth, language: currentLanguage };
}

/**
 * Explain a clause/trap type
 * @param {string} clauseType - Trap type or term key
 * @returns {string} Explanation
 */
function explainClause(clauseType) {
  const dict = currentLanguage === 'hi' ? explanationsHi : explanationsEn;
  const depthDict = dict[currentDepth];

  // Try exact match first
  if (depthDict[clauseType]) {
    return depthDict[clauseType];
  }

  // Try snake_case version
  const snakeKey = clauseType.toLowerCase().replace(/\s+/g, '_');
  if (depthDict[snakeKey]) {
    return depthDict[snakeKey];
  }

  // Fallback generic
  return currentLanguage === 'hi'
    ? `इस क्लॉज (${clauseType}) का विवरण उपलब्ध नहीं है। कृपया HR से स्पष्टीकरण मांगें।`
    : `No detailed explanation available for "${clauseType}". Please ask HR for clarification.`;
}

/**
 * Explain a financial/legal term
 * @param {string} term - Term key (e.g., 'base_salary', 'hra', 'gratuity')
 * @returns {string} Explanation
 */
function explainTerm(term) {
  return explainClause(term);
}

/**
 * Get all available terms for UI dropdown
 * @returns {Array<string>}
 */
function getAvailableTerms() {
  const dict = currentLanguage === 'hi' ? explanationsHi : explanationsEn;
  return Object.keys(dict.fresher);
}

/**
 * Generate explanation for a trap flag object (from trapDetector)
 * @param {object} flag - Trap flag object
 * @returns {object} { title, explanation, recommendation, severity }
 */
function explainFlag(flag) {
  const baseExplanation = explainClause(flag.type);
  const baseRecommendation = currentLanguage === 'hi'
    ? 'HR से इस क्लॉज पर चर्चा करें और लिखित में संशोधन मांगें।'
    : 'Discuss this clause with HR and request written amendments.';

  return {
    title: flag.title,
    severity: flag.severity,
    explanation: baseExplanation,
    recommendation: flag.recommendation || baseRecommendation,
    regulatoryReference: flag.regulatoryReference,
  };
}

/**
 * Batch explain multiple flags
 * @param {Array<object>} flags
 * @returns {Array<object>}
 */
function explainFlags(flags) {
  return flags.map(explainFlag);
}

module.exports = {
  explainClause,
  explainTerm,
  explainFlag,
  explainFlags,
  setDepth,
  setLanguage,
  getSettings,
  getAvailableTerms,
};