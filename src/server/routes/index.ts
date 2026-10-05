import { Router } from 'express';
import { authRoutes } from './authRoutes';
import { healthRoutes } from './healthRoutes';
import { transactionRoutes } from './transactionRoutes';

const router = Router();

router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/transactions', transactionRoutes);

export const apiRoutes = router;
