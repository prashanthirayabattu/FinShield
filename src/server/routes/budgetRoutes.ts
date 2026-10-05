import { Router } from 'express';
import { budgetController } from '../controllers/budgetController';
import { authenticate } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  createBudgetSchema,
  updateBudgetSchema,
  budgetQuerySchema,
} from '../schemas/budgetSchemas';

const router = Router();

// All budget endpoints require authentication
router.use(authenticate);

router.post('/', validateBody(createBudgetSchema), (req, res, next) =>
  budgetController.create(req, res, next)
);

router.get('/', validateQuery(budgetQuerySchema), (req, res, next) =>
  budgetController.list(req, res, next)
);

router.get('/:id', (req, res, next) =>
  budgetController.getById(req, res, next)
);

router.patch('/:id', validateBody(updateBudgetSchema), (req, res, next) =>
  budgetController.update(req, res, next)
);

router.delete('/:id', (req, res, next) =>
  budgetController.delete(req, res, next)
);

export const budgetRoutes = router;
