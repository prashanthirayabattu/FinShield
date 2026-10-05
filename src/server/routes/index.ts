import { Router } from 'express';
import { authRoutes } from './authRoutes';
import { healthRoutes } from './healthRoutes';
import { transactionRoutes } from './transactionRoutes';
import { budgetRoutes } from './budgetRoutes';
import { dashboardRoutes } from './dashboardRoutes';
import { scamRoutes } from './scamRoutes';
import { aiRoutes } from './aiRoutes';

const router = Router();

router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/transactions', transactionRoutes);
router.use('/budgets', budgetRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/scamshield', scamRoutes);
router.use('/ai', aiRoutes);

export const apiRoutes = router;

