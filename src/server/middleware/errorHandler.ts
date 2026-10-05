import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Centralized error handler preventing information leakage in production.
 */
export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;

  // Generic production-safe message
  let message = 'An unexpected server error occurred';

  if (statusCode < 500) {
    message = err.message;
  } else if (env.NODE_ENV === 'development') {
    // Only in development show internal message
    message = err.message;
  }

  // Response never exposes stack traces or database internals in production
  res.status(statusCode).json({
    error: message,
    ...(env.NODE_ENV === 'development' && {
      code: err.code,
      stack: err.stack,
    }),
  });
};
