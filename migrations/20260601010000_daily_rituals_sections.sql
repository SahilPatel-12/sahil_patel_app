-- Migration: Create daily_sections, daily_pujas, and daily_puja_details tables
-- Date: 2026-06-01

-- 1. Create daily_sections table
CREATE TABLE IF NOT EXISTS public.daily_sections (
  day_of_week INTEGER PRIMARY KEY CONSTRAINT day_range CHECK (day_of_week BETWEEN 0 AND 6),
  title TEXT NOT NULL,
  subtitle TEXT,
  background_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create daily_pujas table
CREATE TABLE IF NOT EXISTS public.daily_pujas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER REFERENCES public.daily_sections(day_of_week) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  short_description TEXT,
  thumbnail_url TEXT,
  badge_text TEXT,
  price TEXT,
  discounted_price TEXT,
  duration TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create daily_puja_details table
CREATE TABLE IF NOT EXISTS public.daily_puja_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puja_id UUID REFERENCES public.daily_pujas(id) ON DELETE CASCADE,
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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT daily_puja_details_puja_id_key UNIQUE (puja_id)
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.daily_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_pujas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_puja_details ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
DROP POLICY IF EXISTS "Allow public read access" ON public.daily_sections;
CREATE POLICY "Allow public read access" ON public.daily_sections FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON public.daily_pujas;
CREATE POLICY "Allow public read access" ON public.daily_pujas FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON public.daily_puja_details;
CREATE POLICY "Allow public read access" ON public.daily_puja_details FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow auth all access" ON public.daily_sections;
CREATE POLICY "Allow auth all access" ON public.daily_sections FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow auth all access" ON public.daily_pujas;
CREATE POLICY "Allow auth all access" ON public.daily_pujas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow auth all access" ON public.daily_puja_details;
CREATE POLICY "Allow auth all access" ON public.daily_puja_details FOR ALL USING (true) WITH CHECK (true);

-- 6. Register Triggers for updated_at tracking
DROP TRIGGER IF EXISTS set_timestamp_daily_sections ON public.daily_sections;
CREATE TRIGGER set_timestamp_daily_sections BEFORE UPDATE ON public.daily_sections
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_daily_pujas ON public.daily_pujas;
CREATE TRIGGER set_timestamp_daily_pujas BEFORE UPDATE ON public.daily_pujas
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_daily_puja_details ON public.daily_puja_details;
CREATE TRIGGER set_timestamp_daily_puja_details BEFORE UPDATE ON public.daily_puja_details
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 7. Add Tables to Supabase Realtime Publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'daily_sections'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_sections;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'daily_pujas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_pujas;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'daily_puja_details'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_puja_details;
  END IF;
END
$$;

-- 8. Seed default configurations for all 7 days
INSERT INTO public.daily_sections (day_of_week, title, subtitle, background_image_url) VALUES
(1, 'Monday Shiva Special Puja', 'Divine Shiva rituals for peace, protection, and spiritual blessings', 'https://images.unsplash.com/photo-1608976328321-2f9b229f3e08?auto=format&fit=crop&w=800&q=80'),
(2, 'Tuesday Hanuman & Mangal Special', 'Special rituals for strength, courage, and clearing Mangal Grah obstacles', 'https://images.unsplash.com/photo-1567591974574-e852636b14a3?auto=format&fit=crop&w=800&q=80'),
(3, 'Wednesday Ganesha Special Puja', 'Invoke Lord Ganesha to remove obstacles and bring success & wisdom', 'https://images.unsplash.com/photo-1609137144814-6c3614275f7e?auto=format&fit=crop&w=800&q=80'),
(4, 'Thursday Lord Vishnu Special', 'Vedic rituals for wealth, prosperity, and family harmony', 'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=800&q=80'),
(5, 'Friday Maha Laxmi Seva', 'Divine offerings for wealth, financial abundance, and luck', 'https://images.unsplash.com/photo-1608976328321-2f9b229f3e08?auto=format&fit=crop&w=800&q=80'),
(6, 'Saturday Shani Dev Shanti', 'Powerful remedies to calm planetary doshas and clear negative energies', 'https://images.unsplash.com/photo-1600861195091-690c92f1d2cc?auto=format&fit=crop&w=800&q=80'),
(0, 'Sunday Surya Dev Aradhana', 'Vedic rituals for health, vitality, leadership, and pure energy', 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&w=800&q=80')
ON CONFLICT (day_of_week) DO NOTHING;

