import { z } from 'zod';

export const VALID_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Education',
  'Healthcare',
  'Entertainment',
  'Other',
] as const;

export type ValidCategory = (typeof VALID_CATEGORIES)[number];

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

export const createBudgetSchema = z
  .object({
    category: z.enum(VALID_CATEGORIES, {
      error: 'Category must be a supported application category',
    }),
    limitAmount: z
      .number({
        error: 'limitAmount must be a positive number',
      })
      .positive('limitAmount must be greater than 0')
      .max(999999999.99, 'limitAmount exceeds maximum allowable threshold')
      .refine(
        (val) => Number(val.toFixed(2)) === val,
        'limitAmount cannot have more than 2 decimal places'
      ),
    month: z
      .string()
      .regex(monthRegex, 'month must be in normalized YYYY-MM format (e.g. 2026-10)'),
  })
  .strict();

export const updateBudgetSchema = z
  .object({
    category: z.enum(VALID_CATEGORIES).optional(),
    limitAmount: z
      .number()
      .positive('limitAmount must be greater than 0')
      .max(999999999.99)
      .refine(
        (val) => Number(val.toFixed(2)) === val,
        'limitAmount cannot have more than 2 decimal places'
      )
      .optional(),
    month: z.string().regex(monthRegex, 'month must be in YYYY-MM format').optional(),
  })
  .strict();

export const budgetQuerySchema = z
  .object({
    month: z.string().regex(monthRegex).optional(),
    category: z.enum(VALID_CATEGORIES).optional(),
  })
  .strict();

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type BudgetQueryInput = z.infer<typeof budgetQuerySchema>;
