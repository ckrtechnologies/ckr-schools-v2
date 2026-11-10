-- ============================================================================
-- 006: ADD ROLL NUMBER TO CLASS STUDENTS
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'class_students' 
          AND column_name = 'roll_number'
    ) THEN
        ALTER TABLE public.class_students ADD COLUMN roll_number VARCHAR(50);
    END IF;
END $$;

