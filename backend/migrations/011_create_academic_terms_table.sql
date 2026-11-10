-- Migration 011: Create academic_terms table for Examination & Academic Manager Term Management
CREATE TABLE IF NOT EXISTS public.academic_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  academic_year VARCHAR(20) NOT NULL DEFAULT '2026-27',
  start_date DATE,
  end_date DATE,
  weightage_percent NUMERIC(5,2) DEFAULT 50.00,
  display_order INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_tenant_term_year UNIQUE (tenant_id, name, academic_year)
);

CREATE INDEX IF NOT EXISTS idx_academic_terms_tenant_year 
ON public.academic_terms (tenant_id, academic_year, display_order);

-- Seed standard terms for existing tenants if not already present
INSERT INTO public.academic_terms (tenant_id, name, academic_year, weightage_percent, display_order)
SELECT t.id, term_name, '2026-27', weight, ord
FROM public.tenants t
CROSS JOIN (
  VALUES 
    ('Term 1', 50.00, 1),
    ('Term 2', 50.00, 2),
    ('Unit Test 1', 10.00, 3),
    ('Unit Test 2', 10.00, 4)
) AS default_terms(term_name, weight, ord)
ON CONFLICT (tenant_id, name, academic_year) DO NOTHING;

