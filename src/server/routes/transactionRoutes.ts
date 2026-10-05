import { Router } from 'express';
import { transactionController } from '../controllers/transactionController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  createTransactionSchema,
  updateTransactionSchema,
} from '../schemas/transactionSchemas';

const router = Router();

// All transaction endpoints strictly enforce authenticated identity
router.use(authenticate);

router.post(
  '/',
  validateBody(createTransactionSchema),
  transactionController.create
);

router.get('/', transactionController.list);

router.get('/:id', transactionController.getById);

router.patch(
  '/:id',
  validateBody(updateTransactionSchema),
  transactionController.update
);

router.delete('/:id', transactionController.delete);

export const transactionRoutes = router;
