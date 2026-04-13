-- Migration: Add is_active column to teachers and students tables for soft-delete support.
-- Run this against your Supabase project before using the new Admin User Management endpoints.

-- Add is_active to teachers (default true for existing records)
ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Add is_active to students (default true for existing records)
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Add unique constraint on (class_id, roll_number) for students if not exists
-- This prevents duplicate roll numbers within the same class.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'students_class_id_roll_number_key'
  ) THEN
    ALTER TABLE public.students ADD CONSTRAINT students_class_id_roll_number_key UNIQUE (class_id, roll_number);
  END IF;
END $$;
