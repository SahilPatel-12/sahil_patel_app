-- Migration: Create god_categories table and set up category relations
-- Date: 2026-06-09

CREATE TABLE IF NOT EXISTS public.god_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.god_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
DROP POLICY IF EXISTS "Allow public read access" ON public.god_categories;
CREATE POLICY "Allow public read access" ON public.god_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow auth all access" ON public.god_categories;
CREATE POLICY "Allow auth all access" ON public.god_categories FOR ALL USING (true) WITH CHECK (true);

-- Register Trigger for updated_at tracking
DROP TRIGGER IF EXISTS set_timestamp_god_categories ON public.god_categories;
CREATE TRIGGER set_timestamp_god_categories BEFORE UPDATE ON public.god_categories
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Pre-seed default categories
INSERT INTO public.god_categories (name, sort_order)
VALUES 
  ('Shiv Ji', 10),
  ('Ma Laxmi', 20),
  ('Ganesha', 30),
  ('Hanuman', 40),
  ('Durga Ma', 50),
  ('Krishna Ji', 60),
  ('Venkateswara', 70)
ON CONFLICT (name) DO NOTHING;

-- Populate any other existing custom categories from god_images table
INSERT INTO public.god_categories (name, sort_order)
SELECT DISTINCT category, 999
FROM public.god_images
ON CONFLICT (name) DO NOTHING;

-- Establish cascade constraint between god_images and god_categories
ALTER TABLE public.god_images
DROP CONSTRAINT IF EXISTS fk_god_images_category;

ALTER TABLE public.god_images
ADD CONSTRAINT fk_god_images_category
FOREIGN KEY (category) REFERENCES public.god_categories(name)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- Add Table to Supabase Realtime Publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'god_categories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.god_categories;
  END IF;
END
$$;
