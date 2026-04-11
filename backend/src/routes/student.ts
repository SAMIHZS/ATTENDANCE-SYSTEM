import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';

export const studentRouter = Router();

studentRouter.use(requireAuth);

/**
 * POST /api/v1/student/bind-roll
 * Allows a student to set their roll number and class for the first time.
 */
studentRouter.post('/bind-roll', requireRole('student'), async (req: Request, res: Response) => {
  const { roll_number, class_id } = req.body;
  const profileId = req.auth!.profileId;

  if (!roll_number || !class_id) {
    return res.status(400).json({ success: false, message: 'Roll number and Class ID are required.' });
  }

  try {
    // 1. Check if already bound
    const { data: existing } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('profile_id', profileId)
      .single();

    if (existing) {
      return res.status(400).json({ success: false, message: 'Student profile already exists.' });
    }

    // 2. Insert into students table
    const { data, error } = await supabaseAdmin
      .from('students')
      .insert({
        profile_id: profileId,
        class_id,
        roll_number
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/v1/student/attendance/summary
// Returns overall and per-subject attendance percentages for the auth'd student.
// ──────────────────────────────────────────────────────────────────────────────
studentRouter.get('/attendance/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileId = req.auth!.profileId;

    // 1. Resolve student ID
    const { data: student, error: stdErr } = await supabaseAdmin
      .from('students')
      .select('id, class_id')
      .eq('profile_id', profileId)
      .single();

    if (stdErr || !student) {
      res.status(404).json({ success: false, message: 'Student profile not found' });
      return;
    }

    // 2. Fetch all attendance records JOINED with submitted sessions only
    const { data: records, error: recErr } = await supabaseAdmin
      .from('attendance')
      .select(`
        status,
        session:sessions!inner(id, actual_subject_id, status)
      `)
      .eq('student_id', student.id)
      .in('sessions.status', ['submitted', 'edited']);

    if (recErr) throw recErr;

    // 3. To get the correct subject names, fetch the class subjects
    const { data: subjectRows } = await supabaseAdmin
      .from('subjects')
      .select('id, name, code, is_core');
      
    const subjectMap = new Map((subjectRows ?? []).map(s => [s.id, s]));

    // 4. Calculate stats
    let totalClasses = 0;
    let totalAttended = 0;
    const perSubject: Record<string, { total: number; attended: number; subject: any }> = {};

    (records ?? []).forEach((row: any) => {
      const subjectId = row.session.actual_subject_id;
      const isPresent = row.status === 'present';

      if (!perSubject[subjectId]) {
        const subjDetails = subjectMap.get(subjectId) || { id: subjectId, name: 'Unknown Subject', code: 'UNK' };
        perSubject[subjectId] = { total: 0, attended: 0, subject: subjDetails };
      }

      perSubject[subjectId].total += 1;
      totalClasses += 1;

      if (isPresent) {
        perSubject[subjectId].attended += 1;
        totalAttended += 1;
      }
    });

    const overallPercentage = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;
    
    // Format subjects array
    const subjectsArray = Object.values(perSubject).map(item => ({
      subject: item.subject,
      total: item.total,
      attended: item.attended,
      absent: item.total - item.attended,
      percentage: Math.round((item.attended / item.total) * 100)
    }));

    res.json({
      success: true,
      data: {
        overall: {
          percentage: overallPercentage,
          total: totalClasses,
          attended: totalAttended,
          absent: totalClasses - totalAttended
        },
        subjects: subjectsArray
      }
    });

  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/v1/student/attendance/history
// Returns chronological history of attendance for the student
// ──────────────────────────────────────────────────────────────────────────────
studentRouter.get('/attendance/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileId = req.auth!.profileId;

    const { data: student } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('profile_id', profileId)
      .single();

    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found' });
      return;
    }

    const { subjectId, date } = req.query;

    let query = supabaseAdmin
      .from('attendance')
      .select(`
        id, status,
        session:sessions!inner(
          id, date, start_time, end_time, status,
          actual_subject:subjects!sessions_actual_subject_id_fkey(id, name, code)
        )
      `)
      .eq('student_id', student.id)
      .in('sessions.status', ['submitted', 'edited'])
      .order('session(date)', { ascending: false })
      .order('session(start_time)', { ascending: false });
      
    if (subjectId) {
       query = query.eq('sessions.actual_subject_id', String(subjectId));
    }
    if (date) {
       query = query.eq('sessions.date', String(date));
    }

    const { data: history, error } = await query;
    if (error) throw error;

    // Flatten it for easier frontend use
    const flatHistory = (history ?? []).map((row: any) => ({
      id: row.id,
      status: row.status,
      date: row.session.date,
      start_time: row.session.start_time,
      end_time: row.session.end_time,
      subject: row.session.actual_subject
    }));

    res.json({ success: true, data: flatHistory });

  } catch (err) {
    next(err);
  }
});
