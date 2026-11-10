-- Migration 012: Remove start_date and end_date from academic_terms
ALTER TABLE public.academic_terms 
DROP COLUMN IF EXISTS start_date,
DROP COLUMN IF EXISTS end_date;

