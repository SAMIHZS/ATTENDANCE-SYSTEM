// ─── Shared Backend Types ─────────────────────────────────────────────────────

export type UserRole = 'admin' | 'teacher' | 'student';
export type AttendanceStatus = 'present' | 'absent';
export type SessionStatus = 'draft' | 'submitted' | 'edited';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

// ─── DB Row Types (mirror Supabase schema) ────────────────────────────────────

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  name: string;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string | null;
  created_at: string;
}

export interface Teacher {
  id: string;
  profile_id: string;
  employee_id: string | null;
  department: string | null;
  created_at: string;
}

export interface Student {
  id: string;
  profile_id: string;
  class_id: string;
  roll_number: string;
  created_at: string;
}

export interface ClassSubject {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  created_at: string;
}

export interface TimetableSlot {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface Session {
  id: string;
  class_id: string;
  timetable_slot_id: string | null;
  date: string;
  start_time: string;
  end_time: string;
  scheduled_subject_id: string;
  actual_subject_id: string;
  scheduled_teacher_id: string;
  actual_teacher_id: string;
  status: SessionStatus;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  marked_at: string;
}

// ─── Request / Response helpers ───────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ─── Auth context attached to Request by middleware ───────────────────────────

export interface AuthPayload {
  sub: string;          // Supabase user UUID
  email: string;
  role: UserRole;
  profileId: string;    // same as sub for Supabase Auth
}
