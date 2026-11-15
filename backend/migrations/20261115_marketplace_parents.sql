-- Create marketplace_parents table for public parent signup & login
CREATE TABLE IF NOT EXISTS public.marketplace_parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255),
  password_hash TEXT NOT NULL,
  city VARCHAR(100),
  child_grade VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_parents_phone ON public.marketplace_parents(phone);
