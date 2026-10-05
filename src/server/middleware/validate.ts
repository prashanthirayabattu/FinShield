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

/**
 * Middleware factory to validate query parameters against a Zod schema.
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const error = result.error as ZodError;
      const issues = error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));

      res.status(400).json({
        error: 'Query validation failed',
        details: issues,
      });
      return;
    }

    try {
      req.query = result.data as unknown as Request['query'];
    } catch {
      Object.assign(req.query, result.data);
    }
    next();
  };
};

