import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { budgetService } from '../services/budgetService';
import { BudgetQueryInput } from '../schemas/budgetSchemas';

export class BudgetController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized: Authentication required' });
        return;
      }

      const budget = await budgetService.create(req.user.id, req.body);
      res.status(201).json({
        message: 'Budget created successfully',
        budget,
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized: Authentication required' });
        return;
      }

      const query = req.query as unknown as BudgetQueryInput;
      const result = await budgetService.list(req.user.id, query);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized: Authentication required' });
        return;
      }

      const id = String(req.params.id);
      const budget = await budgetService.getById(req.user.id, id);

      if (!budget) {
        res.status(404).json({ error: 'Budget not found' });
        return;
      }

      res.status(200).json({ budget });
    } catch (err) {
      next(err);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized: Authentication required' });
        return;
      }

      const id = String(req.params.id);
      const updated = await budgetService.update(req.user.id, id, req.body);

      if (!updated) {
        res.status(404).json({ error: 'Budget not found' });
        return;
      }

      res.status(200).json({
        message: 'Budget updated successfully',
        budget: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized: Authentication required' });
        return;
      }

      const id = String(req.params.id);
      const deleted = await budgetService.delete(req.user.id, id);

      if (!deleted) {
        res.status(404).json({ error: 'Budget not found' });
        return;
      }

      res.status(200).json({ message: 'Budget deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const budgetController = new BudgetController();
