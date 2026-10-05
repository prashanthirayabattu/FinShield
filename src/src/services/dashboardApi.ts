import type { TransactionCategory } from '../types';

export interface CategoryBreakdownItem {
  category: TransactionCategory;
  total: number;
  percentage: number;
  count: number;
}

export interface DashboardSummaryResponse {
  currentBalance: number;
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  categoryBreakdown: CategoryBreakdownItem[];
  recentTransactions: Array<{
    id: string;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    category: TransactionCategory;
    description: string;
    payee: string;
    date: string;
    createdAt: string;
  }>;
  budgets: Array<{
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
  }>;
  budgetAlerts: Array<{
    id: string;
    category: TransactionCategory;
    limitAmount: number;
    month: string;
    spentAmount: number;
    remainingAmount: number;
    percentageUsed: number;
    status: 'WARNING' | 'EXCEEDED';
  }>;
  month: string;
}

export const dashboardApi = {
  async getSummary(month?: string): Promise<DashboardSummaryResponse> {
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    const res = await fetch(`/api/dashboard/summary${query}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to fetch dashboard summary' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    return res.json();
  },
};
