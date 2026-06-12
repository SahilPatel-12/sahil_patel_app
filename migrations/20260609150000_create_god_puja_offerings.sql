-- Migration: Create god_flowers and god_thalis tables for dynamic puja offerings
-- Date: 2026-06-09

-- 1. Create god_flowers Table
CREATE TABLE IF NOT EXISTS public.god_flowers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  image_url TEXT NOT NULL DEFAULT '',
  blossom_timing INTEGER NOT NULL DEFAULT 4000, -- animation duration in milliseconds
  shower_duration INTEGER NOT NULL DEFAULT 10000, -- shower run duration in milliseconds
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Alter table statement for backwards compatibility
ALTER TABLE public.god_flowers ADD COLUMN IF NOT EXISTS shower_duration INTEGER NOT NULL DEFAULT 10000;

-- Enable RLS for god_flowers
ALTER TABLE public.god_flowers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for god_flowers
DROP POLICY IF EXISTS "Allow public read access" ON public.god_flowers;
CREATE POLICY "Allow public read access" ON public.god_flowers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow auth all access" ON public.god_flowers;
CREATE POLICY "Allow auth all access" ON public.god_flowers FOR ALL USING (true) WITH CHECK (true);

-- Register Trigger for god_flowers updated_at tracking
DROP TRIGGER IF EXISTS set_timestamp_god_flowers ON public.god_flowers;
CREATE TRIGGER set_timestamp_god_flowers BEFORE UPDATE ON public.god_flowers
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 2. Create god_thalis Table
CREATE TABLE IF NOT EXISTS public.god_thalis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  image_url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS for god_thalis
ALTER TABLE public.god_thalis ENABLE ROW LEVEL SECURITY;

-- RLS Policies for god_thalis
DROP POLICY IF EXISTS "Allow public read access" ON public.god_thalis;
CREATE POLICY "Allow public read access" ON public.god_thalis FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow auth all access" ON public.god_thalis;
CREATE POLICY "Allow auth all access" ON public.god_thalis FOR ALL USING (true) WITH CHECK (true);

-- Register Trigger for god_thalis updated_at tracking
DROP TRIGGER IF EXISTS set_timestamp_god_thalis ON public.god_thalis;
CREATE TRIGGER set_timestamp_god_thalis BEFORE UPDATE ON public.god_thalis
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 3. Pre-seed default flower options
INSERT INTO public.god_flowers (name, blossom_timing, sort_order, image_url)
VALUES 
  ('Marigold', 4000, 10, ''),
  ('Rose', 4000, 20, ''),
  ('Lotus', 4000, 30, ''),
  ('Jasmine', 4000, 40, '')
ON CONFLICT (name) DO NOTHING;

-- 4. Pre-seed default thali options
INSERT INTO public.god_thalis (name, sort_order, image_url)
VALUES 
  ('Brass Thali', 10, ''),
  ('Silver Thali', 20, ''),
  ('Golden Thali', 30, '')
ON CONFLICT (name) DO NOTHING;

-- 5. Add tables to Supabase Realtime Publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'god_flowers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.god_flowers;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'god_thalis'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.god_thalis;
  END IF;
END
$$;
