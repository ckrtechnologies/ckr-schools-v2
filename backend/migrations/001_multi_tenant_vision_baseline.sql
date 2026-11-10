-- ============================================================================
-- CKR SCHOOLS V2 — BASELINE MULTI-TENANT VISION ERP & MARKETPLACE SCHEMA
-- Migration: 001_multi_tenant_vision_baseline.sql
--
-- Blueprint: 
--   1. 100% Schema, table and column parity with Vision International School ERP
--   2. Multi-Tenant isolation engine (tenants table + tenant_id UUID references)
--   3. Direct PostgreSQL execution (Pure pg.Pool / PgBouncer, zero Supabase SDK)
--   4. Public School Marketplace & Enquiry Bridge tables
-- ============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 0. MULTI-TENANT ENGINE & SUPER ADMIN (From CKR Platform Architecture)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(60) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    affiliation_board VARCHAR(50) DEFAULT 'CBSE', -- 'CBSE', 'ICSE', 'STATE_BOARD', 'CAMBRIDGE', 'IB'
    board_affiliation_number VARCHAR(100),
    school_code VARCHAR(50),
    official_email VARCHAR(150),
    official_phone VARCHAR(20),
    website VARCHAR(150),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode CHAR(6),
    logo_url TEXT,
    theme_color VARCHAR(30) DEFAULT '#1e40af',
    accent_color VARCHAR(30) DEFAULT '#3b82f6',
    motto TEXT,
    plan_tier VARCHAR(30) DEFAULT 'GROWTH_CAMPUS', -- 'FREE_TRIAL', 'GROWTH_CAMPUS', 'PRO_CAMPUS', 'ENTERPRISE_AI'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON public.tenants(is_active);

-- ============================================================================
-- 1. MARKETPLACE & PUBLIC DISCOVERY (Parent Website & Enquiry Funnel)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.marketplace_school_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
    tagline TEXT,
    about TEXT,
    established_year INTEGER,
    min_fee NUMERIC DEFAULT 0,
    max_fee NUMERIC DEFAULT 0,
    fee_period VARCHAR(30) DEFAULT 'ANNUAL',
    grades_offered VARCHAR(100) DEFAULT 'Nursery to XII',
    facilities JSONB DEFAULT '[]'::jsonb,
    gallery_images JSONB DEFAULT '[]'::jsonb,
    brochure_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT TRUE,
    avg_rating NUMERIC(3,2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_tenant ON public.marketplace_school_profiles(tenant_id);

CREATE TABLE IF NOT EXISTS public.marketplace_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    reviewer_name VARCHAR(150) NOT NULL,
    reviewer_email VARCHAR(150),
    reviewer_phone VARCHAR(20),
    relationship VARCHAR(50) DEFAULT 'Parent',
    overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    academics_rating INTEGER CHECK (academics_rating BETWEEN 1 AND 5),
    infrastructure_rating INTEGER CHECK (infrastructure_rating BETWEEN 1 AND 5),
    faculty_rating INTEGER CHECK (faculty_rating BETWEEN 1 AND 5),
    safety_rating INTEGER CHECK (safety_rating BETWEEN 1 AND 5),
    value_for_money_rating INTEGER CHECK (value_for_money_rating BETWEEN 1 AND 5),
    title VARCHAR(255),
    review_text TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE, -- Admin moderation gate
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_tenant ON public.marketplace_reviews(tenant_id, is_approved);

-- ============================================================================
-- 2. CORE USERS & ACCESS (Vision "user" table + Multi-Tenant Scoping)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public."user" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE, -- NULL only for Platform Super Admin
    name TEXT,
    email TEXT,
    phone TEXT,
    password_hash TEXT, -- Stored directly for pure pg.Pool JWT auth (no Supabase Auth SDK)
    type TEXT DEFAULT 'student', -- 'admin', 'principal', 'teacher', 'student', 'parent', 'accountant', 'admission', 'tc'
    gender TEXT,
    dob DATE,
    status TEXT DEFAULT 'active',
    avatar_url TEXT,
    address TEXT,
    admission_number TEXT,
    house TEXT,
    father_name TEXT,
    mother_name TEXT,
    monthly_fee NUMERIC DEFAULT 0,
    bus_fee NUMERIC DEFAULT 0,
    bus_start_date DATE,
    fee_exempted BOOLEAN DEFAULT FALSE,
    admission_date DATE,
    form_submitted BOOLEAN DEFAULT FALSE,
    leave_school BOOLEAN DEFAULT FALSE,
    tc_received BOOLEAN DEFAULT FALSE,
    tc_date DATE,
    slc_received BOOLEAN DEFAULT FALSE,
    slc_date DATE,
    character_certificate_received BOOLEAN DEFAULT FALSE,
    character_certificate_date DATE,
    tc_document_url TEXT,
    slc_document_url TEXT,
    character_certificate_document_url TEXT,
    can_view_revenue BOOLEAN DEFAULT FALSE,
    weekly_quota INTEGER DEFAULT NULL,
    complaints JSONB DEFAULT '[]'::jsonb,
    alternate_number TEXT,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_tenant_type ON public."user"(tenant_id, type);
CREATE INDEX IF NOT EXISTS idx_user_tenant_email ON public."user"(tenant_id, LOWER(email));
CREATE INDEX IF NOT EXISTS idx_user_tenant_admission ON public."user"(tenant_id, admission_number);

-- ============================================================================
-- 3. ADMISSION INQUIRIES & LEADS (Vision "newUsers" table)
--    Note: Marketplace enquiries insert directly into this table!
-- ============================================================================

CREATE TABLE IF NOT EXISTS public."newUsers" (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    parent TEXT,
    "parentEmail" TEXT,
    phone TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'enquiry'
    dob DATE,
    gender TEXT,
    documents JSONB DEFAULT '[]'::jsonb,
    assigned_to UUID REFERENCES public."user"(id) ON DELETE SET NULL,
    class_id UUID,
    avatar_url TEXT,
    house TEXT,
    bus_fee NUMERIC,
    monthly_fee NUMERIC,
    fee_exempted BOOLEAN,
    admission_date DATE,
    address TEXT,
    -- Migration 004 fields:
    academic_year TEXT,
    prev_school TEXT,
    prev_board TEXT,
    father_name TEXT,
    father_occupation TEXT,
    father_mobile TEXT,
    mother_name TEXT,
    mother_occupation TEXT,
    mother_mobile TEXT,
    alternate_phone TEXT,
    referral_source TEXT DEFAULT 'Marketplace', -- 'Marketplace', 'Friends / Relatives', 'Social Media', 'Advertisement', 'Other'
    preferred_visit_date DATE,
    enquiry_remarks TEXT,
    school_tour_status TEXT DEFAULT 'Pending',
    principal_meet_status TEXT DEFAULT 'Pending',
    follow_up_date DATE,
    office_remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newusers_tenant_status ON public."newUsers"(tenant_id, status);

-- ============================================================================
-- 4. PARENTS & FAMILY CONNECTIONS (Vision "parents" & "student_parents")
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    father_name TEXT,
    mother_name TEXT,
    phone TEXT,
    alternate_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parents_tenant ON public.parents(tenant_id);

CREATE TABLE IF NOT EXISTS public.student_parents (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tenant_student_parent UNIQUE (tenant_id, parent_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_student_parents_tenant ON public.student_parents(tenant_id);

CREATE TABLE IF NOT EXISTS public.user_connections (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_connections_tenant ON public.user_connections(tenant_id);

-- ============================================================================
-- 5. ACADEMIC STRUCTURE: CLASSES, SUBJECTS & WORKLOAD
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.class (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    section TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tenant_class_section UNIQUE (tenant_id, name, section)
);

CREATE INDEX IF NOT EXISTS idx_class_tenant ON public.class(tenant_id);

CREATE TABLE IF NOT EXISTS public.class_students (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.class(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tenant_class_student UNIQUE (tenant_id, class_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_class_students_tenant ON public.class_students(tenant_id, class_id);

CREATE TABLE IF NOT EXISTS public.subject (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tenant_subject_name UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_subject_tenant ON public.subject(tenant_id);

CREATE TABLE IF NOT EXISTS public.class_subjects (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.class(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subject(id) ON DELETE CASCADE,
    weekly_quota INTEGER DEFAULT NULL,
    is_lab_required BOOLEAN NOT NULL DEFAULT FALSE,
    allow_double_period BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tenant_class_subject UNIQUE (tenant_id, class_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_class_subjects_tenant ON public.class_subjects(tenant_id, class_id);

CREATE TABLE IF NOT EXISTS public.class_teachers (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.class(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tenant_class_teacher UNIQUE (tenant_id, class_id)
);

CREATE INDEX IF NOT EXISTS idx_class_teachers_tenant ON public.class_teachers(tenant_id);

CREATE TABLE IF NOT EXISTS public.subject_teachers (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subject(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.class(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tenant_subject_teacher_class UNIQUE (tenant_id, subject_id, class_id)
);

CREATE INDEX IF NOT EXISTS idx_subject_teachers_tenant ON public.subject_teachers(tenant_id, class_id);

CREATE TABLE IF NOT EXISTS public.rooms (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    capacity INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_tenant ON public.rooms(tenant_id);

-- ============================================================================
-- 6. ATTENDANCE & ANNUAL PLANNER
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.attendance (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT, -- 'Present', 'Absent', 'Leave', 'Holiday'
    marked_by UUID REFERENCES public."user"(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tenant_attendance_user_date UNIQUE (tenant_id, user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_tenant_date ON public.attendance(tenant_id, date);

CREATE TABLE IF NOT EXISTS public.annual_planner (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'HOLIDAY', 'EXAM', 'EVENT', 'SPORTS', 'MEETING'
    target_classes JSONB DEFAULT '["All"]'::jsonb,
    requires_consent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_annual_planner_tenant ON public.annual_planner(tenant_id, start_date);

-- ============================================================================
-- 7. TIMETABLE, SETTINGS & DAILY PROXIES (Vision 005 & 006 Migrations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.timetable_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    school_start_time TEXT NOT NULL DEFAULT '08:00 AM',
    period_duration_minutes INTEGER NOT NULL DEFAULT 50,
    assembly_duration_minutes INTEGER NOT NULL DEFAULT 20,
    recess_after_period INTEGER NOT NULL DEFAULT 4,
    recess_duration_minutes INTEGER NOT NULL DEFAULT 20,
    lunch_after_period INTEGER NOT NULL DEFAULT 6,
    lunch_duration_minutes INTEGER NOT NULL DEFAULT 40,
    periods_per_day INTEGER NOT NULL DEFAULT 8,
    saturday_periods INTEGER NOT NULL DEFAULT 5,
    max_daily_subject_periods INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_timetable_settings UNIQUE (tenant_id, academic_year)
);

CREATE INDEX IF NOT EXISTS idx_timetable_settings_tenant ON public.timetable_settings(tenant_id);

CREATE TABLE IF NOT EXISTS public.timetable (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.class(id) ON DELETE CASCADE,
    date DATE,
    day_of_week TEXT,
    teacher_id UUID REFERENCES public."user"(id) ON DELETE SET NULL,
    time_slot TEXT,
    subject TEXT,
    is_break BOOLEAN DEFAULT FALSE,
    room_number TEXT,
    teacher TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timetable_tenant_class ON public.timetable(tenant_id, class_id);

CREATE TABLE IF NOT EXISTS public.daily_proxy_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    period_index INTEGER NOT NULL CHECK (period_index BETWEEN 1 AND 12),
    time_slot TEXT NOT NULL,
    class_id UUID NOT NULL REFERENCES public.class(id) ON DELETE CASCADE,
    original_faculty_id UUID REFERENCES public."user"(id) ON DELETE SET NULL,
    substitute_faculty_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    subject TEXT,
    room_number TEXT,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public."user"(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_proxy_tenant_date ON public.daily_proxy_assignments(tenant_id, date);

-- ============================================================================
-- 8. COURSEWORK, HOMEWORK & PARENTAL CONSENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.course (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subject TEXT,
    class_id UUID REFERENCES public.class(id) ON DELETE CASCADE,
    chapter TEXT,
    duedate DATE,
    description TEXT,
    file_url TEXT,
    type TEXT DEFAULT 'assignment',
    date DATE,
    day TEXT,
    topics_taught TEXT,
    unit TEXT,
    lesson_no TEXT,
    page_number TEXT,
    others TEXT,
    homework TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_tenant_class ON public.course(tenant_id, class_id);

CREATE TABLE IF NOT EXISTS public.course_submissions (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    course_id BIGINT NOT NULL REFERENCES public.course(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tenant_course_submission UNIQUE (tenant_id, course_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_course_submissions_tenant ON public.course_submissions(tenant_id);

CREATE TABLE IF NOT EXISTS public.consents (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    class_id UUID REFERENCES public.class(id) ON DELETE CASCADE,
    event_date DATE,
    created_by UUID REFERENCES public."user"(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consents_tenant ON public.consents(tenant_id);

CREATE TABLE IF NOT EXISTS public.consent_responses (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    consent_id BIGINT NOT NULL REFERENCES public.consents(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tenant_consent_student UNIQUE (tenant_id, consent_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_consent_responses_tenant ON public.consent_responses(tenant_id);

CREATE TABLE IF NOT EXISTS public.event_consents (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    event_id BIGINT NOT NULL,
    student_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public."user"(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_consents_tenant ON public.event_consents(tenant_id);

-- ============================================================================
-- 9. EXAMS, GRADES & CO-SCHOLASTIC (Vision 007 Migration)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.exams (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    class_id UUID NOT NULL REFERENCES public.class(id) ON DELETE CASCADE,
    date DATE,
    "time" TEXT,
    subject TEXT,
    duration INTEGER,
    marks INTEGER,
    room_number TEXT,
    invigilator_id UUID REFERENCES public."user"(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exams_tenant_class ON public.exams(tenant_id, class_id);

CREATE TABLE IF NOT EXISTS public.grades (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    exam_id BIGINT NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    marks NUMERIC,
    max_marks NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tenant_grade_student_exam UNIQUE (tenant_id, student_id, exam_id)
);

CREATE INDEX IF NOT EXISTS idx_grades_tenant ON public.grades(tenant_id, exam_id);

CREATE TABLE IF NOT EXISTS public.grading_scales (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    grade TEXT NOT NULL,
    min_percentage NUMERIC NOT NULL,
    max_percentage NUMERIC NOT NULL,
    color_hex TEXT DEFAULT '#000000',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tenant_grade_scale UNIQUE (tenant_id, grade)
);

CREATE INDEX IF NOT EXISTS idx_grading_scales_tenant ON public.grading_scales(tenant_id);

CREATE TABLE IF NOT EXISTS public.co_scholastic_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.class(id) ON DELETE CASCADE,
    term VARCHAR(50) NOT NULL,
    academic_year VARCHAR(20) NOT NULL DEFAULT '2026-27',
    physical_education VARCHAR(10) NOT NULL DEFAULT 'A',
    discipline VARCHAR(10) NOT NULL DEFAULT 'A',
    work_education VARCHAR(10) NOT NULL DEFAULT 'A',
    art_education VARCHAR(10) NOT NULL DEFAULT 'A',
    gk VARCHAR(10) NOT NULL DEFAULT 'A',
    remarks TEXT,
    graded_by UUID REFERENCES public."user"(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_co_scholastic UNIQUE (tenant_id, student_id, term, academic_year)
);

CREATE INDEX IF NOT EXISTS idx_co_scholastic_tenant ON public.co_scholastic_grades(tenant_id, class_id);

-- ============================================================================
-- 10. FINANCE, FEES, RECEIPTS & LEDGERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.fee (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount NUMERIC DEFAULT 0,
    due_date DATE,
    fee_type TEXT DEFAULT 'Monthly',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fee_tenant ON public.fee(tenant_id);

CREATE TABLE IF NOT EXISTS public.fee_structures (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    fee_category TEXT NOT NULL,
    class_name TEXT,
    amount NUMERIC DEFAULT 0 NOT NULL,
    academic_year TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tenant_fee_structure UNIQUE (tenant_id, fee_category, class_name, academic_year)
);

CREATE INDEX IF NOT EXISTS idx_fee_structures_tenant ON public.fee_structures(tenant_id);

CREATE TABLE IF NOT EXISTS public.student_fees (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    fee_id BIGINT NOT NULL REFERENCES public.fee(id) ON DELETE CASCADE,
    payment_status TEXT DEFAULT 'Unpaid', -- 'Unpaid', 'Paid', 'Partial'
    total_paid_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tenant_student_fee UNIQUE (tenant_id, student_id, fee_id)
);

CREATE INDEX IF NOT EXISTS idx_student_fees_tenant ON public.student_fees(tenant_id, student_id);

CREATE TABLE IF NOT EXISTS public.receipts (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    receipt_number INTEGER NOT NULL,
    student_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    total_amount NUMERIC DEFAULT 0,
    payment_mode TEXT,
    remarks TEXT,
    collected_by UUID REFERENCES public."user"(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tenant_receipt_number UNIQUE (tenant_id, receipt_number)
);

CREATE INDEX IF NOT EXISTS idx_receipts_tenant ON public.receipts(tenant_id, student_id);

CREATE TABLE IF NOT EXISTS public.payments_ledger (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    receipt_id BIGINT REFERENCES public.receipts(id) ON DELETE SET NULL,
    fee_id BIGINT REFERENCES public.fee(id) ON DELETE SET NULL,
    amount_paid NUMERIC DEFAULT 0,
    payment_mode TEXT,
    remarks TEXT,
    collected_by UUID REFERENCES public."user"(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_ledger_tenant ON public.payments_ledger(tenant_id, student_id);

CREATE TABLE IF NOT EXISTS public.transaction_categories (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Income', 'Expense'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tenant_transaction_category UNIQUE (tenant_id, name, type)
);

CREATE INDEX IF NOT EXISTS idx_trans_cat_tenant ON public.transaction_categories(tenant_id);

CREATE TABLE IF NOT EXISTS public.transactions (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'Income', 'Expense'
    category_id BIGINT REFERENCES public.transaction_categories(id) ON DELETE SET NULL,
    amount NUMERIC DEFAULT 0 NOT NULL,
    transaction_date DATE NOT NULL,
    description TEXT,
    payment_method TEXT,
    reference_number TEXT,
    logged_by UUID REFERENCES public."user"(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_tenant ON public.transactions(tenant_id, transaction_date);

-- ============================================================================
-- 11. CBSE TRANSFER CERTIFICATES (Vision 003 Migration)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.transfer_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    tc_number VARCHAR(50) NOT NULL,
    student_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.class(id) ON DELETE SET NULL,
    issued_by UUID REFERENCES public."user"(id) ON DELETE SET NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    application_date DATE NOT NULL DEFAULT CURRENT_DATE,
    pupil_name VARCHAR(255) NOT NULL,
    mother_name VARCHAR(255),
    father_name VARCHAR(255),
    dob DATE,
    dob_words VARCHAR(255),
    birth_place VARCHAR(255),
    nationality VARCHAR(50) DEFAULT 'Indian',
    category VARCHAR(100),
    first_admission_date DATE,
    first_admission_class VARCHAR(50),
    last_studied_class_figure VARCHAR(20),
    last_studied_class_words VARCHAR(50),
    annual_exam_result VARCHAR(255),
    failed_status VARCHAR(50) DEFAULT 'NA',
    subjects_studied TEXT,
    qualified_for_promotion VARCHAR(50) DEFAULT 'Yes',
    promotion_class_figure VARCHAR(20),
    promotion_class_words VARCHAR(50),
    dues_paid_month VARCHAR(100),
    fee_concession VARCHAR(255) DEFAULT 'NA',
    total_working_days INT DEFAULT 0,
    days_present INT DEFAULT 0,
    ncc_scout VARCHAR(100) DEFAULT 'NA',
    extra_curricular TEXT,
    general_conduct VARCHAR(50) DEFAULT 'Good',
    reason_for_leaving VARCHAR(255),
    remarks TEXT,
    status VARCHAR(30) DEFAULT 'ISSUED', -- 'DRAFT', 'ISSUED', 'CANCELLED'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tenant_tc_number UNIQUE (tenant_id, tc_number)
);

CREATE INDEX IF NOT EXISTS idx_tc_tenant_student ON public.transfer_certificates(tenant_id, student_id);

-- ============================================================================
-- 12. COMMUNICATION, NOTICES, COMPLAINTS & NOTIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.circulars (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    attachment_url TEXT,
    target_audience TEXT DEFAULT 'all',
    class_id UUID REFERENCES public.class(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public."user"(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_circulars_tenant ON public.circulars(tenant_id);

CREATE TABLE IF NOT EXISTS public.communication (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public."user"(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public."user"(id) ON DELETE CASCADE,
    message TEXT,
    type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_communication_tenant ON public.communication(tenant_id, sender_id, receiver_id);

CREATE TABLE IF NOT EXISTS public.complaints (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public."user"(id) ON DELETE CASCADE,
    date DATE,
    description TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaints_tenant ON public.complaints(tenant_id);

CREATE TABLE IF NOT EXISTS public.notifications (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    title TEXT,
    message TEXT,
    type TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON public.notifications(tenant_id, user_id);

CREATE TABLE IF NOT EXISTS public.user_device_tokens (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    fcm_token TEXT NOT NULL,
    device_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_tenant ON public.user_device_tokens(tenant_id, user_id);

CREATE TABLE IF NOT EXISTS public.activities (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    title TEXT,
    message TEXT,
    type TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_tenant ON public.activities(tenant_id, user_id);

-- ============================================================================
-- 13. STAFF DETAILS & ROLES RESPONSIBILITIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.staff_details (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    access_level TEXT,
    job_title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tenant_staff_user UNIQUE (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_details_tenant ON public.staff_details(tenant_id);

CREATE TABLE IF NOT EXISTS public.teacher_details (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    doj DATE,
    father_spouse_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tenant_teacher_user UNIQUE (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_details_tenant ON public.teacher_details(tenant_id);

CREATE TABLE IF NOT EXISTS public.staff_responsibilities (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    role_title TEXT NOT NULL,
    duties TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_resp_tenant ON public.staff_responsibilities(tenant_id);

-- ============================================================================
-- 14. SCHOOL BRANDING, SPOTLIGHTS, NEWSLETTERS & COMMUNITY
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.school_settings (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
    instagram_url TEXT,
    whatsapp_url TEXT,
    linkedin_url TEXT,
    twitter_url TEXT,
    facebook_url TEXT,
    youtube_url TEXT,
    website_url TEXT,
    late_fee_penalty NUMERIC DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.spotlight_of_the_day (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spotlight_tenant ON public.spotlight_of_the_day(tenant_id, date);

CREATE TABLE IF NOT EXISTS public.student_of_the_week (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.class(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    reason TEXT,
    metrics JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_of_the_week_tenant ON public.student_of_the_week(tenant_id);

CREATE TABLE IF NOT EXISTS public.thought_of_the_day (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    thought TEXT NOT NULL,
    author TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_thought_tenant ON public.thought_of_the_day(tenant_id, date);

CREATE TABLE IF NOT EXISTS public.school_champions (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public."user"(id) ON DELETE SET NULL,
    game_name TEXT,
    achievement_level TEXT,
    marks_score TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_champions_tenant ON public.school_champions(tenant_id);

CREATE TABLE IF NOT EXISTS public.school_gallery (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    image_url TEXT,
    title TEXT,
    description TEXT,
    media_type TEXT,
    media_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_tenant ON public.school_gallery(tenant_id);

CREATE TABLE IF NOT EXISTS public.school_newsletters (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    document_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletters_tenant ON public.school_newsletters(tenant_id);

COMMIT;

