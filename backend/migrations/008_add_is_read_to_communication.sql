-- ============================================================================
-- 008: ADD IS_READ TO COMMUNICATION
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'communication' 
          AND column_name = 'is_read'
    ) THEN
        ALTER TABLE public.communication ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

