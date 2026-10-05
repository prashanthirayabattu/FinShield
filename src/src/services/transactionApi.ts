import type { Transaction, TransactionCategory, TransactionType } from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:5000/api';

export interface CreateTransactionPayload {
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  description: string;
  payee: string;
  transactionDate: string;
}

export interface UpdateTransactionPayload {
  type?: TransactionType;
  amount?: number;
  category?: TransactionCategory;
  description?: string;
  payee?: string;
  transactionDate?: string;
}

export interface TransactionFilterParams {
  type?: 'INCOME' | 'EXPENSE';
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

interface BackendTransaction {
  id: string;
  userId: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category: string;
  description: string;
  payee: string;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
}

function mapBackendToFrontend(bt: BackendTransaction): Transaction {
  return {
    id: bt.id,
    amount: bt.amount,
    type: bt.type,
    category: bt.category as TransactionCategory,
    date: bt.transactionDate ? bt.transactionDate.split('T')[0] : new Date().toISOString().split('T')[0],
    description: bt.description,
    payee: bt.payee,
  };
}

export const transactionApi = {
  /**
   * Fetches transactions for the authenticated user with optional filters.
   */
  async list(filters?: TransactionFilterParams): Promise<{ transactions: Transaction[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.category && filters.category !== 'ALL') params.append('category', filters.category);
    if (filters?.dateFrom) params.append('dateFrom', new Date(filters.dateFrom).toISOString());
    if (filters?.dateTo) params.append('dateTo', new Date(filters.dateTo).toISOString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.offset) params.append('offset', String(filters.offset));

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/transactions${query}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Includes HttpOnly auth cookie
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to fetch transactions');
    }

    const data: { transactions: BackendTransaction[]; total: number } = await res.json();
    return {
      transactions: data.transactions.map(mapBackendToFrontend),
      total: data.total,
    };
  },

  /**
   * Creates a transaction scoped to the authenticated user.
   */
  async create(payload: CreateTransactionPayload): Promise<Transaction> {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to create transaction');
    }

    const data: { transaction: BackendTransaction } = await res.json();
    return mapBackendToFrontend(data.transaction);
  },

  /**
   * Updates an existing transaction scoped to the authenticated user.
   */
  async update(id: string, payload: UpdateTransactionPayload): Promise<Transaction> {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to update transaction');
    }

    const data: { transaction: BackendTransaction } = await res.json();
    return mapBackendToFrontend(data.transaction);
  },

  /**
   * Deletes an existing transaction scoped to the authenticated user.
   */
  async delete(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to delete transaction');
    }
  },
};
