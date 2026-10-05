import { z } from 'zod';

export const analyzeScamSchema = z
  .object({
    text: z
      .string()
      .max(5000, 'text exceeds maximum allowable length of 5000 characters')
      .optional(),
    url: z
      .string()
      .max(2000, 'url exceeds maximum allowable length of 2000 characters')
      .optional(),
    upiId: z
      .string()
      .max(256, 'upiId exceeds maximum allowable length of 256 characters')
      .optional(),
  })
  .strict()
  .refine(
    (data) => {
      const hasText = typeof data.text === 'string' && data.text.trim().length > 0;
      const hasUrl = typeof data.url === 'string' && data.url.trim().length > 0;
      const hasUpi = typeof data.upiId === 'string' && data.upiId.trim().length > 0;
      return hasText || hasUrl || hasUpi;
    },
    {
      message: 'At least one input (text, url, or upiId) must be provided for analysis',
    }
  );

export type AnalyzeScamInput = z.infer<typeof analyzeScamSchema>;
