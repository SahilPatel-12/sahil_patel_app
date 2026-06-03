-- Migration: Create offer_sections, offer_pujas, and puja_details tables
-- Date: 2026-05-31

-- 0. Define trigger_set_timestamp function if it does not exist
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Create offer_sections table
CREATE TABLE IF NOT EXISTS public.offer_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  background_image_url TEXT,
  cta_text TEXT,
  cta_link TEXT,
  status TEXT DEFAULT 'draft', -- 'draft' or 'published'
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create offer_pujas table
CREATE TABLE IF NOT EXISTS public.offer_pujas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES public.offer_sections(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  short_description TEXT,
  thumbnail_url TEXT,
  badge_text TEXT,
  price TEXT,
  discounted_price TEXT,
  duration TEXT,
  status TEXT DEFAULT 'draft', -- 'draft' or 'published'
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create puja_details table
CREATE TABLE IF NOT EXISTS public.puja_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puja_id UUID REFERENCES public.offer_pujas(id) ON DELETE CASCADE,
  hero_banner_url TEXT,
  overview TEXT,
  benefits TEXT,
  rituals TEXT,
  samagri TEXT,
  faq_json JSONB DEFAULT '[]'::jsonb,
  gallery_json JSONB DEFAULT '[]'::jsonb,
  temple_name TEXT,
  priest_details TEXT,
  seo_title TEXT,
  seo_description TEXT,
  status TEXT DEFAULT 'draft', -- 'draft' or 'published'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT puja_details_puja_id_key UNIQUE (puja_id)
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.offer_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_pujas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puja_details ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
-- Allow public select access to all rows (the client can filter active and published values)
DROP POLICY IF EXISTS "Allow public read access" ON public.offer_sections;
CREATE POLICY "Allow public read access" ON public.offer_sections FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON public.offer_pujas;
CREATE POLICY "Allow public read access" ON public.offer_pujas FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON public.puja_details;
CREATE POLICY "Allow public read access" ON public.puja_details FOR SELECT USING (true);

-- Allow authenticated write access for administrators
DROP POLICY IF EXISTS "Allow auth all access" ON public.offer_sections;
CREATE POLICY "Allow auth all access" ON public.offer_sections FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow auth all access" ON public.offer_pujas;
CREATE POLICY "Allow auth all access" ON public.offer_pujas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow auth all access" ON public.puja_details;
CREATE POLICY "Allow auth all access" ON public.puja_details FOR ALL USING (true) WITH CHECK (true);


-- 6. Register Triggers for updated_at tracking
DROP TRIGGER IF EXISTS set_timestamp_offer_sections ON public.offer_sections;
CREATE TRIGGER set_timestamp_offer_sections BEFORE UPDATE ON public.offer_sections
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_offer_pujas ON public.offer_pujas;
CREATE TRIGGER set_timestamp_offer_pujas BEFORE UPDATE ON public.offer_pujas
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_puja_details ON public.puja_details;
CREATE TRIGGER set_timestamp_puja_details BEFORE UPDATE ON public.puja_details
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();


-- 7. Add Tables to Supabase Realtime Publication if not already members
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'offer_sections'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.offer_sections;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'offer_pujas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.offer_pujas;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'puja_details'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.puja_details;
  END IF;
END
$$;

