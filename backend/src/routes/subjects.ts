import { Router } from 'express';
import { subjectsController } from '../controllers/subjectsController';
import { requireAuth, requireRole } from '../middleware/auth';

export const subjectsRouter = Router();

subjectsRouter.use(requireAuth);

// GET /api/v1/subjects
subjectsRouter.get('/', subjectsController.list);

// GET /api/v1/subjects/:id
subjectsRouter.get('/:id', subjectsController.getById);

// POST /api/v1/subjects (admin only)
subjectsRouter.post('/', requireRole('admin'), subjectsController.create);
