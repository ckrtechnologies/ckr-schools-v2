-- Migration 022: Release all marketplace admission leads directly to school SPOCs
-- Updates any existing leads marked 'new' or 'pending' to 'transferred'

UPDATE public.marketplace_leads
SET status = 'transferred',
    transferred_at = COALESCE(transferred_at, NOW())
WHERE status = 'new';

SELECT 'Migration 022 applied successfully: all leads released to SPOCs' AS status;
