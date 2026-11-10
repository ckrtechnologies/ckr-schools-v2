-- ============================================================================
-- 003: ADD UNIQUE CONSTRAINT TO user_device_tokens
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'uq_tenant_user_device_token'
    ) THEN
        ALTER TABLE public.user_device_tokens
        ADD CONSTRAINT uq_tenant_user_device_token UNIQUE (tenant_id, user_id, fcm_token);
    END IF;
END $$;

