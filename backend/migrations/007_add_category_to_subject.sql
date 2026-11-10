-- ============================================================================
-- 007: ADD CATEGORY TO SUBJECT
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'subject' 
          AND column_name = 'category'
    ) THEN
        ALTER TABLE public.subject ADD COLUMN category VARCHAR(100) DEFAULT 'Scholastic';
    END IF;
END $$;

