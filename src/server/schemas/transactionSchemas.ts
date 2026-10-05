import { z } from 'zod';

export const TRANSACTION_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Education',
  'Healthcare',
  'Entertainment',
  'Salary',
  'Investment',
  'Freelance',
  'Other',
] as const;

/**
 * Strict schema for creating a transaction.
 * Strictly disallows unexpected or privilege-escalating fields (userId, role, ownerId, etc.).
 */
export const createTransactionSchema = z
  .object({
    type: z.enum(['INCOME', 'EXPENSE'], {
      error: 'Transaction type must be INCOME or EXPENSE',
    }),
    amount: z
      .number({
        error: 'Amount must be a positive number',
      })
      .positive('Amount must be greater than 0')
      .max(999999999.99, 'Amount exceeds maximum allowable threshold')
      .refine(
        (val) => Number(val.toFixed(2)) === val,
        'Amount may have at most 2 decimal places'
      ),
    category: z.enum(TRANSACTION_CATEGORIES, {
      error: 'Category must be a supported application category',
    }),
    description: z
      .string()
      .trim()
      .min(1, 'Description is required')
      .max(255, 'Description must not exceed 255 characters'),
    payee: z
      .string()
      .trim()
      .min(1, 'Payee is required')
      .max(100, 'Payee must not exceed 100 characters'),
    transactionDate: z
      .string()
      .datetime({ message: 'transactionDate must be a valid ISO-8601 datetime string' }),
  })
  .strict(); // Defense against mass-assignment / object injection

/**
 * Strict schema for updating a transaction.
 */
export const updateTransactionSchema = z
  .object({
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    amount: z
      .number()
      .positive('Amount must be greater than 0')
      .max(999999999.99, 'Amount exceeds maximum allowable threshold')
      .refine(
        (val) => Number(val.toFixed(2)) === val,
        'Amount may have at most 2 decimal places'
      )
      .optional(),
    category: z.enum(TRANSACTION_CATEGORIES).optional(),
    description: z.string().trim().min(1).max(255).optional(),
    payee: z.string().trim().min(1).max(100).optional(),
    transactionDate: z.string().datetime().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

/**
 * Schema for querying/filtering transactions.
 */
export const transactionQuerySchema = z
  .object({
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    category: z.enum(TRANSACTION_CATEGORIES).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    search: z.string().trim().max(100).optional(),
    limit: z.coerce.number().min(1).max(100).default(50),
    offset: z.coerce.number().min(0).default(0),
  })
  .strict();

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type TransactionQueryInput = z.infer<typeof transactionQuerySchema>;
