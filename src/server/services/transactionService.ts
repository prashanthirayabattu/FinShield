import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import {
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionQueryInput,
} from '../schemas/transactionSchemas';

export interface SafeTransaction {
  id: string;
  userId: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category: string;
  description: string;
  payee: string;
  transactionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Normalizes Prisma transaction record, formatting Decimal amount to number.
 */
function toSafeTransaction(tx: {
  id: string;
  userId: string;
  type: 'INCOME' | 'EXPENSE';
  amount: Prisma.Decimal;
  category: string;
  description: string;
  payee: string;
  transactionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}): SafeTransaction {
  return {
    id: tx.id,
    userId: tx.userId,
    type: tx.type,
    amount: tx.amount.toNumber(),
    category: tx.category,
    description: tx.description,
    payee: tx.payee,
    transactionDate: tx.transactionDate,
    createdAt: tx.createdAt,
    updatedAt: tx.updatedAt,
  };
}

export const transactionService = {
  /**
   * Creates a transaction scoped strictly to the authenticated user ID.
   * Never accepts userId from client-supplied request body.
   */
  async create(userId: string, input: CreateTransactionInput): Promise<SafeTransaction> {
    const created = await prisma.transaction.create({
      data: {
        userId, // Derived exclusively from verified server session
        type: input.type,
        amount: new Prisma.Decimal(input.amount),
        category: input.category,
        description: input.description,
        payee: input.payee,
        transactionDate: new Date(input.transactionDate),
      },
    });

    return toSafeTransaction(created);
  },

  /**
   * Retrieves transactions scoped strictly to the authenticated user ID.
   * Applies optional type, category, date range, and text search filters.
   */
  async list(
    userId: string,
    filters: TransactionQueryInput
  ): Promise<{ transactions: SafeTransaction[]; total: number }> {
    const whereClause: Prisma.TransactionWhereInput = {
      userId, // Anti-IDOR / Anti-BOLA: strictly scoped to session user
    };

    if (filters.type) {
      whereClause.type = filters.type;
    }

    if (filters.category) {
      whereClause.category = filters.category;
    }

    if (filters.dateFrom || filters.dateTo) {
      whereClause.transactionDate = {};
      if (filters.dateFrom) {
        whereClause.transactionDate.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        whereClause.transactionDate.lte = new Date(filters.dateTo);
      }
    }

    if (filters.search && filters.search.trim() !== '') {
      const term = filters.search.trim();
      whereClause.OR = [
        { description: { contains: term, mode: 'insensitive' } },
        { payee: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        orderBy: { transactionDate: 'desc' },
        skip: filters.offset,
        take: filters.limit,
      }),
      prisma.transaction.count({
        where: whereClause,
      }),
    ]);

    return {
      transactions: transactions.map(toSafeTransaction),
      total,
    };
  },

  /**
   * Retrieves a single transaction ensuring IDOR immunity.
   * Query strictly enforces both id AND userId.
   * Returns null if resource does not exist or belongs to a different tenant.
   */
  async getById(userId: string, id: string): Promise<SafeTransaction | null> {
    const found = await prisma.transaction.findFirst({
      where: {
        id,
        userId, // Strict ownership check
      },
    });

    return found ? toSafeTransaction(found) : null;
  },

  /**
   * Updates an existing transaction ensuring IDOR immunity.
   * Returns null if resource does not exist or belongs to another user.
   */
  async update(
    userId: string,
    id: string,
    input: UpdateTransactionInput
  ): Promise<SafeTransaction | null> {
    // 1. Verify ownership
    const existing = await prisma.transaction.findFirst({
      where: {
        id,
        userId, // Strict ownership check
      },
    });

    if (!existing) {
      return null;
    }

    // 2. Perform update
    const updateData: Prisma.TransactionUpdateInput = {};

    if (input.type !== undefined) updateData.type = input.type;
    if (input.amount !== undefined) updateData.amount = new Prisma.Decimal(input.amount);
    if (input.category !== undefined) updateData.category = input.category;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.payee !== undefined) updateData.payee = input.payee;
    if (input.transactionDate !== undefined) {
      updateData.transactionDate = new Date(input.transactionDate);
    }

    const updated = await prisma.transaction.update({
      where: { id: existing.id },
      data: updateData,
    });

    return toSafeTransaction(updated);
  },

  /**
   * Deletes a transaction ensuring IDOR immunity.
   * Returns false if resource does not exist or belongs to another user.
   */
  async delete(userId: string, id: string): Promise<boolean> {
    // 1. Verify ownership
    const existing = await prisma.transaction.findFirst({
      where: {
        id,
        userId, // Strict ownership check
      },
    });

    if (!existing) {
      return false;
    }

    // 2. Perform deletion
    await prisma.transaction.delete({
      where: { id: existing.id },
    });

    return true;
  },
};
