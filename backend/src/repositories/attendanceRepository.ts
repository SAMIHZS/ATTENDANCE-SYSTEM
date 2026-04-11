import { supabaseAdmin } from '../lib/supabase';
import type { AttendanceRecord, AttendanceStatus } from '../types';

export const attendanceRepository = {
  async findBySession(session_id: string): Promise<AttendanceRecord[]> {
    const { data, error } = await supabaseAdmin
      .from('attendance')
      .select(`
        *,
        student:students(id, roll_number, profile:profiles(full_name))
      `)
      .eq('session_id', session_id)
      .order('marked_at');
    if (error) throw error;
    return (data ?? []) as unknown as AttendanceRecord[];
  },

  async findByStudent(student_id: string): Promise<AttendanceRecord[]> {
    const { data, error } = await supabaseAdmin
      .from('attendance')
      .select(`*, session:sessions(date, start_time, end_time, actual_subject_id, status)`)
      .eq('student_id', student_id)
      .order('marked_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as AttendanceRecord[];
  },

  /**
   * Bulk upsert attendance rows for a session.
   * Idempotent — unique on (session_id, student_id).
   */
  async bulkUpsert(
    records: { session_id: string; student_id: string; status: AttendanceStatus }[]
  ): Promise<AttendanceRecord[]> {
    const { data, error } = await supabaseAdmin
      .from('attendance')
      .upsert(records, { onConflict: 'session_id,student_id' })
      .select();
    if (error) throw error;
    return data ?? [];
  },

  /**
   * Attendance summary for one student + one subject.
   * Returns { total, present } counts for percentage calculation.
   * Used in Phase 5 (Student Dashboard).
   */
  async getSummaryForStudentSubject(
    student_id: string,
    subject_id: string
  ): Promise<{ total: number; present: number }> {
    const { data, error } = await supabaseAdmin
      .from('attendance')
      .select('status, session:sessions!inner(actual_subject_id)')
      .eq('student_id', student_id)
      .eq('session.actual_subject_id', subject_id);

    if (error) throw error;
    const rows = data ?? [];
    return {
      total: rows.length,
      present: rows.filter((r: { status: string }) => r.status === 'present').length,
    };
  },
};
