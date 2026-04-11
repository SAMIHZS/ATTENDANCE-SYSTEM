import { Router } from 'express';
import { classesController } from '../controllers/classesController';
import { requireAuth, requireRole } from '../middleware/auth';

export const classesRouter = Router();

// All routes require authentication
classesRouter.use(requireAuth);

// GET /api/v1/classes — list all classes (admin + teacher + student)
classesRouter.get('/', classesController.list);

// GET /api/v1/classes/:id — get a single class
classesRouter.get('/:id', classesController.getById);

// POST /api/v1/classes — create a class (admin only)
classesRouter.post('/', requireRole('admin'), classesController.create);
