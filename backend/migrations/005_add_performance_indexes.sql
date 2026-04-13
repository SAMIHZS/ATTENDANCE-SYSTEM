-- Add performance indexes for common queries
-- Run this in Supabase SQL Editor or as a migration

-- Sessions table indexes
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_teacher_date ON sessions(scheduled_teacher_id, date);
CREATE INDEX IF NOT EXISTS idx_sessions_actual_teacher_date ON sessions(actual_teacher_id, date);
CREATE INDEX IF NOT EXISTS idx_sessions_class_date ON sessions(class_id, date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_date_start_time ON sessions(date, start_time);

-- Attendance table indexes
CREATE INDEX IF NOT EXISTS idx_attendance_student_session ON attendance(student_id, session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session_status ON attendance(session_id, status);

-- Timetable indexes
CREATE INDEX IF NOT EXISTS idx_timetable_teacher_day ON timetable(teacher_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_timetable_class_day ON timetable(class_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_timetable_day_time ON timetable(day_of_week, start_time, end_time);

-- Students and teachers
CREATE INDEX IF NOT EXISTS idx_students_class_roll ON students(class_id, roll_number);
CREATE INDEX IF NOT EXISTS idx_teachers_profile ON teachers(profile_id);

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);