/**
 * i18n.js — all UI strings for the Home module.
 * Supports English (en) and Hindi (hi).
 * Supports Fresher and Veteran depth levels.
 */

export const strings = {
  en: {
    // Page title
    pageTitle: 'Home — Financial Adviser Buddy',

    // Welcome
    welcomeBack: 'Welcome back',
    memberSince: 'Member since',

    // Overview section
    overviewTitle: 'Financial Overview',
    overviewEmpty: 'No financial data available yet.',
    overviewEmptyHint: 'Upload a document to get started.',
    documentsUploaded: 'Documents uploaded',
    offerLetters: 'Offer letters',
    payslips: 'Payslips',

    // Next steps
    nextStepsTitle: 'Recommended Next Steps',
    nextStepsEmpty: 'No recommendations available.',

    // Timeline
    timelineTitle: 'Activity Timeline',
    timelineEmpty: 'No activity yet.',
    timelineEmptyHint: 'Your document uploads and analyses will appear here.',

    // Recent activity
    activityTitle: 'Recent Activity',
    activityEmpty: 'No recent activity.',
    activityEmptyHint: 'Your recent uploads and actions will appear here.',

    // Market Movers
    marketMoversTitle: 'Market Movers',
    marketDisclaimerBadge: 'Educational only · Not advice',
    marketUnavailable: 'Live market data is not currently available.',
    marketDemoLabel: 'Demo data — not live prices',
    marketDisclaimer:
      'This is not real-time data. Fin-Buddy is not SEBI-registered. ' +
      'This section is for educational awareness only — not investment advice.',

    // States
    loading: 'Loading…',
    retry: 'Retry',
    error: 'Something went wrong.',
    errorHint: 'Please refresh the page or try again.',

    // Depth labels (Fresher)
    fresher: {
      overviewHint: 'This shows a summary of the documents you have uploaded.',
      marketHint: 'These numbers show how some Indian stocks moved today. For awareness only — do not invest based on this.',
    },
    // Depth labels (Veteran)
    veteran: {
      overviewHint: 'Dashboard aggregates document metadata from the report store. Financial metrics are computed by the Documents and Salary & Tax modules.',
      marketHint: 'Indicative price movement data. SEBI-compliant disclaimer: for educational reference only.',
    },
  },
  hi: {
    pageTitle: 'होम — Financial Adviser Buddy',

    welcomeBack: 'वापस स्वागत है',
    memberSince: 'सदस्य बने',

    overviewTitle: 'वित्तीय अवलोकन',
    overviewEmpty: 'अभी तक कोई वित्तीय डेटा उपलब्ध नहीं है।',
    overviewEmptyHint: 'शुरू करने के लिए एक दस्तावेज़ अपलोड करें।',
    documentsUploaded: 'अपलोड किए गए दस्तावेज़',
    offerLetters: 'ऑफर लेटर',
    payslips: 'पे-स्लिप',

    nextStepsTitle: 'अनुशंसित अगले कदम',
    nextStepsEmpty: 'कोई अनुशंसा उपलब्ध नहीं।',

    timelineTitle: 'गतिविधि टाइमलाइन',
    timelineEmpty: 'अभी तक कोई गतिविधि नहीं।',
    timelineEmptyHint: 'आपके दस्तावेज़ अपलोड और विश्लेषण यहाँ दिखेंगे।',

    activityTitle: 'हालिया गतिविधि',
    activityEmpty: 'कोई हालिया गतिविधि नहीं।',
    activityEmptyHint: 'आपकी हालिया गतिविधियाँ यहाँ दिखेंगी।',

    marketMoversTitle: 'बाज़ार के टॉप मूवर्स',
    marketDisclaimerBadge: 'केवल शैक्षिक · निवेश सलाह नहीं',
    marketUnavailable: 'लाइव बाज़ार डेटा अभी उपलब्ध नहीं है।',
    marketDemoLabel: 'डेमो डेटा — लाइव कीमतें नहीं',
    marketDisclaimer:
      'यह रियल-टाइम डेटा नहीं है। Fin-Buddy SEBI-पंजीकृत नहीं है। ' +
      'यह अनुभाग केवल शैक्षिक जागरूकता के लिए है — निवेश सलाह नहीं।',

    loading: 'लोड हो रहा है…',
    retry: 'पुनः प्रयास करें',
    error: 'कुछ गलत हुआ।',
    errorHint: 'कृपया पृष्ठ रिफ्रेश करें या पुनः प्रयास करें।',

    fresher: {
      overviewHint: 'यहाँ आपके अपलोड किए गए दस्तावेज़ों का सारांश दिखाया गया है।',
      marketHint: 'ये संख्याएँ कुछ भारतीय शेयरों की आज की हलचल दिखाती हैं। केवल जानकारी के लिए — इस पर निवेश न करें।',
    },
    veteran: {
      overviewHint: 'डैशबोर्ड रिपोर्ट स्टोर से दस्तावेज़ मेटाडेटा एकत्रित करता है। वित्तीय मेट्रिक्स Documents और Salary & Tax मॉड्यूल द्वारा गणना किए जाते हैं।',
      marketHint: 'सांकेतिक मूल्य आंदोलन डेटा। SEBI अनुपालन अस्वीकरण: केवल शैक्षिक संदर्भ के लिए।',
    },
  },
};

/** Convenience hook-style getter */
export function t(lang = 'en', key) {
  return strings[lang]?.[key] ?? strings.en[key] ?? key;
}
