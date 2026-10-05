import { Router } from 'express';
import { aiController } from '../controllers/aiController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { aiRateLimiter } from '../middleware/rateLimiter';
import { askAiAssistantSchema } from '../schemas/aiSchemas';

const router = Router();

// All AI Assistant endpoints require authentication and are rate-limited
router.use(authenticate);
router.use(aiRateLimiter);

router.post('/assistant', validateBody(askAiAssistantSchema), (req, res, next) =>
  aiController.ask(req, res, next)
);

export const aiRoutes = router;
