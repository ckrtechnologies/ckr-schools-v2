-- Migration 020: School SPOC (public-domain) portal
-- Moves marketplace/public-domain management out of the school operations portal into
-- its own SPOC surface: publish control, review replies/escalation, gallery curation,
-- press releases and transferred leads.
--
-- Roles: SPOC users live in public."user" with type = 'spoc' (TEXT column, no enum change
-- required). JWT payload carries type='spoc', role='spoc', schoolId=<tenant id>.

-- 1. Publish control on the marketplace profile
ALTER TABLE public.marketplace_school_profiles
    ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS published_by UUID;

-- 2. School reply + escalation on parent reviews
ALTER TABLE public.marketplace_reviews
    ADD COLUMN IF NOT EXISTS school_reply TEXT,
    ADD COLUMN IF NOT EXISTS school_replied_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS school_replied_by UUID,
    ADD COLUMN IF NOT EXISTS is_reported BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS report_reason TEXT,
    ADD COLUMN IF NOT EXISTS reported_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_mkt_reviews_tenant_reported
    ON public.marketplace_reviews (tenant_id, is_reported);

-- 3. Gallery curation: which campus photos are allowed on the public listing
ALTER TABLE public.school_gallery
    ADD COLUMN IF NOT EXISTS is_marketplace_visible BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_gallery_tenant_visible
    ON public.school_gallery (tenant_id, is_marketplace_visible);

-- 4. Press releases authored from the SPOC portal
ALTER TABLE public.marketplace_press_releases
    ADD COLUMN IF NOT EXISTS created_by UUID;

-- 5. Backfill: profiles already live on the marketplace keep their published state
UPDATE public.marketplace_school_profiles
SET published_at = COALESCE(published_at, updated_at, NOW())
WHERE is_published = TRUE AND published_at IS NULL;

SELECT 'Migration 020 applied successfully' AS status;
