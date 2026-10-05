import { prisma } from '../db/prisma';

export interface MonthlySummaryResult {
  period: string;
  totalIncome: number;
  totalExpenses: number;
  currentBalance: number;
  totalSavings: number;
  transactionCount: number;
}

export interface CategorySpendingResult {
  period: string;
  totalExpenses: number;
  categories: Array<{
    category: string;
    spent: number;
    count: number;
    percentage: number;
  }>;
  highestCategory: string | null;
}

export interface BudgetStatusResult {
  period: string;
  budgets: Array<{
    category: string;
    limitAmount: number;
    spentAmount: number;
    remainingAmount: number;
    percentageUsed: number;
    status: 'SAFE' | 'WARNING' | 'EXCEEDED';
  }>;
  exceededBudgets: string[];
  warningBudgets: string[];
}

export interface RecentTransactionsResult {
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    category: string;
    payee: string | null;
    description: string | null;
    date: string;
  }>;
}

export interface MonthComparisonResult {
  monthA: MonthlySummaryResult;
  monthB: MonthlySummaryResult;
  expenseDifference: number;
  incomeDifference: number;
  balanceDifference: number;
}

export interface ScamExplanationResult {
  latestAnalysis: {
    id: string;
    riskLevel: string;
    riskScore: number;
    category: string;
    extractedUpiId: string | null;
    sourceType: string;
    createdAt: string;
  } | null;
}

function parseMonthBounds(monthStr?: string): { start: Date; end: Date; month: string } {
  let targetMonth = monthStr;
  if (!targetMonth || !/^\d{4}-(0[1-9]|1[0-2])$/.test(targetMonth)) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    targetMonth = `${y}-${m}`;
  }

  const [year, mon] = targetMonth.split('-').map(Number);
  const start = new Date(Date.UTC(year, mon - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, mon, 1, 0, 0, 0));
  return { start, end, month: targetMonth };
}

export const aiFinancialTools = {
  /**
   * Retrieves high-level monthly financial summary scoped strictly to userId.
   */
  async getMonthlySummary(userId: string, monthStr?: string): Promise<MonthlySummaryResult> {
    const { start, end, month } = parseMonthBounds(monthStr);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        transactionDate: {
          gte: start,
          lt: end,
        },
      },
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const tx of transactions) {
      const amt = Number(tx.amount);
      if (tx.type === 'INCOME') {
        totalIncome += amt;
      } else {
        totalExpenses += amt;
      }
    }

    totalIncome = Number(totalIncome.toFixed(2));
    totalExpenses = Number(totalExpenses.toFixed(2));
    const currentBalance = Number((totalIncome - totalExpenses).toFixed(2));
    const totalSavings = Math.max(0, currentBalance);

    return {
      period: month,
      totalIncome,
      totalExpenses,
      currentBalance,
      totalSavings,
      transactionCount: transactions.length,
    };
  },

  /**
   * Retrieves category spending breakdown scoped strictly to userId.
   */
  async getCategorySpending(userId: string, monthStr?: string): Promise<CategorySpendingResult> {
    const { start, end, month } = parseMonthBounds(monthStr);

    const expenseTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        transactionDate: {
          gte: start,
          lt: end,
        },
      },
    });

    const categoryMap = new Map<string, { spent: number; count: number }>();
    let totalExpenses = 0;

    for (const tx of expenseTransactions) {
      const amt = Number(tx.amount);
      totalExpenses += amt;
      const current = categoryMap.get(tx.category) || { spent: 0, count: 0 };
      categoryMap.set(tx.category, {
        spent: current.spent + amt,
        count: current.count + 1,
      });
    }

    totalExpenses = Number(totalExpenses.toFixed(2));

    const categories: CategorySpendingResult['categories'] = [];
    let highestCategory: string | null = null;
    let highestSpent = -1;

    for (const [cat, data] of categoryMap.entries()) {
      const spent = Number(data.spent.toFixed(2));
      const percentage = totalExpenses > 0 ? Number(((spent / totalExpenses) * 100).toFixed(1)) : 0;
      if (spent > highestSpent) {
        highestSpent = spent;
        highestCategory = cat;
      }
      categories.push({
        category: cat,
        spent,
        count: data.count,
        percentage,
      });
    }

    categories.sort((a, b) => b.spent - a.spent);

    return {
      period: month,
      totalExpenses,
      categories,
      highestCategory,
    };
  },

  /**
   * Retrieves active budget statuses and utilization percentages scoped strictly to userId.
   */
  async getBudgetStatus(userId: string, monthStr?: string): Promise<BudgetStatusResult> {
    const { start, end, month } = parseMonthBounds(monthStr);

    const budgets = await prisma.budget.findMany({
      where: {
        userId,
        month,
      },
    });

    const expenses = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        transactionDate: {
          gte: start,
          lt: end,
        },
      },
    });

    const spentByCategory = new Map<string, number>();
    for (const tx of expenses) {
      const prev = spentByCategory.get(tx.category) || 0;
      spentByCategory.set(tx.category, prev + Number(tx.amount));
    }

    const budgetResults: BudgetStatusResult['budgets'] = [];
    const exceededBudgets: string[] = [];
    const warningBudgets: string[] = [];

    for (const b of budgets) {
      const limitAmount = Number(b.limitAmount);
      const spentAmount = Number((spentByCategory.get(b.category) || 0).toFixed(2));
      const remainingAmount = Number((limitAmount - spentAmount).toFixed(2));
      const percentageUsed = limitAmount > 0 ? Number(((spentAmount / limitAmount) * 100).toFixed(1)) : 0;

      let status: 'SAFE' | 'WARNING' | 'EXCEEDED' = 'SAFE';
      if (percentageUsed >= 100) {
        status = 'EXCEEDED';
        exceededBudgets.push(b.category);
      } else if (percentageUsed >= 80) {
        status = 'WARNING';
        warningBudgets.push(b.category);
      }

      budgetResults.push({
        category: b.category,
        limitAmount,
        spentAmount,
        remainingAmount,
        percentageUsed,
        status,
      });
    }

    return {
      period: month,
      budgets: budgetResults,
      exceededBudgets,
      warningBudgets,
    };
  },

  /**
   * Retrieves recent transactions scoped strictly to userId.
   */
  async getRecentTransactions(userId: string, limit: number = 5): Promise<RecentTransactionsResult> {
    const safeLimit = Math.min(20, Math.max(1, limit));

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { transactionDate: 'desc' },
      take: safeLimit,
    });

    return {
      transactions: transactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: Number(tx.amount),
        category: tx.category,
        payee: tx.payee,
        description: tx.description,
        date: tx.transactionDate.toISOString().split('T')[0],
      })),
    };
  },

  /**
   * Compares two months of financial performance scoped strictly to userId.
   */
  async compareMonths(userId: string, monthA: string, monthB: string): Promise<MonthComparisonResult> {
    const summaryA = await this.getMonthlySummary(userId, monthA);
    const summaryB = await this.getMonthlySummary(userId, monthB);

    return {
      monthA: summaryA,
      monthB: summaryB,
      expenseDifference: Number((summaryA.totalExpenses - summaryB.totalExpenses).toFixed(2)),
      incomeDifference: Number((summaryA.totalIncome - summaryB.totalIncome).toFixed(2)),
      balanceDifference: Number((summaryA.currentBalance - summaryB.currentBalance).toFixed(2)),
    };
  },

  /**
   * Retrieves latest ScamShield alert data scoped strictly to userId.
   */
  async getScamAnalysisExplanation(userId: string): Promise<ScamExplanationResult> {
    const latest = await prisma.scamAnalysis.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!latest) {
      return { latestAnalysis: null };
    }

    return {
      latestAnalysis: {
        id: latest.id,
        riskLevel: latest.riskLevel,
        riskScore: latest.riskScore,
        category: latest.category,
        extractedUpiId: latest.extractedUpiId,
        sourceType: latest.sourceType,
        createdAt: latest.createdAt.toISOString(),
      },
    };
  },
};
