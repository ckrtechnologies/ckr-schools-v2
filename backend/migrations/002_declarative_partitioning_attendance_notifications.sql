-- ============================================================================
-- CKR SCHOOLS V2 — MIGRATION 002: HIGH-SCALE DECLARATIVE PARTITIONING
-- Purpose: Manage Crores (10M–100M+) of rows for high-frequency tables:
--          1. public.attendance    -> Partitioned by RANGE (date)
--          2. public.notifications -> Partitioned by RANGE (created_at)
--          3. public.payments_ledger -> Partitioned by RANGE (created_at)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ATTENDANCE (Partitioned by Year / Date Range)
-- ============================================================================

DROP TABLE IF EXISTS public.attendance CASCADE;

CREATE TABLE public.attendance (
    id BIGSERIAL,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT DEFAULT 'Present', -- 'Present', 'Absent', 'Leave', 'Holiday'
    marked_by UUID REFERENCES public."user"(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, date),
    CONSTRAINT uq_tenant_attendance_user_date UNIQUE (tenant_id, user_id, date)
) PARTITION BY RANGE (date);

-- Yearly physical partitions:
CREATE TABLE public.attendance_2024 PARTITION OF public.attendance
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE public.attendance_2025 PARTITION OF public.attendance
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE public.attendance_2026 PARTITION OF public.attendance
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE TABLE public.attendance_2027 PARTITION OF public.attendance
    FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');

CREATE TABLE public.attendance_2028 PARTITION OF public.attendance
    FOR VALUES FROM ('2028-01-01') TO ('2029-01-01');

CREATE TABLE public.attendance_default PARTITION OF public.attendance DEFAULT;

-- High-speed composite indexes (automatically created across all partitions):
CREATE INDEX IF NOT EXISTS idx_attendance_tenant_date 
    ON public.attendance(tenant_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_tenant_user_date 
    ON public.attendance(tenant_id, user_id, date DESC);

-- ============================================================================
-- 2. NOTIFICATIONS (Partitioned by created_at TIMESTAMPTZ Range)
-- ============================================================================

DROP TABLE IF EXISTS public.notifications CASCADE;

CREATE TABLE public.notifications (
    id BIGSERIAL,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    title TEXT,
    message TEXT,
    type TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Yearly physical partitions:
CREATE TABLE public.notifications_2024 PARTITION OF public.notifications
    FOR VALUES FROM ('2024-01-01 00:00:00+00') TO ('2025-01-01 00:00:00+00');

CREATE TABLE public.notifications_2025 PARTITION OF public.notifications
    FOR VALUES FROM ('2025-01-01 00:00:00+00') TO ('2026-01-01 00:00:00+00');

CREATE TABLE public.notifications_2026 PARTITION OF public.notifications
    FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE public.notifications_2027 PARTITION OF public.notifications
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2028-01-01 00:00:00+00');

CREATE TABLE public.notifications_2028 PARTITION OF public.notifications
    FOR VALUES FROM ('2028-01-01 00:00:00+00') TO ('2029-01-01 00:00:00+00');

CREATE TABLE public.notifications_default PARTITION OF public.notifications DEFAULT;

-- High-speed composite indexes for unread badge queries & feeds:
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_user_unread 
    ON public.notifications(tenant_id, user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant_created 
    ON public.notifications(tenant_id, created_at DESC);

-- ============================================================================
-- 3. PAYMENTS LEDGER (Partitioned by created_at TIMESTAMPTZ Range)
-- ============================================================================

DROP TABLE IF EXISTS public.payments_ledger CASCADE;

CREATE TABLE public.payments_ledger (
    id BIGSERIAL,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    receipt_id BIGINT REFERENCES public.receipts(id) ON DELETE SET NULL,
    fee_id BIGINT REFERENCES public.fee(id) ON DELETE SET NULL,
    amount_paid NUMERIC DEFAULT 0,
    payment_mode TEXT,
    remarks TEXT,
    collected_by UUID REFERENCES public."user"(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Yearly physical partitions:
CREATE TABLE public.payments_ledger_2024 PARTITION OF public.payments_ledger
    FOR VALUES FROM ('2024-01-01 00:00:00+00') TO ('2025-01-01 00:00:00+00');

CREATE TABLE public.payments_ledger_2025 PARTITION OF public.payments_ledger
    FOR VALUES FROM ('2025-01-01 00:00:00+00') TO ('2026-01-01 00:00:00+00');

CREATE TABLE public.payments_ledger_2026 PARTITION OF public.payments_ledger
    FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE public.payments_ledger_2027 PARTITION OF public.payments_ledger
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2028-01-01 00:00:00+00');

CREATE TABLE public.payments_ledger_2028 PARTITION OF public.payments_ledger
    FOR VALUES FROM ('2028-01-01 00:00:00+00') TO ('2029-01-01 00:00:00+00');

CREATE TABLE public.payments_ledger_default PARTITION OF public.payments_ledger DEFAULT;

CREATE INDEX IF NOT EXISTS idx_payments_ledger_tenant_student 
    ON public.payments_ledger(tenant_id, student_id, created_at DESC);

COMMIT;

