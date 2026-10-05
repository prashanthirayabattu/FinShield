import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters')
      .trim(),
    email: z
      .string()
      .email('Invalid email address format')
      .max(255, 'Email cannot exceed 255 characters')
      .transform((val) => val.trim().toLowerCase()),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .max(128, 'Password cannot exceed 128 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one digit')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z
      .string()
      .email('Invalid email address format')
      .max(255)
      .transform((val) => val.trim().toLowerCase()),
    password: z
      .string()
      .min(1, 'Password is required')
      .max(128),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
