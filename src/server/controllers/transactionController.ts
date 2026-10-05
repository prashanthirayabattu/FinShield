import { Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { transactionService } from '../services/transactionService';
import { transactionQuerySchema } from '../schemas/transactionSchemas';
import { AuthenticatedRequest } from '../types';

export const transactionController = {
  /**
   * POST /api/transactions
   */
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized: missing authentication session' });
        return;
      }

      const transaction = await transactionService.create(req.user.id, req.body);

      res.status(201).json({
        message: 'Transaction created successfully',
        transaction,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/transactions
   */
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized: missing authentication session' });
        return;
      }

      const queryValidation = transactionQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: queryValidation.error.issues,
        });
        return;
      }

      const result = await transactionService.list(req.user.id, queryValidation.data);

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/transactions/:id
   */
  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized: missing authentication session' });
        return;
      }

      const id = String(req.params.id);
      const transaction = await transactionService.getById(req.user.id, id);

      if (!transaction) {
        // Anti-Enumeration / Anti-IDOR: Return generic 404
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }

      res.status(200).json({ transaction });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/transactions/:id
   */
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized: missing authentication session' });
        return;
      }

      const id = String(req.params.id);
      const updated = await transactionService.update(req.user.id, id, req.body);

      if (!updated) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }

      res.status(200).json({
        message: 'Transaction updated successfully',
        transaction: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/transactions/:id
   */
  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized: missing authentication session' });
        return;
      }

      const id = String(req.params.id);
      const deleted = await transactionService.delete(req.user.id, id);

      if (!deleted) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }

      res.status(200).json({
        message: 'Transaction deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/transactions/export
   */
  async exportCsv(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized: missing authentication session' });
        return;
      }

      const transactions = await prisma.transaction.findMany({
        where: { userId: req.user.id },
        orderBy: { transactionDate: 'desc' },
      });

      const { generateTransactionsCsv } = await import('../utils/csvExporter');
      const csvData = generateTransactionsCsv(transactions);
      const today = new Date().toISOString().split('T')[0];

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="finshield_transactions_${today}.csv"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.status(200).send(csvData);
    } catch (err) {
      next(err);
    }
  },
};
