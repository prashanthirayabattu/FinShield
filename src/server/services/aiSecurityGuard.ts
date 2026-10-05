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

export const aiSecurityGuard = {
  /**
   * Inspects incoming user messages for prompt-injection, secret extraction, or adversarial attacks.
   */
  inspectMessage(message: string): SecurityInspectionResult {
    const trimmed = message.trim();

    // 1. Secret / Credential Extraction Attempts
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          isBlocked: true,
          violationType: 'SECRET_EXTRACTION',
          refusalMessage:
            'Security Policy Notice: Requests attempting to inspect environment variables, API secrets, database credentials, or system tokens are strictly blocked.',
        };
      }
    }

    // 2. Cross-User Data / Isolation Override Attempts
    for (const pattern of CROSS_USER_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          isBlocked: true,
          violationType: 'CROSS_USER_ATTEMPT',
          refusalMessage:
            'Tenant Isolation Notice: FinShield enforces strict cryptographic per-user boundary isolation. Requests to access other users or elevate administrative privileges are strictly blocked.',
        };
      }
    }

    // 3. Prompt-Injection / Instruction Override Attempts
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          isBlocked: true,
          violationType: 'PROMPT_INJECTION',
          refusalMessage:
            'Adversarial Prompt Notice: FinShield AI Assistant operates strictly within authorized financial boundary instructions. System prompt overrides and instruction resets are rejected.',
        };
      }
    }

    // 4. SQL Injection in Message
    for (const pattern of SQL_INJECTION_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          isBlocked: true,
          violationType: 'SQL_INJECTION',
          refusalMessage:
            'Input Validation Notice: Raw SQL injection fragments and destructive database commands are strictly prohibited by the application gateway.',
        };
      }
    }

    return { isBlocked: false };
  },
};
