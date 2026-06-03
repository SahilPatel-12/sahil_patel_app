-- Migration: Create website_pooja_products and website_settings tables
-- Date: 2026-06-01

CREATE TABLE IF NOT EXISTS public.website_pooja_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sanskrit_name TEXT,
  short_name TEXT,
  slug TEXT UNIQUE NOT NULL,
  category TEXT,
  tags TEXT[] DEFAULT '{}'::TEXT[],
  subtitle TEXT,
  short_description TEXT,
  description TEXT,
  spiritual_significance TEXT,
  benefits TEXT[] DEFAULT '{}'::TEXT[],
  rituals_included JSONB DEFAULT '[]'::jsonb,
  samagri_list JSONB DEFAULT '[]'::jsonb,
  priest_details JSONB DEFAULT '{}'::jsonb,
  duration TEXT,
  ideal_occasions TEXT[] DEFAULT '{}'::TEXT[],
  temple_association TEXT,
  who_should_perform TEXT,
  price NUMERIC,
  original_price NUMERIC,
  offers TEXT[] DEFAULT '{}'::TEXT[],
  badges TEXT[] DEFAULT '{}'::TEXT[],
  rating NUMERIC DEFAULT 4.9,
  reviews_count INTEGER DEFAULT 120,
  testimonials JSONB DEFAULT '[]'::jsonb,
  faqs JSONB DEFAULT '[]'::jsonb,
  booking_instructions TEXT,
  cta_labels JSONB DEFAULT '{"primary": "Book Now", "secondary": "Learn More"}'::jsonb,
  seo_title TEXT,
  seo_description TEXT,
  canonical_url TEXT,
  og_data JSONB DEFAULT '{"title": "", "description": "", "image": ""}'::jsonb,
  schema_markup JSONB DEFAULT '{}'::jsonb,
  image_alt TEXT,
  image_caption TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_trending BOOLEAN DEFAULT false,
  in_stock BOOLEAN DEFAULT true,
  recommendation_logic TEXT,
  related_products JSONB DEFAULT '[]'::jsonb,
  video_url TEXT,
  translations JSONB DEFAULT '{}'::jsonb,
  ui_labels JSONB DEFAULT '{}'::jsonb,
  is_published BOOLEAN DEFAULT true,
  image TEXT,
  banner_image TEXT,
  gallery_images JSONB DEFAULT '[]'::jsonb,
  ritual_images JSONB DEFAULT '[]'::jsonb,
  priest_image TEXT,
  certificates JSONB DEFAULT '[]'::jsonb,
  icon_image TEXT,
  promo_creatives JSONB DEFAULT '[]'::jsonb,
  material TEXT,
  weight TEXT,
  dimensions TEXT,
  origin TEXT,
  custom_icons JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for website_pooja_products
ALTER TABLE public.website_pooja_products ENABLE ROW LEVEL SECURITY;

-- Select policy: Allow public read access
CREATE POLICY "Allow public read access" ON public.website_pooja_products
  FOR SELECT USING (true);

-- All operations policy: Allow authenticated write access
CREATE POLICY "Allow auth all access" ON public.website_pooja_products
  FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for website_pooja_products table
ALTER PUBLICATION supabase_realtime ADD TABLE public.website_pooja_products;


-- Create website_settings table
CREATE TABLE IF NOT EXISTS public.website_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for website_settings
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;

-- Select policy: Allow public read access
CREATE POLICY "Allow public read access" ON public.website_settings
  FOR SELECT USING (true);

-- All operations policy: Allow authenticated write access
CREATE POLICY "Allow auth all access" ON public.website_settings
  FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for website_settings table
ALTER PUBLICATION supabase_realtime ADD TABLE public.website_settings;


-- Seed initial settings values if they do not exist
INSERT INTO public.website_settings (key, value)
VALUES 
(
  'store_categories',
  '["Rudraksha","Bracelet","Murti","Yantras","Anklet","Frames","Rashi","Karungali","Jadi","Pyrite","Kavach","Siddh Range","Gemstones","Pyramid","Necklaces/Mala","Tower & Tumbles","Crystal Dome Trees","Women Bracelets","Evil Eye","Gifting"]'::jsonb
),
(
  'view_all_settings',
  '{"banner_image":"https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/banner/ChatGPT Image May 26, 2026, 12_19_59 PM.png","title":"pujas","heading":"ALL","subheading":"Pure Vedic Seva + Divine Blessings"}'::jsonb
),
(
  'homepage_category_images',
  '{}'::jsonb
)
ON CONFLICT (key) DO NOTHING;

