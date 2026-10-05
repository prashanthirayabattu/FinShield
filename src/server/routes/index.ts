import { Router } from 'express';
import { authRoutes } from './authRoutes';
import { healthRoutes } from './healthRoutes';

const router = Router();

router.use('/', healthRoutes);
router.use('/auth', authRoutes);

export const apiRoutes = router;
