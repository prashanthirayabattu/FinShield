import { prisma } from '../db/prisma';
import { computeBudgetMetrics, ComputedBudget } from './budgetService';

export interface CategoryExpenseBreakdown {
  category: string;
  total: number;
  percentage: number;
  count: number;
}

export interface DashboardSummary {
  currentBalance: number;
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  categoryBreakdown: CategoryExpenseBreakdown[];
  recentTransactions: Array<{
    id: string;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    category: string;
    description: string;
    payee: string;
    date: string;
    createdAt: string;
  }>;
  budgets: ComputedBudget[];
  budgetAlerts: ComputedBudget[];
  month: string;
}

export class DashboardService {
  async getSummary(userId: string, monthParam?: string): Promise<DashboardSummary> {
    const activeMonth = monthParam || new Date().toISOString().slice(0, 7);

    // 1. Calculate Total Income
    const incomeAgg = await prisma.transaction.aggregate({
      where: {
        userId,
        type: 'INCOME',
      },
      _sum: {
        amount: true,
      },
    });
    const totalIncome = Number(Number(incomeAgg._sum.amount ?? 0).toFixed(2));

    // 2. Calculate Total Expenses
    const expenseAgg = await prisma.transaction.aggregate({
      where: {
        userId,
        type: 'EXPENSE',
      },
      _sum: {
        amount: true,
      },
    });
    const totalExpenses = Number(Number(expenseAgg._sum.amount ?? 0).toFixed(2));

    // 3. Mathematical Consistency: balance = total income - total expenses
    const currentBalance = Number((totalIncome - totalExpenses).toFixed(2));
    const totalSavings = currentBalance;

    // 4. Category Spending Breakdown for Expenses
    const categoryGroups = await prisma.transaction.groupBy({
      by: ['category'],
      where: {
        userId,
        type: 'EXPENSE',
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    const categoryBreakdown: CategoryExpenseBreakdown[] = categoryGroups
      .map((g) => {
        const total = Number(Number(g._sum.amount ?? 0).toFixed(2));
        const percentage =
          totalExpenses > 0 ? Number(((total / totalExpenses) * 100).toFixed(1)) : 0;
        return {
          category: g.category,
          total,
          percentage,
          count: g._count.id,
        };
      })
      .sort((a, b) => b.total - a.total);

    // 5. Recent 5 Transactions
    const recentRaw = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { transactionDate: 'desc' },
      take: 5,
    });

    const recentTransactions = recentRaw.map((tx) => ({
      id: tx.id,
      type: tx.type as 'INCOME' | 'EXPENSE',
      amount: Number(Number(tx.amount).toFixed(2)),
      category: tx.category,
      description: tx.description,
      payee: tx.payee,
      date: tx.transactionDate.toISOString().split('T')[0],
      createdAt: tx.createdAt.toISOString(),
    }));

    // 6. User Budgets & Alerts for active month (or all)
    const rawBudgets = await prisma.budget.findMany({
      where: {
        userId,
        month: activeMonth,
      },
      orderBy: { category: 'asc' },
    });

    const computedBudgets = await Promise.all(
      rawBudgets.map((b) => computeBudgetMetrics(userId, b))
    );

    const budgetAlerts = computedBudgets.filter(
      (b) => b.status === 'WARNING' || b.status === 'EXCEEDED'
    );

    return {
      currentBalance,
      totalIncome,
      totalExpenses,
      totalSavings,
      categoryBreakdown,
      recentTransactions,
      budgets: computedBudgets,
      budgetAlerts,
      month: activeMonth,
    };
  }
}

export const dashboardService = new DashboardService();
