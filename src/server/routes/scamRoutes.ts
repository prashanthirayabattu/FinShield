import { Router } from 'express';
import { scamController } from '../controllers/scamController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { analyzeScamSchema } from '../schemas/scamSchemas';

const router = Router();

// All ScamShield endpoints require authentication
router.use(authenticate);

router.post('/analyze', validateBody(analyzeScamSchema), (req, res, next) =>
  scamController.analyze(req, res, next)
);

router.get('/history', (req, res, next) =>
  scamController.history(req, res, next)
);

export const scamRoutes = router;
