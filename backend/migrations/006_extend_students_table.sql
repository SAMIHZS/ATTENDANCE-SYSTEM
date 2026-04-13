-- Add new columns to students table for identity binding
-- Run after initial schema setup

-- Drop existing columns if they exist (for idempotence)
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS roll_number VARCHAR(50) UNIQUE NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS college_email VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update constraint: (class_id, roll_number) should be unique
-- Drop old constraint if exists and create new
ALTER TABLE public.students
DROP CONSTRAINT IF EXISTS students_class_id_roll_number_key,
ADD CONSTRAINT students_class_id_roll_number_unique UNIQUE (class_id, roll_number);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_roll_number ON students(roll_number);
CREATE INDEX IF NOT EXISTS idx_students_college_email ON students(college_email);
CREATE INDEX IF NOT EXISTS idx_students_is_active ON students(is_active);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
