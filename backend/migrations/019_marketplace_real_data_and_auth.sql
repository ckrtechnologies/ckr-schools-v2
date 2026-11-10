-- Marketplace real-data + authenticated reviews
-- Removes fabricated profile defaults and adds reviewer account columns.

ALTER TABLE public.marketplace_school_profiles
    ALTER COLUMN admission_status DROP DEFAULT,
    ALTER COLUMN student_count_badge DROP DEFAULT,
    ALTER COLUMN teacher_count_badge DROP DEFAULT,
    ALTER COLUMN student_teacher_ratio DROP DEFAULT,
    ALTER COLUMN grades_offered DROP DEFAULT,
    ALTER COLUMN is_verified SET DEFAULT FALSE;

ALTER TABLE public.marketplace_reviews
    ADD COLUMN IF NOT EXISTS reviewer_account_id UUID,
    ADD COLUMN IF NOT EXISTS reviewer_account_type VARCHAR(20),
    ADD COLUMN IF NOT EXISTS reviewer_school_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS uq_marketplace_reviews_account_school
    ON public.marketplace_reviews (tenant_id, reviewer_account_id)
    WHERE reviewer_account_id IS NOT NULL;
