-- Migration: Create puja_banners table for Puja screen hero headers
-- Date: 2026-06-02

-- Create puja_banners table
CREATE TABLE IF NOT EXISTS public.puja_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  small_title TEXT NOT NULL DEFAULT 'MANTRAPUJA',
  main_title TEXT NOT NULL DEFAULT 'DEALS',
  subtitle TEXT NOT NULL DEFAULT 'Divine blessing packs starting at ₹29',
  button_text TEXT NOT NULL DEFAULT 'BOOK NOW',
  image_url TEXT,
  gradient_start TEXT NOT NULL DEFAULT '#f97316',
  gradient_end TEXT NOT NULL DEFAULT '#ea580c',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.puja_banners ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
DROP POLICY IF EXISTS "Allow public read access" ON public.puja_banners;
CREATE POLICY "Allow public read access" ON public.puja_banners FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow auth all access" ON public.puja_banners;
CREATE POLICY "Allow auth all access" ON public.puja_banners FOR ALL USING (true) WITH CHECK (true);

-- Register Trigger for updated_at tracking
DROP TRIGGER IF EXISTS set_timestamp_puja_banners ON public.puja_banners;
CREATE TRIGGER set_timestamp_puja_banners BEFORE UPDATE ON public.puja_banners
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Add Table to Supabase Realtime Publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'puja_banners'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.puja_banners;
  END IF;
END
$$;
