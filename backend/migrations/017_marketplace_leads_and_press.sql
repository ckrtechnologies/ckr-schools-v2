-- Migration 017: Marketplace Centralized Lead Monetization Engine & Press Releases
-- CKR Technologies — Multi-Tenant Educational SaaS

-- 1. Create marketplace_leads (Super Admin Central Lead Engine)
CREATE TABLE IF NOT EXISTS public.marketplace_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    lead_type VARCHAR(50) NOT NULL DEFAULT 'enquiry', -- 'enquiry', 'brochure_download', 'comparison', 'multi_enquiry'
    student_name VARCHAR(150),
    parent_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    grade VARCHAR(50),
    academic_year VARCHAR(20) DEFAULT '2026-2027',
    message TEXT,
    compared_tenant_ids JSONB DEFAULT '[]'::jsonb, -- Array of tenant UUIDs if multi-school enquiry or comparison lead
    is_multi_enquiry BOOLEAN DEFAULT FALSE,
    status VARCHAR(30) DEFAULT 'new', -- 'new', 'qualified', 'school_contacted', 'transferred', 'archived'
    monetization_fee_paise BIGINT DEFAULT 0, -- Fee in paise e.g. 50000 = Rs. 500
    admin_notes TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mkt_leads_tenant ON public.marketplace_leads(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_mkt_leads_created ON public.marketplace_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mkt_leads_phone ON public.marketplace_leads(phone);

-- 2. Create marketplace_press_releases (Public School Newsroom)
CREATE TABLE IF NOT EXISTS public.marketplace_press_releases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    content_html TEXT NOT NULL,
    featured_image_url TEXT,
    category VARCHAR(50) DEFAULT 'General', -- 'General', 'Academics', 'Sports', 'Event', 'Achievement'
    published_date DATE DEFAULT CURRENT_DATE,
    source_circular_id UUID,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mkt_press_tenant ON public.marketplace_press_releases(tenant_id, is_published);

-- 3. Enhance marketplace_school_profiles with live status & badges
ALTER TABLE public.marketplace_school_profiles 
    ADD COLUMN IF NOT EXISTS admission_status VARCHAR(50) DEFAULT 'Admissions Open (2026-27)',
    ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
    ADD COLUMN IF NOT EXISTS student_count_badge VARCHAR(50) DEFAULT '1,000+ Students',
    ADD COLUMN IF NOT EXISTS teacher_count_badge VARCHAR(50) DEFAULT '50+ Certified Faculty',
    ADD COLUMN IF NOT EXISTS student_teacher_ratio VARCHAR(20) DEFAULT '20:1';

-- 4. Enhance marketplace_reviews with helpful_count
ALTER TABLE public.marketplace_reviews 
    ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;

