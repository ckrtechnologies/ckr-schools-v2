-- ============================================================================
-- 005: SUBJECT MARKS DISTRIBUTION (ACADEMIC MANAGER)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subject_marks_distribution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    academic_year VARCHAR(30) DEFAULT '2026-27',
    class_id UUID NOT NULL REFERENCES public.class(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subject(id) ON DELETE CASCADE,
    term VARCHAR(100) NOT NULL,
    total_marks NUMERIC NOT NULL DEFAULT 100,
    components JSONB DEFAULT '[]'::jsonb,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tenant_class_subject_term_year UNIQUE (tenant_id, class_id, subject_id, term, academic_year)
);

CREATE INDEX IF NOT EXISTS idx_smd_tenant ON public.subject_marks_distribution(tenant_id, class_id, subject_id);

