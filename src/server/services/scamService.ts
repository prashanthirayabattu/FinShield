import { prisma } from '../db/prisma';
import { AnalyzeScamInput } from '../schemas/scamSchemas';

export interface ScamAnalysisResult {
  analysisId: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskScore: number;
  category: string;
  sourceType: 'TEXT' | 'URL' | 'UPI' | 'COMBINED';
  reasons: string[];
  recommendations: string[];
  extractedUpiId: string | null;
  extractedAmount: number | null;
  extractedUrls: string[];
  matchedTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    category: string;
    payee: string | null;
    description: string | null;
    transactionDate: string;
  }>;
  analyzedAt: string;
}

// Suspicious URL top-level domains commonly used in phishing campaigns
const HIGH_RISK_TLDS = [
  '.xyz',
  '.top',
  '.tk',
  '.ml',
  '.ga',
  '.cf',
  '.gq',
  '.buzz',
  '.club',
  '.work',
  '.click',
  '.icu',
  '.link',
  '.rest',
  '.cam',
  '.biz',
  '.info',
  '.surf',
  '.monster',
  '.lat',
  '.cyou',
];

// Common URL shorteners masking original endpoints
const URL_SHORTENERS = [
  'bit.ly',
  'tinyurl.com',
  't.co',
  'is.gd',
  'buff.ly',
  'ow.ly',
  'cutt.ly',
  'rb.gy',
  'rebrand.ly',
  'shorturl.at',
];

// Legitimate domains for financial brands in India
const LEGITIMATE_FINANCIAL_DOMAINS = [
  'onlinesbi.sbi',
  'sbi.co.in',
  'hdfcbank.com',
  'icicibank.com',
  'axisbank.com',
  'kotak.com',
  'paytm.com',
  'phonepe.com',
  'google.com',
  'gpay.app',
  'rbi.org.in',
  'npci.org.in',
  'incometax.gov.in',
  'uidai.gov.in',
];

// Brand names frequently impersonated by scammers
const BRAND_KEYWORDS = [
  'sbi',
  'hdfc',
  'icici',
  'axis',
  'paytm',
  'phonepe',
  'gpay',
  'googlepay',
  'rbi',
  'kotak',
  'pnb',
  'bob',
  'yono',
  'uidai',
  'aadhaar',
  'income-tax',
];

// Standard non-UPI email providers to avoid false-positive UPI matching from text
const EMAIL_PROVIDERS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'proton.me',
  'protonmail.com',
  'mail.com',
  'zoho.com',
  'finshield.local',
];

export class ScamService {
  /**
   * SSRF-safe URL lexical inspection:
   * Parses URL syntax without executing ANY external HTTP requests.
   */
  public analyzeUrlLexical(rawUrl: string): {
    score: number;
    reasons: string[];
    isPhishingDomain: boolean;
  } {
    let score = 0;
    const reasons: string[] = [];
    let isPhishingDomain = false;

    try {
      const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
      const hostname = parsed.hostname.toLowerCase();
      const protocol = parsed.protocol;

      // 1. Insecure protocol
      if (protocol === 'http:') {
        score += 15;
        reasons.push('Insecure unencrypted HTTP protocol (legitimate banking/payment services always use HTTPS)');
      }

      // 2. IP literal host (e.g. http://192.168.1.1 or http://45.33.32.156)
      const isIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
      const isIpv6 = hostname.startsWith('[') && hostname.endsWith(']');
      if (isIpv4 || isIpv6) {
        score += 40;
        isPhishingDomain = true;
        reasons.push(`Direct numerical IP address hostname (${hostname}) used instead of a registered domain`);
      }

      // 3. High-risk TLD
      const matchedTld = HIGH_RISK_TLDS.find((tld) => hostname.endsWith(tld));
      if (matchedTld) {
        score += 30;
        reasons.push(`Uses high-risk top-level domain (${matchedTld}) frequently linked to disposable phishing sites`);
      }

      // 4. URL shortener masking target
      const isShortener = URL_SHORTENERS.some((short) => hostname === short || hostname.endsWith(`.${short}`));
      if (isShortener) {
        score += 25;
        reasons.push(`Obfuscated URL shortener (${hostname}) hiding true payment or web destination`);
      }

      // 5. Brand Spoofing / Impersonation in domain
      const isLegitimate = LEGITIMATE_FINANCIAL_DOMAINS.some(
        (legit) => hostname === legit || hostname.endsWith(`.${legit}`)
      );
      if (!isLegitimate) {
        for (const brand of BRAND_KEYWORDS) {
          if (hostname.includes(brand)) {
            score += 45;
            isPhishingDomain = true;
            reasons.push(`Suspicious brand imitation: domain contains '${brand}' but is not an authorized domain`);
            break;
          }
        }

        // Suspicious keywords in subdomains/paths
        const suspiciousWords = ['kyc', 'verify', 'update', 'login', 'security', 'refund', 'reward', 'portal'];
        for (const word of suspiciousWords) {
          if (hostname.includes(word) && !reasons.some((r) => r.includes(word))) {
            score += 20;
            reasons.push(`Domain contains credential lure keyword '${word}'`);
            break;
          }
        }
      }

      // 6. Excessive subdomains or hyphenation (e.g. sbi-secure-update-account.xyz)
      const hyphenCount = (hostname.match(/-/g) || []).length;
      if (hyphenCount >= 2) {
        score += 15;
        reasons.push('Excessive hyphens in hostname indicative of deceptive typosquatting');
      }
    } catch {
      score += 20;
      reasons.push('Malformed URL structure violating RFC standards');
    }

    return { score, reasons, isPhishingDomain };
  }

  /**
   * Extracts UPI ID from text or explicit upiId input.
   */
  public extractUpiId(text?: string, upiId?: string): string | null {
    if (upiId && upiId.trim().length > 0) {
      return upiId.trim().toLowerCase();
    }
    if (!text) return null;

    const upiRegex = /[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/g;
    const matches = text.match(upiRegex);
    if (!matches) return null;

    for (const match of matches) {
      const lower = match.toLowerCase();
      const domain = lower.split('@')[1];
      if (!EMAIL_PROVIDERS.includes(domain)) {
        return lower;
      }
    }

    return null;
  }

  /**
   * Extracts URLs from input text or explicit url input.
   */
  public extractUrls(text?: string, url?: string): string[] {
    const urls: Set<string> = new Set();
    if (url && url.trim().length > 0) {
      urls.add(url.trim());
    }
    if (text) {
      const urlRegex = /(https?:\/\/[^\s<>"'{}|\\^`]+)/gi;
      const matches = text.match(urlRegex);
      if (matches) {
        matches.forEach((u) => urls.add(u.trim()));
      }
    }
    return Array.from(urls);
  }

  /**
   * Extracts monetary amounts from text.
   */
  public extractAmount(text?: string): number | null {
    if (!text) return null;

    // Pattern 1: Symbol prefix e.g. ₹ 2,000, Rs. 500, INR 10000
    const symbolRegex = /(?:₹|Rs\.?|INR)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i;
    const match1 = text.match(symbolRegex);
    if (match1 && match1[1]) {
      const num = parseFloat(match1[1].replace(/,/g, ''));
      if (!isNaN(num) && num > 0) return num;
    }

    // Pattern 2: Action verbs followed by number e.g. "pay 5000", "transfer 2500", "received 1500"
    const verbRegex = /(?:pay|paid|transfer|send|sent|credited|debited|amount of|win|won)\s+(?:₹|Rs\.?|INR)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i;
    const match2 = text.match(verbRegex);
    if (match2 && match2[1]) {
      const num = parseFloat(match2[1].replace(/,/g, ''));
      if (!isNaN(num) && num > 0) return num;
    }

    return null;
  }

  /**
   * Evaluates text message content against known fraud patterns.
   */
  public evaluateTextHeuristics(text: string): {
    score: number;
    reasons: string[];
    category: string | null;
  } {
    let score = 0;
    const reasons: string[] = [];
    const matchedCategories: string[] = [];
    const lower = text.toLowerCase();

    // 1. KYC Urgency & Account Suspension
    const kycRegex = /(kyc|pan\s*card|aadhaar|bank\s*account).*(expire|block|suspend|deactivat|hold|update|verify|immediate)/i;
    const urgentActionRegex = /(within\s*(?:24|12|2|1)\s*hours?|immediately|urgent|today\s*itself|last\s*warning)/i;
    if (kycRegex.test(lower) && urgentActionRegex.test(lower)) {
      score += 55;
      matchedCategories.push('KYC_FRAUD');
      reasons.push('High-pressure threat of immediate bank/KYC/PAN account suspension if link is not visited');
    } else if (kycRegex.test(lower)) {
      score += 35;
      matchedCategories.push('KYC_FRAUD');
      reasons.push('Unsolicited request to update or verify banking KYC/PAN credentials');
    }

    // 2. Sensitive Security Credential Harvesting (OTP/PIN/CVV/Password)
    const credentialRegex = /(otp|pin|mpin|cvv|password|passcode|secret\s*code)/i;
    const credentialActionRegex = /(share|send|enter|tell|give|provide|forward|verify|fill)/i;
    if (credentialRegex.test(lower) && credentialActionRegex.test(lower)) {
      score += 60;
      matchedCategories.push('CREDENTIAL_THEFT');
      reasons.push('High-risk demand for confidential security credentials (OTP, UPI PIN, CVV, or password)');
    }

    // 3. Fake Lottery, Lucky Draw & Unsolicited Cashback Lure
    const lotteryRegex = /(congratulations|winner|won|lottery|lucky\s*draw|cashback|reward|prize|kbc).*(claim|collect|credited|approved|claim\s*now)/i;
    if (lotteryRegex.test(lower)) {
      score += 45;
      matchedCategories.push('LOTTERY_CASHBACK_FRAUD');
      reasons.push('Unsolicited lottery, prize, or instant cashback claim lure requiring recipient action');
    }

    // 4. Utility Bill / Electricity Disconnection & Extortion
    const billRegex = /(electricity|power|bill|light\s*bill).*(disconnect|cut|tonight|power\s*officer|payment\s*update)/i;
    if (billRegex.test(lower)) {
      score += 65;
      matchedCategories.push('UTILITY_EXTORTION');
      reasons.push('Intimidation tactic threatening immediate electrical utility disconnection tonight');
    }

    // 5. Remote Access Software Lure
    const remoteAccessRegex = /(anydesk|teamviewer|rustdesk|quicksupport|screen\s*share)/i;
    if (remoteAccessRegex.test(lower)) {
      score += 55;
      matchedCategories.push('REMOTE_ACCESS_SCAM');
      reasons.push('Instructions prompting installation of screen-sharing or remote desktop tools (e.g. AnyDesk)');
    }

    // 6. Fake Part-Time Job / Task Scam
    const taskRegex = /(part\s*time|work\s*from\s*home|telegram|daily\s*income|like\s*youtube|earn\s*(?:₹|rs)|google\s*review)/i;
    if (taskRegex.test(lower)) {
      score += 40;
      matchedCategories.push('TASK_JOB_FRAUD');
      reasons.push('High-yield part-time task or social media review scheme directing users to messaging apps');
    }

    // 7. Accidental Transfer / Refund Reversal Trick
    const refundRegex = /(sent\s*(?:by\s*)?mistake|wrongly\s*transferred|return\s*(?:my\s*)?money|refund\s*me|extra\s*amount)/i;
    if (refundRegex.test(lower)) {
      score += 40;
      matchedCategories.push('REFUND_REVERSAL_FRAUD');
      reasons.push('Deceptive claim of accidental money transfer demanding urgent repayment');
    }

    // 8. General Pressure / Threat Language
    const pressureRegex = /(legal\s*action|police|court|fir|arrest|warrant|cbi|customs)/i;
    if (pressureRegex.test(lower)) {
      score += 40;
      matchedCategories.push('IMPERSONATION_EXTORTION');
      reasons.push('Law enforcement or judicial arrest intimidation to coerce immediate funds transfer');
    }

    return {
      score,
      reasons,
      category: matchedCategories.length > 0 ? matchedCategories[0] : null,
    };
  }

  /**
   * Main analysis execution pipeline.
   */
  public async analyze(
    userId: string,
    input: AnalyzeScamInput
  ): Promise<ScamAnalysisResult> {
    const rawText = input.text?.trim() || '';
    const rawUrl = input.url?.trim() || '';
    const rawUpi = input.upiId?.trim() || '';

    let totalScore = 0;
    const reasons: string[] = [];
    const recommendations: string[] = [];
    let detectedCategory = 'SAFE_OR_BENIGN';

    // Determine Source Type
    let sourceType: 'TEXT' | 'URL' | 'UPI' | 'COMBINED';
    const presentFields = [Boolean(rawText), Boolean(rawUrl), Boolean(rawUpi)].filter(Boolean).length;
    if (presentFields > 1) {
      sourceType = 'COMBINED';
    } else if (rawUrl) {
      sourceType = 'URL';
    } else if (rawUpi) {
      sourceType = 'UPI';
    } else {
      sourceType = 'TEXT';
    }

    // 1. Text Heuristics
    if (rawText) {
      const textAnalysis = this.evaluateTextHeuristics(rawText);
      totalScore += textAnalysis.score;
      reasons.push(...textAnalysis.reasons);
      if (textAnalysis.category) {
        detectedCategory = textAnalysis.category;
      }
    }

    // 2. URL Extraction & SSRF-safe Analysis
    const extractedUrls = this.extractUrls(rawText, rawUrl);
    for (const urlItem of extractedUrls) {
      const urlAnalysis = this.analyzeUrlLexical(urlItem);
      totalScore += urlAnalysis.score;
      reasons.push(...urlAnalysis.reasons);
      if (urlAnalysis.isPhishingDomain && detectedCategory === 'SAFE_OR_BENIGN') {
        detectedCategory = 'PHISHING_URL';
      }
    }

    // 3. UPI Extraction & Analysis
    const extractedUpiId = this.extractUpiId(rawText, rawUpi);
    if (extractedUpiId) {
      const upiLower = extractedUpiId.toLowerCase();
      // Inspect handle for high-risk fraud markers
      const fraudKeywordsInUpi = ['refund', 'cashback', 'reward', 'helpdesk', 'support', 'officer', 'kyc', 'bonus'];
      const hasFraudKeyword = fraudKeywordsInUpi.some((k) => upiLower.includes(k));
      if (hasFraudKeyword) {
        totalScore += 35;
        reasons.push(`UPI ID (${extractedUpiId}) contains deceptive financial impersonation keywords`);
        if (detectedCategory === 'SAFE_OR_BENIGN') {
          detectedCategory = 'FRAUDULENT_UPI';
        }
      }
    }

    // 4. Amount Extraction
    const extractedAmount = this.extractAmount(rawText);

    // 5. Normalization of Risk Score and Category
    totalScore = Math.min(100, Math.max(0, totalScore));

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    if (totalScore >= 60) {
      riskLevel = 'HIGH';
    } else if (totalScore >= 30) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'LOW';
      if (reasons.length === 0) {
        reasons.push('No known suspicious phishing phrases, deceptive URLs, or fraud patterns detected');
      }
    }

    // Tailored actionable recommendations
    if (riskLevel === 'HIGH') {
      recommendations.push('DO NOT send money, scan QR codes, or approve payment requests for this party.');
      recommendations.push('NEVER share your UPI PIN, OTP, debit card CVV, or passwords under any circumstances.');
      recommendations.push('Do not download remote control software (AnyDesk, TeamViewer) or click unverified links.');
      recommendations.push('If threatened or extorted, immediately report to the National Cyber Crime Portal (1930 or cybercrime.gov.in).');
    } else if (riskLevel === 'MEDIUM') {
      recommendations.push('Exercise caution: verify the identity of the sender through official telephone or bank channels.');
      recommendations.push('Check the recipient UPI handle and beneficiary name carefully before confirming any transfer.');
      recommendations.push('Verify URL domain names directly in your browser rather than clicking embedded hyperlinks.');
    } else {
      recommendations.push('Message appears routine. Always verify beneficiary details before approving transactions.');
    }

    // 6. Scoped Ledger Transaction Matching (Strictly bounded by req.user.id)
    const userTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { transactionDate: 'desc' },
      take: 50,
    });

    const matchedTransactions: Array<{
      id: string;
      type: string;
      amount: number;
      category: string;
      payee: string | null;
      description: string | null;
      transactionDate: string;
    }> = [];

    for (const tx of userTransactions) {
      let isMatch = false;

      // Match by UPI ID in payee or description
      if (extractedUpiId) {
        if (tx.payee && tx.payee.toLowerCase().includes(extractedUpiId)) {
          isMatch = true;
        }
        if (tx.description && tx.description.toLowerCase().includes(extractedUpiId)) {
          isMatch = true;
        }
      }

      // Match by extracted amount
      if (extractedAmount !== null && Number(tx.amount) === extractedAmount) {
        isMatch = true;
      }

      if (isMatch) {
        matchedTransactions.push({
          id: tx.id,
          type: tx.type,
          amount: Number(tx.amount),
          category: tx.category,
          payee: tx.payee,
          description: tx.description,
          transactionDate: tx.transactionDate.toISOString(),
        });
      }
    }

    if (matchedTransactions.length > 0) {
      reasons.push(
        `Linked ${matchedTransactions.length} existing ledger transaction(s) matching this UPI handle or amount`
      );
      if (riskLevel === 'HIGH') {
        recommendations.unshift(
          '⚠️ ALERT: You have prior transactions matching this flagged entity. Review your bank statements immediately.'
        );
      }
    }

    // 7. Audit Logging in PostgreSQL
    const savedRecord = await prisma.scamAnalysis.create({
      data: {
        userId,
        riskLevel,
        riskScore: totalScore,
        category: detectedCategory,
        extractedUpiId: extractedUpiId || null,
        sourceType,
      },
    });

    return {
      analysisId: savedRecord.id,
      riskLevel,
      riskScore: totalScore,
      category: detectedCategory,
      sourceType,
      reasons,
      recommendations,
      extractedUpiId,
      extractedAmount,
      extractedUrls,
      matchedTransactions,
      analyzedAt: savedRecord.createdAt.toISOString(),
    };
  }

  /**
   * Retrieves previous scan analyses for the authenticated user.
   */
  public async getHistory(userId: string) {
    return prisma.scamAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}

export const scamService = new ScamService();
