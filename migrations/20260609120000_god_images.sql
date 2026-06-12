-- Migration: Create god_images table to store category-wise deity images
-- Date: 2026-06-09

CREATE TABLE IF NOT EXISTS public.god_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  category TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.god_images ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
DROP POLICY IF EXISTS "Allow public read access" ON public.god_images;
CREATE POLICY "Allow public read access" ON public.god_images FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow auth all access" ON public.god_images;
CREATE POLICY "Allow auth all access" ON public.god_images FOR ALL USING (true) WITH CHECK (true);

-- Register Trigger for updated_at tracking
DROP TRIGGER IF EXISTS set_timestamp_god_images ON public.god_images;
CREATE TRIGGER set_timestamp_god_images BEFORE UPDATE ON public.god_images
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Add Table to Supabase Realtime Publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'god_images'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.god_images;
  END IF;
END
$$;
