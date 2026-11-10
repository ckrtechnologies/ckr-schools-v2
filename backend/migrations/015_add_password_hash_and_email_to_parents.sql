-- Migration 015: Add password_hash and email to parents table for direct parent credential management
ALTER TABLE public.parents ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE public.parents ADD COLUMN IF NOT EXISTS email TEXT;

