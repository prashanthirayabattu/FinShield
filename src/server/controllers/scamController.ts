import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { scamService } from '../services/scamService';

export class ScamController {
  async analyze(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized: Authentication required' });
        return;
      }

      const result = await scamService.analyze(req.user.id, req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async history(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized: Authentication required' });
        return;
      }

      const analyses = await scamService.getHistory(req.user.id);
      res.status(200).json({ analyses });
    } catch (err) {
      next(err);
    }
  }
}

export const scamController = new ScamController();
