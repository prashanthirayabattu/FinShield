import { Request, Response } from 'express';
import { env } from '../config/env';

/**
 * Health check controller.
 * Returns simple safe JSON health status without exposing sensitive environment parameters.
 */
export const getHealth = (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
  });
};
