-- Migration 010: Align complaints schema with Vision contracts
ALTER TABLE public.complaints 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public."user"(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Disciplinary';

-- Backfill user_id / student_id parity
UPDATE public.complaints SET user_id = student_id WHERE user_id IS NULL AND student_id IS NOT NULL;
UPDATE public.complaints SET student_id = user_id WHERE student_id IS NULL AND user_id IS NOT NULL;

