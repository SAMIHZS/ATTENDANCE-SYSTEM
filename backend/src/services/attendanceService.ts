import { attendanceRepository } from '../repositories/attendanceRepository';
import type { AttendanceRecord, AttendanceStatus } from '../types';

// ─── Service Contracts (Phase 3) ──────────────────────────────────────────────

export const attendanceService = {
  async getBySession(session_id: string): Promise<AttendanceRecord[]> {
    return attendanceRepository.findBySession(session_id);
  },

  async getByStudent(student_id: string): Promise<AttendanceRecord[]> {
    return attendanceRepository.findByStudent(student_id);
  },

  /**
   * CONTRACT: Bulk-mark attendance for a session.
   * - Accepts array of { student_id, status } pairs.
   * - Idempotent — safe to call again to update marks.
   * - Validates session is in 'draft' state before writing.
   * IMPLEMENTATION: Phase 4
   */
  async markAttendance(
    session_id: string,
    marks: { student_id: string; status: AttendanceStatus }[]
  ): Promise<AttendanceRecord[]> {
    const records = marks.map((m) => ({
      session_id,
      student_id: m.student_id,
      status: m.status,
    }));
    return attendanceRepository.bulkUpsert(records);
  },

  /**
   * CONTRACT: Calculate attendance percentage for one student × subject.
   * Returns { total, present, percentage }.
   * IMPLEMENTATION: Phase 5 (Student Dashboard)
   */
  async getStudentSummary(
    student_id: string,
    subject_id: string
  ): Promise<{ total: number; present: number; percentage: number }> {
    const { total, present } = await attendanceRepository.getSummaryForStudentSubject(
      student_id,
      subject_id
    );
    return {
      total,
      present,
      percentage: total > 0 ? Math.round((present / total) * 100) : 0,
    };
  },
};
