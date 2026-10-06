import type { AppView, TransactionCategory } from '../types';
import type { SupportedLanguage } from '../i18n/types';

export const LANGUAGE_LOCALE_MAP: Record<SupportedLanguage, string> = {
  en: 'en-IN',
  te: 'te-IN',
  hi: 'hi-IN',
};

export type VoiceIntentType =
  | 'NAVIGATION'
  | 'TRANSACTION_CREATE'
  | 'BUDGET_QUERY'
  | 'BUDGET_SET'
  | 'READ_SUMMARY'
  | 'ANALYZE_SCAM'
  | 'FINANCIAL_QUESTION'
  | 'CONFIRMATION'
  | 'UNKNOWN';

export type ParsedVoiceIntent =
  | { type: 'NAVIGATION'; view: AppView }
  | {
      type: 'TRANSACTION_CREATE';
      transactionType: 'INCOME' | 'EXPENSE';
      amount: number;
      category: TransactionCategory;
      description: string;
      requiresConfirmation: true;
    }
  | { type: 'BUDGET_QUERY'; category?: TransactionCategory }
  | {
      type: 'BUDGET_SET';
      category: TransactionCategory;
      amount: number;
      requiresConfirmation: true;
    }
  | { type: 'READ_SUMMARY'; target: 'dashboard' | 'scamshield' | 'security' | 'general' }
  | { type: 'ANALYZE_SCAM'; message: string }
  | { type: 'CONFIRMATION'; value: boolean }
  | { type: 'FINANCIAL_QUESTION'; query: string }
  | { type: 'UNKNOWN'; raw: string };

// Helper to extract amounts from numbers or Indian number formatting
export function extractAmount(text: string): number | null {
  // Reject negative numbers explicitly
  if (/(?:^|\s)-[\d,]+(?:\.\d+)?/.test(text.trim())) {
    return null;
  }

  // Matches ₹500, 500 rupees, 1,500, 50000, 500రూ, etc.
  const regex = /(?:₹|rs\.?|rupees|రూపాయలు|రూ\.?|रुपये|रु\.?)?\s*([\d,]+(?:\.\d+)?)\s*(?:₹|rs\.?|rupees|రూపాయలు|రూ\.?|రुपये|रु\.?)?/i;
  const match = text.match(regex);
  if (!match) return null;
  const clean = match[1].replace(/,/g, '');
  const num = parseFloat(clean);
  return isNaN(num) || num <= 0 ? null : num;
}

// Category extraction across EN, TE, HI
export function extractCategory(text: string): TransactionCategory {
  const lower = text.toLowerCase();
  
  if (/(food|dinner|lunch|breakfast|grocery|groceries|swiggy|zomato|restaurant|ఫుడ్|భోజనం|కిరాణా|ఆహారం|తిండి|खाना|राशन|भोजन|रेस्टोरेंट)/i.test(lower)) {
    return 'Food';
  }
  if (/(transport|fuel|petrol|diesel|cab|taxi|uber|ola|bus|train|metro|flight|రవాణా|పెట్రోల్|డీజిల్|క్యాబ్|బస్సు|రైలు|పరివహన్|पेट्रोल|डीजल|टैक्सी|बस|ट्रेन|भाड़ा)/i.test(lower)) {
    return 'Transport';
  }
  if (/(rent|housing|flat|apartment|house|అద్దె|ఇల్లు|గృహం|किराया|मकान|आवास)/i.test(lower)) {
    return 'Housing';
  }
  if (/(utility|utilities|electricity|power|water|wifi|internet|broadband|bill|విద్యుత్|కరెంట్|నీరు|ఇంటర్నెట్|బిల్లు|बिजली|पानी|इंटरनेट|बिल|उपयोगिता)/i.test(lower)) {
    return 'Utilities';
  }
  if (/(health|healthcare|medical|medicine|doctor|hospital|pharmacy|ఆరోగ్యం|మందులు|ఆసుపత్రి|డాక్టర్|स्वास्थ्य|दवा|अस्पताल|डॉक्टर)/i.test(lower)) {
    return 'Healthcare';
  }
  if (/(entertainment|movie|movies|netflix|cinema|game|gaming|వినోదం|సినిమా|చలనచిత్రం|ఆట|मनोरंजन|फिल्म|सिनेमा|खेल)/i.test(lower)) {
    return 'Entertainment';
  }
  if (/(shopping|clothes|dress|amazon|flipkart|mall|షాపింగ్|బట్టలు|వస్త్రాలు|खरीदारी|कपड़े)/i.test(lower)) {
    return 'Shopping';
  }
  if (/(salary|wage|paycheck|stipend|జీతం|వేతనం|वेतन|सैलरी)/i.test(lower)) {
    return 'Salary';
  }
  if (/(freelance|consulting|contract|project|ఫ్రీలాన్స్|కన్సల్టింగ్|फ्रीलांस|परामर्श)/i.test(lower)) {
    return 'Freelance';
  }
  if (/(investment|stock|stocks|mutual fund|crypto|dividend|పెట్టుబడి|స్టాక్స్|షేర్లు|निवेश|शेयर)/i.test(lower)) {
    return 'Investment';
  }
  return 'Other';
}

export function parseVoiceIntent(
  rawTranscript: string,
  language?: SupportedLanguage,
  currentView?: AppView
): ParsedVoiceIntent {
  void language;
  void currentView;
  const text = rawTranscript.trim();
  if (!text) return { type: 'UNKNOWN', raw: '' };

  const lower = text.toLowerCase();

  // 1. Explicit Confirmation (Yes / No)
  if (/^(yes|confirm|add it|proceed|ok|okay|sure|save|అవును|నిర్ధారించు|సరే|జోడించు|చేయి|हाँ|पुष्टि करें|ठीक है|जोड़ो|अवश्य)$/i.test(lower)) {
    return { type: 'CONFIRMATION', value: true };
  }
  if (/^(no|cancel|stop|abort|don't|dont|వద్దు|రద్దు చేయి|ఆపు|కాదు|नहीं|रद्द करो|रोको|मत करो)$/i.test(lower)) {
    return { type: 'CONFIRMATION', value: false };
  }

  // 2. Read Interface / Summary Readout
  if (/(read (my )?(financial )?summary|read this page|read summary|సారాంశం చదువు|ఆర్థిక సారాంశం చదువు|పేజీ చదువు|सारांश पढ़ो|वित्तीय सारांश पढ़ो)/i.test(lower)) {
    return { type: 'READ_SUMMARY', target: 'dashboard' };
  }
  if (/(read (the )?result|read scam result|ఫలితం చదువు|స్కామ్ ఫలితం చదువు|పరిणाम पढ़ो|स्कैम परिणाम पढ़ो)/i.test(lower)) {
    return { type: 'READ_SUMMARY', target: 'scamshield' };
  }
  if (/(read (my )?security status|read security|సెక్యూరిటీ స్టేటస్ చదువు|భద్రతా స్థితి చదువు|सुरक्षा स्थिति पढ़ो)/i.test(lower)) {
    return { type: 'READ_SUMMARY', target: 'security' };
  }

  // 3. ScamShield Voice Analysis
  const scamMatch = text.match(/(?:analyze|check|scan|inspect|విశ్లేషించు|స్కాన్ చేయి|తనిఖీ చేయి|विश्लेषण करो|स्कैन करो|जांचो)\s*(?:this\s*)?(?:message|text|sms|link|url|upi|ఈ మెసేజ్|ఈ సందేశం|इस संदेश|इस मैसेज)?\s*[:\-–]?\s*(.+)/i);
  if (scamMatch && scamMatch[1].trim().length > 5) {
    return { type: 'ANALYZE_SCAM', message: scamMatch[1].trim() };
  }

  // 4. Budget Set / Mutation (Requires Confirmation)
  const isBudgetSet = /(set|update|change|create|పెట్టు|మార్చు|నవీకరించు|సెట్ చేయి|सेट करो|बदलो|अपडेट करो)/i.test(lower) &&
                      /(budget|బడ్జెట్|बजट)/i.test(lower);
  if (isBudgetSet) {
    const amount = extractAmount(text);
    if (amount) {
      const category = extractCategory(text);
      return {
        type: 'BUDGET_SET',
        category,
        amount,
        requiresConfirmation: true,
      };
    }
  }

  // 5. Budget Query (Informational - Safe to answer immediately)
  if (/(what is my|how much is my|how much of my budget|am i over budget|budget status|బడ్జెట్ ఎంత|బడ్జెట్ మిగిలింది|బడ్జెట్ దాటానా|బడ్జెట్ స్థితి|बजट कितना है|बजट बचा है|बजट से बाहर)/i.test(lower) &&
      /(budget|బడ్జెట్|बजट)/i.test(lower)) {
    const category = extractCategory(text);
    return {
      type: 'BUDGET_QUERY',
      category: category === 'Other' ? undefined : category,
    };
  }

  // 6. Transaction Creation (Requires Confirmation)
  const isAddTx = /(add|record|create|spent|paid|bought|received|earned|deposit|ఖర్చు నమోదు|జోడించు|చెల్లించాను|వచ్చింది|ఖర్చు చేశాను|ఖర్చు చేసాను|జమ|जोड़ो|खर्च किया|भुगतान किया|दर्ज करो|कमाया)/i.test(lower);
  const amount = extractAmount(text);

  if (isAddTx && amount) {
    const isIncome = /(income|salary|earned|received|deposit|bonus|ఆదాయం|జీతం|వచ్చింది|జమ|లాభం|आय|वेतन|कमाई|जमा)/i.test(lower);
    const category = extractCategory(text);
    const desc = text.slice(0, 60);

    return {
      type: 'TRANSACTION_CREATE',
      transactionType: isIncome ? 'INCOME' : 'EXPENSE',
      amount,
      category,
      description: desc || `${isIncome ? 'Income' : 'Expense'} (${category})`,
      requiresConfirmation: true,
    };
  }

  // 7. Navigation Commands
  if (/(dashboard|home|డ్యాష్|డాష్|హోమ్|डैशबोर्ड|होम)/i.test(lower)) {
    return { type: 'NAVIGATION', view: 'dashboard' };
  }
  if (/(transactions?|ledger|ట్రాన్సాక్షన్|లావాదేవీ|లెడ్జర్|लेनदेन|ट्रांजैक्शन)/i.test(lower)) {
    return { type: 'NAVIGATION', view: 'transactions' };
  }
  if (/(budgets?|బడ్జెట్|बजट)/i.test(lower)) {
    return { type: 'NAVIGATION', view: 'budgets' };
  }
  if (/(scamshield|scam|fraud|phishing|స్కామ్|మోసం|स्कैम|धोखाधड़ी)/i.test(lower)) {
    return { type: 'NAVIGATION', view: 'scamshield' };
  }
  if (/(security|security center|audit|భద్రతా కేంద్రం|సెక్యూరిటీ|सुरक्षा केंद्र|सुरक्षा)/i.test(lower)) {
    return { type: 'NAVIGATION', view: 'security' };
  }
  if (/(reports?|export|analytics|నివేదిక|రిపోర్ట్|ఎగుమతి|रिपोर्ट|एनालिटिक्स|निर्यात)/i.test(lower)) {
    return { type: 'NAVIGATION', view: 'reports' };
  }
  if (/(profile|account|settings|role|ప్రొఫైల్|ఖాతా|సెట్టింగ్|प्रोफ़ाइल|खाता|सेटिंग)/i.test(lower)) {
    return { type: 'NAVIGATION', view: 'profile' };
  }
  if (/(ai assistant|assistant|bot|సహాయకుడు|सहायक)/i.test(lower)) {
    return { type: 'NAVIGATION', view: 'ai-assistant' };
  }

  // 8. Natural Financial Question or Fallback (routed to user-scoped AI Assistant)
  return {
    type: 'FINANCIAL_QUESTION',
    query: text,
  };
}
