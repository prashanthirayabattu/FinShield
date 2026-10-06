export interface SecurityInspectionResult {
  isBlocked: boolean;
  violationType?: 'PROMPT_INJECTION' | 'SECRET_EXTRACTION' | 'CROSS_USER_ATTEMPT' | 'SQL_INJECTION';
  refusalMessage?: string;
}

const INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+)?previous\s+instructions/i,
  /system\s+prompt/i,
  /reveal\s+(?:your\s+)?(?:system\s+)?prompt/i,
  /print\s+(?:your\s+)?prompt/i,
  /what\s+is\s+your\s+instructions/i,
  /disregard\s+(?:all\s+)?rules/i,
  /you\s+are\s+now\s+in\s+dan\s+mode/i,
  /jailbreak/i,
];

const SECRET_PATTERNS = [
  /(?:api[_\s-]?key|gemini[_\s-]?key|openai[_\s-]?key)/i,
  /(?:jwt[_\s-]?secret|database[_\s-]?url|postgres[_\s-]?password)/i,
  /(?:reveal|show|print|leak)\s+(?:the\s+)?(?:secret|password|credential|token|key|env)/i,
];

const CROSS_USER_PATTERNS = [
  /(?:show|give|fetch|list|display)\s+(?:all\s+)?users/i,
  /(?:other|another)\s+user(?:'s)?/i,
  /user[_\s-]?b/i,
  /user\s+(?:id|account)\s+of/i,
  /override\s+isolation/i,
  /switch\s+(?:to\s+)?user/i,
  /admin\s+privilege/i,
  /as\s+(?:an?\s+)?admin/i,
];

const SQL_INJECTION_PATTERNS = [
  /union\s+select/i,
  /select\s+\*\s+from/i,
  /drop\s+table/i,
  /insert\s+into/i,
  /--\s*$/m,
  /;\s*drop\s+/i,
  /'\s*or\s*'1'\s*=\s*'1'/i,
];

const REFUSAL_MESSAGES = {
  SECRET_EXTRACTION: {
    en: 'Security Policy Notice: Requests attempting to inspect environment variables, API secrets, database credentials, or system tokens are strictly blocked.',
    te: 'భద్రతా విధాన నోటీసు: పర్యావరణ వేరియబుల్స్, API రహస్యాలు, డేటాబేస్ ఆధారాలు లేదా సిస్టమ్ టోకెన్‌లను తనిఖీ చేసే అభ్యర్థనలు ఖచ్చితంగా నిరోధించబడతాయి.',
    hi: 'सुरक्षा नीति सूचना: पर्यावरण चर, API गोपनीयता, डेटाबेस साख या सिस्टम टोकन का निरीक्षण करने का प्रयास करने वाले अनुरोधों को पूरी तरह से अवरुद्ध किया गया है।',
  },
  CROSS_USER_ATTEMPT: {
    en: 'Tenant Isolation Notice: FinShield enforces strict cryptographic per-user boundary isolation. Requests to access other users or elevate administrative privileges are strictly blocked.',
    te: 'టెనెంట్ ఐసోలేషన్ నోటీసు: ఫిన్‌షీల్డ్ ప్రతి వినియోగదారునికి కఠినమైన క్రిప్టోగ్రాఫిక్ సరిహద్దు ఐసోలేషన్‌ను అమలు చేస్తుంది. ఇతర వినియోగదారుల డేటాను యాక్సెస్ చేయడానికి లేదా అధికారాలను పెంచడానికి చేసే అభ్యర్థనలు నిరోధించబడతాయి.',
    hi: 'किरायेदार अलगाव सूचना: फ़िनशील्ड सख्त क्रिप्टोग्राफ़िक प्रति-उपयोगकर्ता सीमा अलगाव लागू करता है। अन्य उपयोगकर्ताओं के डेटा तक पहुँचने या विशेषाधिकार बढ़ाने के अनुरोध अवरुद्ध हैं।',
  },
  PROMPT_INJECTION: {
    en: 'Adversarial Prompt Notice: FinShield AI Assistant operates strictly within authorized financial boundary instructions. System prompt overrides and instruction resets are rejected.',
    te: 'ప్రతికూల ప్రాంప్ట్ నోటీసు: ఫిన్‌షీల్డ్ AI సహాయకుడు అధీకృత ఆర్థిక సరిహద్దు సూచనలలో మాత్రమే పనిచేస్తుంది. సిస్టమ్ ప్రాంప్ట్ ఓవర్‌రైడ్‌లు మరియు సూచనల రీసెట్‌లు తిరస్కరించబడ్డాయి.',
    hi: 'प्रतिकूल प्रॉम्प्ट सूचना: फ़िनशील्ड एआई सहायक केवल अधिकृत वित्तीय सीमा निर्देशों के तहत काम करता है। सिस्टम प्रॉम्प्ट ओवरराइड और निर्देश रीसेट अस्वीकार किए जाते हैं।',
  },
  SQL_INJECTION: {
    en: 'Input Validation Notice: Raw SQL injection fragments and destructive database commands are strictly prohibited by the application gateway.',
    te: 'ఇన్‌పుట్ ధ్రువీకరణ నోటీసు: రా SQL ఇంజెక్షన్ భాగాలు మరియు వినాశకరమైన డేటాబేస్ ఆదేశాలు అప్లికేషన్ గేట్‌వే ద్వారా ఖచ్చితంగా నిషేధించబడ్డాయి.',
    hi: 'इनपुट सत्यापन सूचना: कच्चे एसक्यूएल इंजेक्शन टुकड़े और विनाशकारी डेटाबेस कमांड एप्लिकेशन गेटवे द्वारा पूरी तरह से निषिद्ध हैं।',
  },
};

export const aiSecurityGuard = {
  /**
   * Inspects incoming user messages for prompt-injection, secret extraction, or adversarial attacks.
   */
  inspectMessage(message: string, language: 'en' | 'te' | 'hi' = 'en'): SecurityInspectionResult {
    const trimmed = message.trim();
    const lang = (language === 'te' || language === 'hi') ? language : 'en';

    // 1. Secret / Credential Extraction Attempts
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          isBlocked: true,
          violationType: 'SECRET_EXTRACTION',
          refusalMessage: REFUSAL_MESSAGES.SECRET_EXTRACTION[lang],
        };
      }
    }

    // 2. Cross-User Data / Isolation Override Attempts
    for (const pattern of CROSS_USER_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          isBlocked: true,
          violationType: 'CROSS_USER_ATTEMPT',
          refusalMessage: REFUSAL_MESSAGES.CROSS_USER_ATTEMPT[lang],
        };
      }
    }

    // 3. Prompt-Injection / Instruction Override Attempts
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          isBlocked: true,
          violationType: 'PROMPT_INJECTION',
          refusalMessage: REFUSAL_MESSAGES.PROMPT_INJECTION[lang],
        };
      }
    }

    // 4. SQL Injection in Message
    for (const pattern of SQL_INJECTION_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          isBlocked: true,
          violationType: 'SQL_INJECTION',
          refusalMessage: REFUSAL_MESSAGES.SQL_INJECTION[lang],
        };
      }
    }

    return { isBlocked: false };
  },
};
