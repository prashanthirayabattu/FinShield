import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { dashboardService } from '../services/dashboardService';

export class DashboardController {
  async getSummary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized: Authentication required' });
        return;
      }

      const month = typeof req.query.month === 'string' ? req.query.month : undefined;
      const summary = await dashboardService.getSummary(req.user.id, month);

      res.status(200).json(summary);
    } catch (err) {
      next(err);
    }
  }
}

export const dashboardController = new DashboardController();
