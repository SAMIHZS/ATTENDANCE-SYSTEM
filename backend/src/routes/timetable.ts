import { Router } from 'express';
import { timetableController } from '../controllers/timetableController';
import { requireAuth, requireRole } from '../middleware/auth';

export const timetableRouter = Router();

timetableRouter.use(requireAuth);

// GET /api/v1/timetable?class_id=&teacher_id=&day_of_week=
timetableRouter.get('/', timetableController.list);

// GET /api/v1/timetable/current — current slot for the authenticated teacher
// Used by Phase 4 live class detection
timetableRouter.get('/current', requireRole('teacher'), timetableController.currentSlot);
