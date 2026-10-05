import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Dashboard summary requires authentication
router.use(authenticate);

router.get('/summary', (req, res, next) =>
  dashboardController.getSummary(req, res, next)
);

export const dashboardRoutes = router;
