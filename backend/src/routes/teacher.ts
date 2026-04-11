import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';
import { sessionsService } from '../services/sessionsService';
import { attendanceService } from '../services/attendanceService';
import type { DayOfWeek, AttendanceStatus } from '../types';

export const teacherRouter = Router();
teacherRouter.use(requireAuth);
teacherRouter.use(requireRole('teacher', 'admin'));

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/v1/teacher/live-class
// Returns the timetable slot active RIGHT NOW for the authenticated teacher.
// ──────────────────────────────────────────────────────────────────────────────
teacherRouter.get('/live-class', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileId = req.auth!.profileId;

    // Resolve teacher row from profile id
    const { data: teacher, error: tErr } = await supabaseAdmin
      .from('teachers')
      .select('id')
      .eq('profile_id', profileId)
      .single();

    if (tErr || !teacher) {
      res.json({ success: true, data: null, message: 'Teacher profile not found' });
      return;
    }

    const now = new Date();
    const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIdx = now.getDay(); // 0=Sun, 1=Mon...
    if (dayIdx === 0) {
      res.json({ success: true, data: null, message: 'No classes on Sunday' });
      return;
    }
    const day = DAYS[dayIdx - 1];
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const time = `${hh}:${mm}`;

    // Find matching slot with joins
    const { data: slot, error: slotErr } = await supabaseAdmin
      .from('timetable')
      .select(`
        id, class_id, subject_id, teacher_id, day_of_week, start_time, end_time,
        class:classes(id, name),
        subject:subjects(id, name, code)
      `)
      .eq('teacher_id', teacher.id)
      .eq('day_of_week', day)
      .lte('start_time', time)
      .gte('end_time', time)
      .limit(1)
      .maybeSingle();

    if (slotErr) throw slotErr;
    if (!slot) { res.json({ success: true, data: null }); return; }

    // Check if a session already exists for this slot today
    const today = now.toISOString().split('T')[0];
    const { data: existingSession } = await supabaseAdmin
      .from('sessions')
      .select('id, status')
      .eq('class_id', slot.class_id)
      .eq('date', today)
      .eq('start_time', slot.start_time)
      .maybeSingle();

    res.json({
      success: true,
      data: {
        slot,
        teacher_id: teacher.id,
        date: today,
        existing_session: existingSession ?? null,
      },
    });
  } catch (err) { next(err); }
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/v1/teacher/today-schedule
// Returns all timetable slots for today for this teacher (upcoming + live)
// ──────────────────────────────────────────────────────────────────────────────
teacherRouter.get('/today-schedule', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileId = req.auth!.profileId;
    const { data: teacher } = await supabaseAdmin
      .from('teachers').select('id').eq('profile_id', profileId).single();

    if (!teacher) { res.json({ success: true, data: [] }); return; }

    const now = new Date();
    const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIdx = now.getDay();
    if (dayIdx === 0) { res.json({ success: true, data: [] }); return; }
    const day = DAYS[dayIdx - 1];
    const today = now.toISOString().split('T')[0];

    const { data: slots, error } = await supabaseAdmin
      .from('timetable')
      .select(`
        id, class_id, subject_id, start_time, end_time,
        class:classes(id, name),
        subject:subjects(id, name, code)
      `)
      .eq('teacher_id', teacher.id)
      .eq('day_of_week', day)
      .order('start_time');

    if (error) throw error;

    // Annotate each slot with existing session
    const slotIds = (slots ?? []).map((s: { class_id: string }) => s.class_id);
    const { data: sessions } = await supabaseAdmin
      .from('sessions')
      .select('id, status, class_id, start_time')
      .eq('date', today)
      .in('class_id', slotIds.length > 0 ? slotIds : ['__none__']);

    const sessionMap = new Map(
      (sessions ?? []).map((s: { class_id: string; start_time: string; id: string; status: string }) => 
        [`${s.class_id}_${s.start_time}`, s])
    );

    const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    const annotated = (slots ?? []).map((slot: { class_id: string; start_time: string; end_time: string }) => ({
      ...slot,
      is_live: slot.start_time <= currentTime && slot.end_time >= currentTime,
      existing_session: sessionMap.get(`${slot.class_id}_${slot.start_time}`) ?? null,
    }));

    res.json({ success: true, data: annotated });
  } catch (err) { next(err); }
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/v1/teacher/sessions/start
// Start or resume a session for a timetable slot
// ──────────────────────────────────────────────────────────────────────────────
teacherRouter.post('/sessions/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileId = req.auth!.profileId;
    const { class_id, date, start_time, end_time, subject_id, timetable_slot_id } = req.body;

    if (!class_id || !date || !start_time || !end_time || !subject_id) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const { data: teacher } = await supabaseAdmin
      .from('teachers').select('id').eq('profile_id', profileId).single();
    if (!teacher) { res.status(403).json({ success: false, message: 'Teacher profile required' }); return; }

    const session = await sessionsService.startSession({
      teacher_id: teacher.id,
      class_id, date, start_time, end_time, subject_id, timetable_slot_id,
    });

    // Also return student roster
    const students = await sessionsService.getStudentsForSession(session.id);

    res.status(201).json({ success: true, data: { session, students } });
  } catch (err) { next(err); }
});

// ──────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/teacher/sessions/:id/override-subject
// Override the actual subject for a draft session
// ──────────────────────────────────────────────────────────────────────────────
teacherRouter.put('/sessions/:id/override-subject', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileId = req.auth!.profileId;
    const sessionId = String(req.params.id);
    const { actual_subject_id } = req.body;

    if (!actual_subject_id) {
      res.status(400).json({ success: false, message: 'actual_subject_id is required' });
      return;
    }

    const { data: teacher } = await supabaseAdmin
      .from('teachers').select('id').eq('profile_id', profileId).single();
    if (!teacher) { res.status(403).json({ success: false, message: 'Teacher profile required' }); return; }

    // Verify teacher owns this session
    const { data: session, error: sErr } = await supabaseAdmin
      .from('sessions').select('*').eq('id', sessionId).single();
    if (sErr || !session) { res.status(404).json({ success: false, message: 'Session not found' }); return; }
    if (session.actual_teacher_id !== teacher.id) {
      res.status(403).json({ success: false, message: 'You do not own this session' }); return;
    }
    if (session.status !== 'draft') {
      res.status(409).json({ success: false, message: 'Cannot modify a submitted session' }); return;
    }

    const { data: updated, error: uErr } = await supabaseAdmin
      .from('sessions')
      .update({ actual_subject_id })
      .eq('id', sessionId)
      .select(`
        *,
        scheduled_subject:subjects!sessions_scheduled_subject_id_fkey(id, name, code),
        actual_subject:subjects!sessions_actual_subject_id_fkey(id, name, code)
      `)
      .single();
    if (uErr) throw uErr;

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// ──────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/teacher/sessions/:id/attendance
// Bulk upsert attendance marks (intermediate saves during roll call)
// ──────────────────────────────────────────────────────────────────────────────
teacherRouter.put('/sessions/:id/attendance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileId = req.auth!.profileId;
    const sessionId = String(req.params.id);
    const { marks }: { marks: { student_id: string; status: AttendanceStatus }[] } = req.body;

    if (!Array.isArray(marks) || marks.length === 0) {
      res.status(400).json({ success: false, message: 'marks array is required' });
      return;
    }

    const { data: teacher } = await supabaseAdmin
      .from('teachers').select('id').eq('profile_id', profileId).single();
    if (!teacher) { res.status(403).json({ success: false, message: 'Teacher profile required' }); return; }

    // Verify session is draft and belongs to this teacher
    const { data: session } = await supabaseAdmin
      .from('sessions').select('status, actual_teacher_id').eq('id', sessionId).single();
    if (!session) { res.status(404).json({ success: false, message: 'Session not found' }); return; }
    if (session.actual_teacher_id !== teacher.id) { res.status(403).json({ success: false, message: 'Forbidden' }); return; }
    if (session.status !== 'draft') { res.status(409).json({ success: false, message: 'Session already submitted' }); return; }

    const data = await attendanceService.markAttendance(sessionId, marks);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/v1/teacher/sessions/:id/submit
// Submit and lock a session — Now uses atomic RPC via service
// ──────────────────────────────────────────────────────────────────────────────
teacherRouter.post('/sessions/:id/submit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileId = req.auth!.profileId;
    const sessionId = String(req.params.id);

    // service.submitSession now verifies ownership and runs atomically in SQL
    const data = await sessionsService.submitSession(sessionId, profileId);

    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/v1/teacher/sessions/:id
// Get session detail with student attendance list
// ──────────────────────────────────────────────────────────────────────────────
teacherRouter.get('/sessions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = String(req.params.id);
    const profileId = req.auth!.profileId;

    const session = await sessionsService.getById(sessionId);
    
    // Ownership check via service (can throw Forbidden)
    const students = await sessionsService.getStudentsForSession(sessionId, profileId);
    const attendance = await attendanceService.getBySession(sessionId);

    res.json({ success: true, data: { session, students, attendance } });
  } catch (err) { next(err); }
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/v1/teacher/history
// Teacher's submitted sessions with attendance summaries
// ──────────────────────────────────────────────────────────────────────────────
teacherRouter.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileId = req.auth!.profileId;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const { data: teacher } = await supabaseAdmin
      .from('teachers').select('id').eq('profile_id', profileId).single();
    if (!teacher) { res.json({ success: true, data: [] }); return; }

    const { data: sessions, error, count } = await supabaseAdmin
      .from('sessions')
      .select(`
        id, date, start_time, end_time, status, submitted_at,
        class:classes(id, name),
        actual_subject:subjects!sessions_actual_subject_id_fkey(id, name, code)
      `, { count: 'exact' })
      .eq('actual_teacher_id', teacher.id)
      .in('status', ['submitted', 'edited'])
      .order('date', { ascending: false })
      .order('start_time', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Attach summary counts for each session
    const sessionIds = (sessions ?? []).map((s: { id: string }) => s.id);
    let summaryMap: Map<string, { total: number; present: number }> = new Map();

    if (sessionIds.length > 0) {
      const { data: allAttendance } = await supabaseAdmin
        .from('attendance')
        .select('session_id, status')
        .in('session_id', sessionIds);

      for (const row of (allAttendance ?? []) as { session_id: string; status: string }[]) {
        const cur = summaryMap.get(row.session_id) ?? { total: 0, present: 0 };
        cur.total++;
        if (row.status === 'present') cur.present++;
        summaryMap.set(row.session_id, cur);
      }
    }

    const enriched = (sessions ?? []).map((s: { id: string }) => ({
      ...s,
      summary: summaryMap.get(s.id) ?? { total: 0, present: 0 },
    }));

    res.json({ success: true, data: enriched, meta: { page, limit, total: count ?? 0 } });
  } catch (err) { next(err); }
});
