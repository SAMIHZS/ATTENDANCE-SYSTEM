import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { sessionsService } from '../services/sessionsService';
import { attendanceService } from '../services/attendanceService';
import { supabaseAdmin } from '../lib/supabase';
import type { Request, Response, NextFunction } from 'express';
import type { AttendanceStatus } from '../types';

export const sessionsRouter = Router();

sessionsRouter.use(requireAuth);

// GET /api/v1/sessions/:id — get session details (Hardened)
sessionsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileId = req.auth!.profileId;
    const sessionId = String(req.params.id);
    const data = await sessionsService.getById(sessionId);
    
    // Ownership check (throws if teacher doesn't own it)
    await sessionsService.getStudentsForSession(sessionId, profileId);
    
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// GET /api/v1/sessions/:id/students (Hardened)
sessionsRouter.get('/:id/students', requireRole('teacher', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await sessionsService.getStudentsForSession(String(req.params.id), req.auth!.profileId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// GET /api/v1/sessions/:id/attendance
sessionsRouter.get('/:id/attendance', requireRole('teacher', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only assigned teacher or admin can see full logs
    const session = await sessionsService.getById(String(req.params.id));
    const { data: teacher } = await supabaseAdmin.from('teachers').select('id').eq('profile_id', req.auth!.profileId).single();
    if (teacher && session.actual_teacher_id !== teacher.id) {
       return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const data = await attendanceService.getBySession(String(req.params.id));
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// POST /api/v1/sessions/start — start or resume a session (teacher)
sessionsRouter.post('/start', requireRole('teacher', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { class_id, date, start_time, end_time, subject_id, timetable_slot_id } = req.body;
    if (!class_id || !date || !start_time || !end_time || !subject_id) {
      res.status(400).json({ success: false, message: 'Missing fields' });
      return;
    }
    const profileId = req.auth!.profileId;
    const { data: teacher } = await supabaseAdmin.from('teachers').select('id').eq('profile_id', profileId).single();
    if (!teacher) return res.status(403).json({ success: false, message: 'Teacher profile required' });

    const data = await sessionsService.startSession({ teacher_id: teacher.id, class_id, date, start_time, end_time, subject_id, timetable_slot_id });
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});

// POST /api/v1/sessions/:id/submit — submit session attendance (Atomic RPC)
sessionsRouter.post('/:id/submit', requireRole('teacher', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await sessionsService.submitSession(String(req.params.id), req.auth!.profileId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// PUT /api/v1/sessions/:id/attendance — bulk mark/update attendance
sessionsRouter.put('/:id/attendance', requireRole('teacher', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = String(req.params.id);
    const marks: { student_id: string; status: AttendanceStatus }[] = req.body.marks;
    if (!Array.isArray(marks)) return res.status(400).json({ success: false, message: 'marks array required' });

    // Verify ownership and lock status
    const session = await sessionsService.getById(sessionId);
    const { data: teacher } = await supabaseAdmin.from('teachers').select('id').eq('profile_id', req.auth!.profileId).single();
    
    if (teacher && session.actual_teacher_id !== teacher.id) {
       return res.status(403).json({ success: false, message: 'Forbidden: You do not own this session' });
    }

    if (session.status !== 'draft') {
      return res.status(403).json({ success: false, message: 'Session is locked and cannot be edited. Please contact administrator.' });
    }

    const data = await attendanceService.markAttendance(sessionId, marks);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});
