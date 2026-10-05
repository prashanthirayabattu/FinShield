import type { Budget, TransactionCategory } from '../types';

export interface BackendBudget {
  id: string;
  userId: string;
  category: TransactionCategory;
  limitAmount: number;
  month: string;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  status: 'SAFE' | 'WARNING' | 'EXCEEDED';
  createdAt: string;
  updatedAt: string;
}

export function mapBackendBudgetToFrontend(b: BackendBudget): Budget {
  return {
    id: b.id,
    category: b.category,
    limit: b.limitAmount,
    spent: b.spentAmount,
    month: b.month,
  };
}

export const budgetApi = {
  async list(params?: { month?: string; category?: string }): Promise<{ budgets: BackendBudget[]; count: number }> {
    const query = new URLSearchParams();
    if (params?.month) query.set('month', params.month);
    if (params?.category) query.set('category', params.category);

    const queryString = query.toString();
    const url = `/api/budgets${queryString ? `?${queryString}` : ''}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to fetch budgets' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    return res.json();
  },

  async create(data: { category: TransactionCategory; limitAmount: number; month: string }): Promise<BackendBudget> {
    const res = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create budget' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const json = await res.json();
    return json.budget;
  },

  async update(id: string, data: { category?: TransactionCategory; limitAmount?: number; month?: string }): Promise<BackendBudget> {
    const res = await fetch(`/api/budgets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update budget' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const json = await res.json();
    return json.budget;
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`/api/budgets/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete budget' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
  },
};
