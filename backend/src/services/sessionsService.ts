import { sessionsRepository } from '../repositories/sessionsRepository';
import { timetableRepository } from '../repositories/timetableRepository';
import { supabaseAdmin } from '../lib/supabase';
import type { Session, TimetableSlot } from '../types';

// ─── Service Contracts (Phase 3) ──────────────────────────────────────────────
// Full implementation in Phase 4.

export const sessionsService = {
  async getById(id: string): Promise<Session> {
    const session = await sessionsRepository.findById(id);
    if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 });
    return session;
  },

  async listByTeacher(teacher_id: string): Promise<Session[]> {
    return sessionsRepository.findByTeacher(teacher_id);
  },

  /**
   * CONTRACT: Start or resume a session for a teacher.
   * - Finds the current timetable slot for the teacher.
   * - Creates a session (or returns the existing draft).
   * - Idempotent — safe to call multiple times.
   * IMPLEMENTATION: Phase 4
   */
  async startSession(params: {
    teacher_id: string;
    class_id: string;
    date: string;
    start_time: string;
    end_time: string;
    subject_id: string; // actual subject (may differ from scheduled)
    timetable_slot_id?: string;
  }): Promise<Session> {
    // 1. Check for ANY existing session in this slot (idempotency/protection)
    const existing = await sessionsRepository.findByClassAndDate(params.class_id, params.date);
    const overlap = existing.find((s) => s.start_time === params.start_time);

    /**
     * LOGIC SCENARIOS (Security Fix #1):
     * - Scenario A: Session is 'submitted' or 'edited'.
     *   Return it immediately. The UI will detect status and go to Read-Only mode.
     *   This prevents 'upsert' from resetting the status to 'draft'.
     * - Scenario B: Session is 'draft'.
     *   Return the existing draft so the teacher can continue roll call.
     * - Scenario C: No session exists.
     *   Proceed to upsert (create) a fresh draft.
     */
    if (overlap) {
      return overlap;
    }

    // 2. Scaffold a session — scheduled_* defaults to actual_* when no slot override
    // Unique constraint on (class_id, date, start_time) acts as secondary safeguard.
    return sessionsRepository.upsert({
      class_id: params.class_id,
      timetable_slot_id: params.timetable_slot_id ?? null,
      date: params.date,
      start_time: params.start_time,
      end_time: params.end_time,
      scheduled_subject_id: params.subject_id,
      actual_subject_id: params.subject_id,
      scheduled_teacher_id: params.teacher_id,
      actual_teacher_id: params.teacher_id,
      status: 'draft',
      submitted_at: null,
    });
  },

  /**
   * CONTRACT: Submit attendance for a session.
   * - Uses the submit_attendance_session RPC for atomicity.
   * - Verifies ownership at the database level (inside RPC).
   * - Returns summary counts.
   */
  async submitSession(session_id: string, teacherProfileId: string): Promise<any> {
    const { data, error } = await supabaseAdmin.rpc('submit_attendance_session', {
      p_session_id: session_id,
      p_teacher_profile_id: teacherProfileId
    });

    if (error) {
      if (error.code === 'P0003') throw Object.assign(new Error('Ownership violation: You do not own this session'), { statusCode: 403 });
      if (error.code === 'P0004') throw Object.assign(new Error('Session already submitted'), { statusCode: 409 });
      throw error;
    }

    return data;
  },

  /**
   * CONTRACT: Allow admin to re-open a submitted session for editing.
   */
  async reopenSession(session_id: string): Promise<Session> {
    const { data, error } = await supabaseAdmin
      .from('sessions')
      .update({ status: 'draft', submitted_at: null })
      .eq('id', session_id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getStudentsForSession(session_id: string, viewerProfileId?: string): Promise<any[]> {
    const session = await sessionsRepository.findById(session_id);
    if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 });

    // Security: Only the assigned teacher or an admin can view the roster for a specific session
    if (viewerProfileId) {
      const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', viewerProfileId).single();
      
      if (!profile || profile.role === 'student') {
        throw Object.assign(new Error('Access denied: Unauthorized role'), { statusCode: 403 });
      }

      if (profile.role === 'teacher') {
        const { data: teacher } = await supabaseAdmin.from('teachers').select('id').eq('profile_id', viewerProfileId).single();
        if (!teacher || session.actual_teacher_id !== teacher.id) {
          throw Object.assign(new Error('Access denied: You do not own this session'), { statusCode: 403 });
        }
      }
      // If role is admin, allow access
    }

    const { data, error } = await supabaseAdmin
      .from('students')
      .select('id, roll_number, profile:profiles(full_name)')
      .eq('class_id', session.class_id)
      .order('roll_number');
    if (error) throw error;
    return data ?? [];
  },
};
