-- Create dedicated erp_leads table for institutional ERP sales
CREATE TABLE IF NOT EXISTS public.erp_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name VARCHAR(255) NOT NULL,
  city VARCHAR(100),
  contact_person VARCHAR(255) NOT NULL,
  designation VARCHAR(100),
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  student_strength VARCHAR(50),
  interested_modules JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(50) DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_erp_leads_created_at ON public.erp_leads(created_at DESC);
