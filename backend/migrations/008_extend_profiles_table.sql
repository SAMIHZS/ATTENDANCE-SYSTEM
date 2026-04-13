-- Add new columns to profiles table for identity and approval workflows
-- Run after initial schema setup

-- Update role to accept pending states
-- (Assumes old values are: 'student', 'teacher', 'admin')
-- New values: 'student', 'student_pending', 'teacher', 'teacher_pending', 'admin'

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS requested_teacher_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_role_requested_teacher ON profiles(role) WHERE requested_teacher_at IS NOT NULL;
