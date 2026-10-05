export interface AiAssistantResponse {
  answer: string;
  dataUsed: {
    period: string | null;
    categories: string[];
    transactionCount: number;
    provider: string;
  };
}

export const aiApi = {
  async ask(message: string): Promise<AiAssistantResponse> {
    const res = await fetch('/api/ai/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ message }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'AI Assistant query failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    return res.json();
  },
};
