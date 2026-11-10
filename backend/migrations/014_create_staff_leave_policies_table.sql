-- Migration: 014_create_staff_leave_policies_table.sql
-- Description: Creates school-wide staff leave policies and quota configurations per academic year

CREATE TABLE IF NOT EXISTS public.staff_leave_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    academic_year VARCHAR(20) NOT NULL DEFAULT '2026-27',
    casual_leave_annual INTEGER NOT NULL DEFAULT 12,
    sick_leave_annual INTEGER NOT NULL DEFAULT 10,
    earned_leave_annual INTEGER NOT NULL DEFAULT 15,
    max_consecutive_days INTEGER NOT NULL DEFAULT 3,
    require_doc_for_sick_days INTEGER NOT NULL DEFAULT 2,
    notice_days_casual INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_staff_leave_policy_tenant_year UNIQUE (tenant_id, academic_year)
);

CREATE INDEX IF NOT EXISTS idx_staff_leave_policies_tenant_year 
    ON public.staff_leave_policies(tenant_id, academic_year);

