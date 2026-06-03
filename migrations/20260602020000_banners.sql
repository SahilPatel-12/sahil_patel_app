-- Migration: Create banners table for homepage carousels
-- Date: 2026-06-02

-- Create banners table
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  redirect_url TEXT,
  title TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
DROP POLICY IF EXISTS "Allow public read access" ON public.banners;
CREATE POLICY "Allow public read access" ON public.banners FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow auth all access" ON public.banners;
CREATE POLICY "Allow auth all access" ON public.banners FOR ALL USING (true) WITH CHECK (true);

-- Register Trigger for updated_at tracking
DROP TRIGGER IF EXISTS set_timestamp_banners ON public.banners;
CREATE TRIGGER set_timestamp_banners BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Add Table to Supabase Realtime Publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'banners'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.banners;
  END IF;
END
$$;
