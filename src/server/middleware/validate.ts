import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware factory to validate request bodies against a Zod schema.
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const error = result.error as ZodError;
      const issues = error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));

      res.status(400).json({
        error: 'Validation failed',
        details: issues,
      });
      return;
    }

    req.body = result.data;
    next();
  };
};
