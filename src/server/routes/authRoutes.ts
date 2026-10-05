import { Router } from 'express';
import { authController } from '../controllers/authController';
import { validateBody } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { authRateLimiter } from '../middleware/rateLimiter';
import { registerSchema, loginSchema } from '../schemas/authSchemas';

const router = Router();

// Public auth endpoints protected by rate limiting & strict Zod validation
router.post('/register', authRateLimiter, validateBody(registerSchema), authController.register);
router.post('/login', authRateLimiter, validateBody(loginSchema), authController.login);
router.post('/logout', authController.logout);

// Protected session identity endpoint
router.get('/me', authenticate, authController.getMe);

// Dedicated RBAC test endpoint to verify role authorization
router.get('/admin-only', authenticate, requireRole('ADMIN'), (_req, res) => {
  res.status(200).json({
    message: 'Authorized: administrator access verified',
  });
});

export const authRoutes = router;
