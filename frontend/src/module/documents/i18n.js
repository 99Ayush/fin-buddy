/**
 * Documents Module - Frontend i18n (i18n.js)
 * Localized strings for English + Hindi, Fresher + Veteran depths
 */

const strings = {
  en: {
    fresher: {
      // Page titles
      pageTitle: 'Documents',
      pageDescription: 'Upload, extract, and analyze your offer letters, payslips, and agreements',

      // Tabs
      tabUpload: 'Upload',
      tabMaskPreview: 'Mask Preview',
      tabReview: 'Review & Edit',
      tabClauses: 'Clauses & Traps',

      // Upload tab
      uploadTitle: 'Upload Your Document',
      uploadSubtitle: 'Drag & drop or click to browse • PDF, PNG, JPG • Max 5MB',
      uploadButton: 'Upload & Analyze',
      supportedTypes: 'Supported: Offer Letters, Payslips, Form 16, Loan Agreements',

      // Mask preview tab
      maskTitle: 'Privacy Shield Active',
      maskSubtitle: 'Your sensitive data has been detected and masked locally. No PAN, Aadhaar, phone numbers, or names leave your browser unredacted.',
      maskConfirmButton: 'I confirm my private data is masked — Proceed to AI Analysis',
      piiDetected: 'PII Detected & Masked',
      piiTypes: {
        PAN: 'PAN Numbers',
        AADHAAR: 'Aadhaar Numbers',
        PHONE: 'Phone Numbers',
        EMAIL: 'Email Addresses',
        BANK_ACCOUNT: 'Bank Accounts',
        NAME: 'Names',
      },

      // Review tab
      reviewTitle: 'Review Extracted Data',
      reviewSubtitle: 'Verify each field. Confidence badges indicate extraction reliability. Edit any incorrect values before saving.',
      confidenceHigh: 'High confidence',
      confidenceMedium: 'Medium confidence',
      confidenceLow: 'Low confidence - please verify',
      saveButton: 'Save to Reports',
      nextButton: 'View Clauses →',

      // Clause viewer tab
      clauseTitle: 'Clause Traps & Risks',
      clauseSubtitle: 'flagged clause(s) found. Click to see details and recommendations.',
      severityCritical: 'CRITICAL',
      severityHigh: 'HIGH',
      severityMedium: 'MEDIUM',
      severityLow: 'LOW',
      severityInfo: 'INFO',
      whatThisMeans: 'What this means',
      whatToAskHR: 'What to ask HR',
      regulatoryRef: 'Legal Reference',

      // Common
      disclaimer: 'Educational financial clarity only. Not financial or legal advice. Your data is processed locally with PII redaction before any AI analysis.',
      extracting: 'Extracting...',
      processing: 'Processing...',
      error: 'Something went wrong',
      retry: 'Try again',
    },
    veteran: {
      pageTitle: 'Documents',
      pageDescription: 'Upload, extract, and analyze your offer letters, payslips, and agreements',

      tabUpload: 'Upload',
      tabMaskPreview: 'Mask Preview',
      tabReview: 'Review & Edit',
      tabClauses: 'Clauses & Traps',

      uploadTitle: 'Upload Document',
      uploadSubtitle: 'Drag & drop or click to browse • PDF, PNG, JPG • Max 5MB',
      uploadButton: 'Upload & Analyze',
      supportedTypes: 'Supported: Offer Letters, Payslips, Form 16, Loan Agreements',

      maskTitle: 'PII Redaction Complete',
      maskSubtitle: 'Sensitive identifiers (PAN, Aadhaar, phone, email, bank accounts, names) have been locally redacted. Review masked preview before authorizing LLM extraction.',
      maskConfirmButton: 'Confirm redaction — Proceed to structured extraction',
      piiDetected: 'Redacted PII Entities',
      piiTypes: {
        PAN: 'PAN',
        AADHAAR: 'Aadhaar',
        PHONE: 'Mobile',
        EMAIL: 'Email',
        BANK_ACCOUNT: 'Bank A/c',
        NAME: 'Names',
      },

      reviewTitle: 'Validate Extraction',
      reviewSubtitle: 'Review field-level extractions with confidence scores. Correct any OCR/LLM errors before committing to report store.',
      confidenceHigh: '≥90%',
      confidenceMedium: '70-89%',
      confidenceLow: '<70% — manual review required',
      saveButton: 'Commit to Report Store',
      nextButton: 'View Trap Analysis →',

      clauseTitle: 'Trap Classification Results',
      clauseSubtitle: 'predatory clauses detected with severity grading and regulatory references.',
      severityCritical: 'CRITICAL',
      severityHigh: 'HIGH',
      severityMedium: 'MEDIUM',
      severityLow: 'LOW',
      severityInfo: 'INFO',
      whatThisMeans: 'Implication',
      whatToAskHR: 'Negotiation Ask',
      regulatoryRef: 'Statutory Basis',

      disclaimer: 'Educational financial clarity only. Not financial or legal advice. Local PII redaction enforced pre-LLM.',
      extracting: 'Running structured extraction...',
      processing: 'Processing pipeline...',
      error: 'Extraction failed',
      retry: 'Retry',
    },
  },
  hi: {
    fresher: {
      pageTitle: 'दस्तावेज़',
      pageDescription: 'अपने ऑफर लेटर, पेस्लिप और एग्रीमेंट अपलोड करें, निकालें और विश्लेषण करें',

      tabUpload: 'अपलोड',
      tabMaskPreview: 'मास्क पूर्वावलोकन',
      tabReview: 'समीक्षा और संपादन',
      tabClauses: 'धाराएं और जाल',

      uploadTitle: 'अपना दस्तावेज़ अपलोड करें',
      uploadSubtitle: 'ड्रैग और ड्रॉप करें या ब्राउज़ करने के लिए क्लिक करें • PDF, PNG, JPG • अधिकतम 5MB',
      uploadButton: 'अपलोड और विश्लेषण करें',
      supportedTypes: 'समर्थित: ऑफर लेटर, पेस्लिप, फॉर्म 16, लोन एग्रीमेंट',

      maskTitle: 'गोपनीयता शील्ड सक्रिय',
      maskSubtitle: 'आपका संवेदनशील डेटा स्थानीय स्तर पर पता लगाया गया और मास्क किया गया। कोई PAN, आधार, फोन नंबर या नाम आपके ब्राउज़र से अनरिडैक्टेड नहीं छोड़ते।',
      maskConfirmButton: 'मैं पुष्टि करता हूँ कि मेरा निजी डेटा मास्क है — AI विश्लेषण के लिए आगे बढ़ें',
      piiDetected: 'PII पता लगाया गया और मास्क किया गया',
      piiTypes: {
        PAN: 'PAN नंबर',
        AADHAAR: 'आधार नंबर',
        PHONE: 'फोन नंबर',
        EMAIL: 'ईमेल पते',
        BANK_ACCOUNT: 'बैंक खाते',
        NAME: 'नाम',
      },

      reviewTitle: 'निकाले गए डेटा की समीक्षा करें',
      reviewSubtitle: 'हर फील्ड वेरिफाई करें। कॉन्फिडेंस बैज एक्सट्रैक्शन विश्वसनीयता दिखाते हैं। सेव करने से पहले गलत वैल्यू एडिट करें।',
      confidenceHigh: 'उच्च आत्मविश्वास',
      confidenceMedium: 'मध्यम आत्मविश्वास',
      confidenceLow: 'कम आत्मविश्वास - कृपया वेरिफाई करें',
      saveButton: 'रिपोर्ट्स में सेव करें',
      nextButton: 'धाराएं देखें →',

      clauseTitle: 'धारा जाल और जोखिम',
      clauseSubtitle: 'फ्लैग की गई धाराएं मिलीं। विवरण और सिफारिशों के लिए क्लिक करें।',
      severityCritical: 'गंभीर',
      severityHigh: 'उच्च',
      severityMedium: 'मध्यम',
      severityLow: 'कम',
      severityInfo: 'जानकारी',
      whatThisMeans: 'इसका मतलब',
      whatToAskHR: 'HR से क्या पूछें',
      regulatoryRef: 'कानूनी संदर्भ',

      disclaimer: 'केवल शैक्षिक वित्तीय स्पष्टता। वित्तीय या कानूनी सलाह नहीं। आपका डेटा स्थानीय रूप से PII रिडैक्शन के साथ संसाधित होता है किसी भी AI विश्लेषण से पहले।',
      extracting: 'निकाल रहे हैं...',
      processing: 'प्रसंस्करण...',
      error: 'कुछ गलत हुआ',
      retry: 'फिर से कोशिश करें',
    },
    veteran: {
      pageTitle: 'दस्तावेज़',
      pageDescription: 'अपने ऑफर लेटर, पेस्लिप और एग्रीमेंट अपलोड करें, निकालें और विश्लेषण करें',

      tabUpload: 'अपलोड',
      tabMaskPreview: 'मास्क पूर्वावलोकन',
      tabReview: 'समीक्षा और संपादन',
      tabClauses: 'धाराएं और जाल',

      uploadTitle: 'दस्तावेज़ अपलोड',
      uploadSubtitle: 'ड्रैग और ड्रॉप या क्लिक करके ब्राउज़ करें • PDF, PNG, JPG • अधिकतम 5MB',
      uploadButton: 'अपलोड और विश्लेषण',
      supportedTypes: 'समर्थित: ऑफर लेटर, पेस्लिप, फॉर्म 16, लोन एग्रीमेंट',

      maskTitle: 'PII रिडैक्शन पूर्ण',
      maskSubtitle: 'संवेदनशील पहचानकर्ता (PAN, आधार, फोन, ईमेल, बैंक खाते, नाम) स्थानीय रूप से रिडैक्ट किए गए। LLM निष्कर्षण अधिकृत करने से पहले मास्क पूर्वावलोकन की समीक्षा करें।',
      maskConfirmButton: 'रिडैक्शन की पुष्टि करें — संरचित निष्कर्षण के लिए आगे बढ़ें',
      piiDetected: 'रिडैक्ट की गई PII संस्थाएं',
      piiTypes: {
        PAN: 'PAN',
        AADHAAR: 'आधार',
        PHONE: 'मोबाइल',
        EMAIL: 'ईमेल',
        BANK_ACCOUNT: 'बैंक खाता',
        NAME: 'नाम',
      },

      reviewTitle: 'निष्कर्षण मान्य करें',
      reviewSubtitle: 'कॉन्फिडेंस स्कोर के साथ फील्ड-लेवल एक्सट्रैक्शन की समीक्षा करें। रिपोर्ट स्टोर में कमिट करने से पहले OCR/LLM त्रुटियां ठीक करें।',
      confidenceHigh: '≥90%',
      confidenceMedium: '70-89%',
      confidenceLow: '<70% — मैनुअल समीक्षा आवश्यक',
      saveButton: 'रिपोर्ट स्टोर में कमिट करें',
      nextButton: 'ट्रैप विश्लेषण देखें →',

      clauseTitle: 'ट्रैप वर्गीकरण परिणाम',
      clauseSubtitle: 'गंभीरता ग्रेडिंग और वैधानिक संदर्भों के साथ शिकारी धाराओं का पता लगाया गया।',
      severityCritical: 'गंभीर',
      severityHigh: 'उच्च',
      severityMedium: 'मध्यम',
      severityLow: 'कम',
      severityInfo: 'जानकारी',
      whatThisMeans: 'निहितार्थ',
      whatToAskHR: 'बातचीत की मांग',
      regulatoryRef: 'वैधानिक आधार',

      disclaimer: 'केवल शैक्षिक वित्तीय स्पष्टता। वित्तीय या कानूनी सलाह नहीं। LLM से पहले स्थानीय PII रिडैक्शन लागू।',
      extracting: 'संरचित निष्कर्षण चल रहा है...',
      processing: 'पाइपलाइन प्रसंस्करण...',
      error: 'निष्कर्षण विफल',
      retry: 'पुनः प्रयास',
    },
  },
};

/**
 * Get localized string
 * @param {string} key - Dot-notation key (e.g., 'tabUpload')
 * @param {string} language - 'en' or 'hi'
 * @param {string} depth - 'fresher' or 'veteran'
 * @returns {string}
 */
export function t(key, language = 'en', depth = 'fresher') {
  const langStrings = strings[language]?.[depth] || strings.en.fresher;
  return langStrings[key] || key;
}

/**
 * Get all strings for a language/depth combo
 * @param {string} language
 * @param {string} depth
 * @returns {object}
 */
export function getAllStrings(language = 'en', depth = 'fresher') {
  return strings[language]?.[depth] || strings.en.fresher;
}

/**
 * Get available languages
 * @returns {Array<string>}
 */
export function getLanguages() {
  return Object.keys(strings);
}

/**
 * Get available depths
 * @returns {Array<string>}
 */
export function getDepths() {
  return ['fresher', 'veteran'];
}

export default {
  t,
  getAllStrings,
  getLanguages,
  getDepths,
  strings,
};