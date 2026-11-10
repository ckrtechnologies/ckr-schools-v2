-- ============================================================================
-- CKR SCHOOLS V2 — MIGRATION 013: STAFF / TEACHER ATTENDANCE & LEAVES
-- ============================================================================

BEGIN;

-- 1. STAFF ATTENDANCE
CREATE TABLE IF NOT EXISTS public.staff_attendance (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Present' 
        CHECK (status IN ('Present', 'Absent', 'Half Day', 'Leave', 'Holiday', 'Late')),
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    source TEXT DEFAULT 'self_app' CHECK (source IN ('self_app', 'admin_override', 'biometric', 'system_leave')),
    marked_by UUID REFERENCES public."user"(id) ON DELETE SET NULL,
    remarks TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tenant_staff_attendance_date UNIQUE (tenant_id, staff_id, date)
);

CREATE INDEX IF NOT EXISTS idx_staff_att_tenant_date 
    ON public.staff_attendance(tenant_id, date);
CREATE INDEX IF NOT EXISTS idx_staff_att_tenant_staff 
    ON public.staff_attendance(tenant_id, staff_id, date);

-- 2. STAFF LEAVE BALANCES
CREATE TABLE IF NOT EXISTS public.staff_leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    academic_year VARCHAR(30) NOT NULL DEFAULT '2026-27',
    casual_leave_total NUMERIC DEFAULT 12,
    casual_leave_used NUMERIC DEFAULT 0,
    sick_leave_total NUMERIC DEFAULT 10,
    sick_leave_used NUMERIC DEFAULT 0,
    earned_leave_total NUMERIC DEFAULT 15,
    earned_leave_used NUMERIC DEFAULT 0,
    unpaid_leave_used NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tenant_staff_leave_balance UNIQUE (tenant_id, staff_id, academic_year)
);

CREATE INDEX IF NOT EXISTS idx_staff_leave_bal_tenant 
    ON public.staff_leave_balances(tenant_id, staff_id);

-- 3. STAFF LEAVE APPLICATIONS
CREATE TABLE IF NOT EXISTS public.staff_leave_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('Casual Leave', 'Sick Leave', 'Earned Leave', 'Unpaid Leave', 'Half Day')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count NUMERIC NOT NULL DEFAULT 1,
    reason TEXT NOT NULL,
    attachment_url TEXT,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
    reviewed_by UUID REFERENCES public."user"(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    admin_remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_leave_apps_tenant 
    ON public.staff_leave_applications(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_staff_leave_apps_staff 
    ON public.staff_leave_applications(tenant_id, staff_id, created_at DESC);

COMMIT;

