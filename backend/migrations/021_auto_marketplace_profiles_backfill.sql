-- Migration 021: Backfill marketplace profiles for all existing tenants
-- Ensures every active tenant has a published profile in public.marketplace_school_profiles

INSERT INTO public.marketplace_school_profiles (
    tenant_id,
    tagline,
    about,
    is_published,
    is_verified,
    grades_offered
)
SELECT 
    t.id,
    COALESCE(t.motto, 'Empowering excellence at ' || t.name),
    'Welcome to ' || t.name || ', affiliated with ' || COALESCE(t.affiliation_board, 'CBSE') || '. Providing holistic education and campus excellence.',
    TRUE,
    TRUE,
    'Nursery to XII'
FROM public.tenants t
LEFT JOIN public.marketplace_school_profiles mp ON t.id = mp.tenant_id
WHERE mp.id IS NULL
ON CONFLICT (tenant_id) DO NOTHING;

SELECT 'Migration 021 applied successfully' AS status;
