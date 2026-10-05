import { z } from 'zod';

export const askAiAssistantSchema = z
  .object({
    message: z
      .string({
        error: 'message is required and must be a string',
      })
      .trim()
      .min(1, 'message cannot be empty')
      .max(1000, 'message exceeds maximum allowable length of 1000 characters'),
    conversationHistory: z
      .array(
        z
          .object({
            role: z.enum(['user', 'assistant'], {
              error: "role must be either 'user' or 'assistant'",
            }),
            content: z
              .string()
              .trim()
              .min(1, 'history message content cannot be empty')
              .max(2000, 'history message content exceeds 2000 characters'),
          })
          .strict()
      )
      .max(10, 'conversation history cannot exceed 10 entries')
      .optional(),
  })
  .strict();

export type AskAiAssistantInput = z.infer<typeof askAiAssistantSchema>;
