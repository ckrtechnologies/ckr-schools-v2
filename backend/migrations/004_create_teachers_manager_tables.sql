-- ============================================================================
-- 004: TEACHER SCORING PARAMETERS & MONTHLY EVALUATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.teacher_scoring_parameters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    code VARCHAR(100),
    min_points NUMERIC DEFAULT 0,
    max_points NUMERIC DEFAULT 3,
    display_order INTEGER DEFAULT 0,
    academic_year VARCHAR(30) DEFAULT '2026-27',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tsp_tenant ON public.teacher_scoring_parameters(tenant_id, academic_year);

CREATE TABLE IF NOT EXISTS public.teacher_monthly_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    month VARCHAR(30) NOT NULL,
    academic_year VARCHAR(30) DEFAULT '2026-27',
    scores JSONB DEFAULT '{}'::jsonb,
    max_possible NUMERIC DEFAULT 0,
    total_score NUMERIC DEFAULT 0,
    percentage NUMERIC DEFAULT 0,
    rank INTEGER,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tenant_teacher_month_year UNIQUE (tenant_id, teacher_id, month, academic_year)
);

CREATE INDEX IF NOT EXISTS idx_tme_tenant ON public.teacher_monthly_evaluations(tenant_id, month, academic_year);

