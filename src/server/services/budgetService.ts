import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../db/prisma';
import { CreateBudgetInput, UpdateBudgetInput, BudgetQueryInput } from '../schemas/budgetSchemas';

export type BudgetStatus = 'SAFE' | 'WARNING' | 'EXCEEDED';

export interface ComputedBudget {
  id: string;
  userId: string;
  category: string;
  limitAmount: number;
  month: string;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  status: BudgetStatus;
  createdAt: string;
  updatedAt: string;
}

export function parseMonthBounds(monthStr: string): { start: Date; end: Date } {
  const [yearStr, monthNumStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthNumStr, 10);

  const start = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(monthNum === 12 ? year + 1 : year, monthNum === 12 ? 0 : monthNum, 1, 0, 0, 0, 0));

  return { start, end };
}

export async function computeBudgetMetrics(
  userId: string,
  budget: {
    id: string;
    userId: string;
    category: string;
    limitAmount: Decimal;
    month: string;
    createdAt: Date;
    updatedAt: Date;
  }
): Promise<ComputedBudget> {
  const { start, end } = parseMonthBounds(budget.month);

  const agg = await prisma.transaction.aggregate({
    where: {
      userId,
      type: 'EXPENSE',
      category: budget.category,
      transactionDate: {
        gte: start,
        lt: end,
      },
    },
    _sum: {
      amount: true,
    },
  });

  const spentAmount = Number(agg._sum.amount ?? 0);
  const limitAmount = Number(budget.limitAmount);
  const remainingAmount = Number((limitAmount - spentAmount).toFixed(2));
  const percentageUsed = limitAmount > 0 ? Number(((spentAmount / limitAmount) * 100).toFixed(1)) : 0;

  let status: BudgetStatus = 'SAFE';
  if (percentageUsed >= 100) {
    status = 'EXCEEDED';
  } else if (percentageUsed >= 80) {
    status = 'WARNING';
  }

  return {
    id: budget.id,
    userId: budget.userId,
    category: budget.category,
    limitAmount,
    month: budget.month,
    spentAmount,
    remainingAmount,
    percentageUsed,
    status,
    createdAt: budget.createdAt.toISOString(),
    updatedAt: budget.updatedAt.toISOString(),
  };
}

export class BudgetService {
  /**
   * Create a budget with tenant isolation and duplicate-prevention
   */
  async create(userId: string, data: CreateBudgetInput): Promise<ComputedBudget> {
    const existing = await prisma.budget.findUnique({
      where: {
        user_category_month_key: {
          userId,
          category: data.category,
          month: data.month,
        },
      },
    });

    if (existing) {
      const err = new Error(`A budget for category "${data.category}" in period "${data.month}" already exists.`);
      Object.assign(err, { statusCode: 409 });
      throw err;
    }

    const created = await prisma.budget.create({
      data: {
        userId,
        category: data.category,
        limitAmount: new Decimal(data.limitAmount),
        month: data.month,
      },
    });

    return computeBudgetMetrics(userId, created);
  }

  /**
   * List all budgets for the authenticated user with computed metrics
   */
  async list(userId: string, query: BudgetQueryInput): Promise<{ budgets: ComputedBudget[]; count: number }> {
    const where: { userId: string; month?: string; category?: string } = { userId };
    if (query.month) where.month = query.month;
    if (query.category) where.category = query.category;

    const rawBudgets = await prisma.budget.findMany({
      where,
      orderBy: [{ month: 'desc' }, { category: 'asc' }],
    });

    const computed = await Promise.all(
      rawBudgets.map((b) => computeBudgetMetrics(userId, b))
    );

    return {
      budgets: computed,
      count: computed.length,
    };
  }

  /**
   * Get budget by ID strictly scoped to authenticated user (IDOR prevention)
   */
  async getById(userId: string, budgetId: string): Promise<ComputedBudget | null> {
    const budget = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        userId,
      },
    });

    if (!budget) {
      return null;
    }

    return computeBudgetMetrics(userId, budget);
  }

  /**
   * Update budget strictly scoped to authenticated user (IDOR & mass-assignment prevention)
   */
  async update(userId: string, budgetId: string, data: UpdateBudgetInput): Promise<ComputedBudget | null> {
    const existing = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        userId,
      },
    });

    if (!existing) {
      return null;
    }

    const updateData: { category?: string; limitAmount?: Decimal; month?: string } = {};
    if (data.category !== undefined) updateData.category = data.category;
    if (data.limitAmount !== undefined) updateData.limitAmount = new Decimal(data.limitAmount);
    if (data.month !== undefined) updateData.month = data.month;

    // If changing category or month, verify unique constraint
    const targetCategory = data.category ?? existing.category;
    const targetMonth = data.month ?? existing.month;
    if (targetCategory !== existing.category || targetMonth !== existing.month) {
      const conflict = await prisma.budget.findUnique({
        where: {
          user_category_month_key: {
            userId,
            category: targetCategory,
            month: targetMonth,
          },
        },
      });

      if (conflict && conflict.id !== budgetId) {
        const err = new Error(`A budget for category "${targetCategory}" in period "${targetMonth}" already exists.`);
        Object.assign(err, { statusCode: 409 });
        throw err;
      }
    }

    const updated = await prisma.budget.update({
      where: { id: budgetId },
      data: updateData,
    });

    return computeBudgetMetrics(userId, updated);
  }

  /**
   * Delete budget strictly scoped to authenticated user (IDOR prevention)
   */
  async delete(userId: string, budgetId: string): Promise<boolean> {
    const existing = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        userId,
      },
    });

    if (!existing) {
      return false;
    }

    await prisma.budget.delete({
      where: { id: budgetId },
    });

    return true;
  }
}

export const budgetService = new BudgetService();
