export interface MatchedLedgerTransaction {
  id: string;
  type: string;
  amount: number;
  category: string;
  payee: string | null;
  description: string | null;
  transactionDate: string;
}

export interface ScamAnalysisResponse {
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
  matchedTransactions: MatchedLedgerTransaction[];
  analyzedAt: string;
}

export const scamApi = {
  async analyze(data: { text?: string; url?: string; upiId?: string }): Promise<ScamAnalysisResponse> {
    const res = await fetch('/api/scamshield/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Scam inspection request failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    return res.json();
  },

  async history(): Promise<{
    analyses: Array<{
      id: string;
      riskLevel: string;
      riskScore: number;
      category: string;
      extractedUpiId: string | null;
      sourceType: string;
      createdAt: string;
    }>;
  }> {
    const res = await fetch('/api/scamshield/history', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to fetch history' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    return res.json();
  },
};
