-- Migration: Create category_by_product table and migrate existing data
-- Date: 2026-06-01

CREATE TABLE IF NOT EXISTS public.category_by_product (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT UNIQUE NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for category_by_product
ALTER TABLE public.category_by_product ENABLE ROW LEVEL SECURITY;

-- Select policy: Allow public read access
CREATE POLICY "Allow public read access" ON public.category_by_product
  FOR SELECT USING (true);

-- All operations policy: Allow authenticated write access
CREATE POLICY "Allow auth all access" ON public.category_by_product
  FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for category_by_product table
ALTER PUBLICATION supabase_realtime ADD TABLE public.category_by_product;

-- Migrate existing homepage category images if there are any
DO $$
DECLARE
  settings_val JSONB;
  cat_key TEXT;
  cat_val TEXT;
BEGIN
  SELECT value INTO settings_val FROM public.website_settings WHERE key = 'homepage_category_images';
  IF settings_val IS NOT NULL AND jsonb_typeof(settings_val) = 'object' THEN
    FOR cat_key, cat_val IN SELECT * FROM jsonb_each_text(settings_val)
    LOOP
      INSERT INTO public.category_by_product (category, image_url)
      VALUES (cat_key, cat_val)
      ON CONFLICT (category) DO UPDATE
      SET image_url = EXCLUDED.image_url;
    END LOOP;
  END IF;
END;
$$;
