-- Add new columns to teachers table for admin approval flow
-- Run after initial schema setup

ALTER TABLE public.teachers
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Create index for active teachers
CREATE INDEX IF NOT EXISTS idx_teachers_is_active ON teachers(is_active);
