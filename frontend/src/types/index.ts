// ─── Core Domain Types ───────────────────────────────────────────────────────

export type Role = 'admin' | 'teacher' | 'student';

export type AttendanceStatus = 'present' | 'absent';

export type SessionStatus = 'draft' | 'submitted' | 'edited';

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}


// ─── Academic Entities ───────────────────────────────────────────────────────

export interface Class {
  id: string;
  name: string;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
}

export interface Teacher {
  id: string;
  user_id: string;
  name: string;
  email: string;
}

export interface Student {
  id: string;
  user_id: string;
  class_id: string;
  roll_number: string;
  name: string;
  email?: string;
}

export interface ClassSubject {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  subject?: Subject;
  teacher?: Teacher;
}

// ─── Timetable ───────────────────────────────────────────────────────────────

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

export interface TimetableSlot {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: DayOfWeek;
  start_time: string; // "HH:MM"
  end_time: string;   // "HH:MM"
  class?: Class;
  subject?: Subject;
  teacher?: Teacher;
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export interface Session {
  id: string;
  class_id: string;
  date: string; // "YYYY-MM-DD"
  start_time: string;
  end_time: string;
  scheduled_subject_id: string;
  actual_subject_id: string;
  scheduled_teacher_id: string;
  actual_teacher_id: string;
  status: SessionStatus;
  created_at: string;
  submitted_at?: string;
  // Joined fields
  class?: Class;
  scheduled_subject?: Subject;
  actual_subject?: Subject;
  scheduled_teacher?: Teacher;
  actual_teacher?: Teacher;
}

// ─── Attendance ──────────────────────────────────────────────────────────────

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  marked_at?: string;
  student?: Student;
}

export interface AttendanceSubmitPayload {
  session_id: string;
  records: { student_id: string; status: AttendanceStatus }[];
}

// ─── Dashboard / Summary ─────────────────────────────────────────────────────

export interface LiveClassData {
  slot: TimetableSlot;
  existingSession?: Session;
}

export interface StudentAttendanceSummary {
  overall_percentage: number;
  total_classes: number;
  present_count: number;
  absent_count: number;
  subject_wise: SubjectAttendance[];
}

export interface SubjectAttendance {
  subject_id: string;
  subject_name: string;
  teacher_name?: string;
  percentage: number;
  present_count: number;
  total_count: number;
}

export interface AttendanceHistoryItem {
  session_id: string;
  date: string;
  subject_name: string;
  subject_id: string;
  start_time: string;
  end_time: string;
  status: AttendanceStatus;
}

// ─── API Response Envelope ───────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// ─── Export ──────────────────────────────────────────────────────────────────

export interface ExportFilters {
  class_id?: string;
  subject_id?: string;
  date_from?: string;
  date_to?: string;
  format: 'pdf' | 'excel';
}
