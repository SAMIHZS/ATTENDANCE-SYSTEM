-- ═══════════════════════════════════════════════════════════════════
-- BCA Student Hub — Seed Data for Development & Testing
-- Run this AFTER the initial_schema migration.
-- Safe to run on a clean database (uses INSERT ... ON CONFLICT DO NOTHING)
-- ═══════════════════════════════════════════════════════════════════

-- ── Classes ──────────────────────────────────────────────────────────
INSERT INTO public.classes (name) VALUES
  ('BCA 1st Year'),
  ('BCA 2nd Year'),
  ('BCA 3rd Year'),
  ('MCA 1st Year'),
  ('MCA 2nd Year')
ON CONFLICT DO NOTHING;

-- ── Subjects ─────────────────────────────────────────────────────────
INSERT INTO public.subjects (name, code) VALUES
  ('Mathematics',               'MATH101'),
  ('Data Structures',           'CS201'),
  ('Database Management',       'CS301'),
  ('Operating Systems',         'CS302'),
  ('Computer Networks',         'CS401'),
  ('Software Engineering',      'CS402'),
  ('Web Technologies',          'CS403'),
  ('Python Programming',        'CS101'),
  ('C Programming',             'CS102'),
  ('Statistics',                'STAT101')
ON CONFLICT (code) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- HOW TO CREATE TEST USERS
-- ═══════════════════════════════════════════════════════════════════
-- 1. Create users via Supabase Dashboard → Authentication → Users
--    OR via the app's login page (Google OAuth or email/password)
-- 2. After they sign in once, update their role:
--
--    UPDATE public.profiles SET role = 'teacher' WHERE full_name = 'Your Name';
--    UPDATE public.profiles SET role = 'admin'   WHERE full_name = 'Admin Name';
--
-- 3. Create teacher row:
--    INSERT INTO public.teachers (profile_id, employee_id, department)
--    SELECT id, 'T001', 'Computer Science' FROM public.profiles WHERE role = 'teacher' LIMIT 1;
--
-- 4. Create student rows (after class is created):
--    INSERT INTO public.students (profile_id, class_id, roll_number)
--    SELECT p.id, c.id, 'BCA2-001'
--    FROM public.profiles p, public.classes c
--    WHERE p.role = 'student' AND c.name = 'BCA 2nd Year'
--    LIMIT 1;
--
-- 5. Wire class_subjects (which teacher teaches what to which class):
--    INSERT INTO public.class_subjects (class_id, subject_id, teacher_id)
--    SELECT c.id, s.id, t.id
--    FROM public.classes c, public.subjects s, public.teachers t
--    WHERE c.name = 'BCA 2nd Year' AND s.code = 'CS301'
--    LIMIT 1
--    ON CONFLICT DO NOTHING;
--
-- 6. Add a timetable slot:
--    INSERT INTO public.timetable (class_id, subject_id, teacher_id, day_of_week, start_time, end_time)
--    SELECT c.id, s.id, t.id, 'monday', '09:00', '10:00'
--    FROM public.classes c, public.subjects s, public.teachers t
--    WHERE c.name = 'BCA 2nd Year' AND s.code = 'CS301'
--    LIMIT 1
--    ON CONFLICT DO NOTHING;
-- ═══════════════════════════════════════════════════════════════════
