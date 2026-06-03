-- =====================================================================
-- 5. UNIFIED PUJA & STORE SCHEMA MIGRATION
-- Migration Date: 2026-05-29
-- Unifies Puja/Sankalp bookings and Devotional Shop products
-- =====================================================================

-- 1. BASE INFRASTRUCTURE TABLES

-- Sacred Temples/Shrines
CREATE TABLE IF NOT EXISTS public.temples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Vedic Priests (Pandits)
CREATE TABLE IF NOT EXISTS public.pandits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    gotra TEXT NOT NULL,
    experience_years INT DEFAULT 0,
    profile_picture TEXT,
    base_temple_id UUID REFERENCES public.temples(id) ON DELETE SET NULL,
    languages_spoken TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Taxonomy System (Shared Categories & Tags)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    entity_type TEXT DEFAULT 'both' CHECK (entity_type IN ('puja', 'product', 'both')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    color_code VARCHAR(7) DEFAULT '#ea580c',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================================
-- 2. SERVICE & PRODUCT CATALOG CORE

-- Puja Services Table
CREATE TABLE IF NOT EXISTS public.pujas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    original_price NUMERIC(10, 2) NOT NULL,
    offer_price NUMERIC(10, 2) NOT NULL CHECK (offer_price <= original_price),
    rating NUMERIC(2, 1) DEFAULT 5.0,
    reviews_count INT DEFAULT 0,
    primary_image_url TEXT NOT NULL,
    video_url TEXT,
    audio_url TEXT,
    target_deity TEXT,
    duration_minutes INT DEFAULT 60,
    assigned_temple_id UUID REFERENCES public.temples(id) ON DELETE RESTRICT,
    assigned_pandit_id UUID REFERENCES public.pandits(id) ON DELETE SET NULL,
    booking_enabled BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    trending BOOLEAN DEFAULT false,
    recommendation_score NUMERIC(5,2) DEFAULT 0.00,
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'draft')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Devotional Products Table (Store module)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    original_price NUMERIC(10, 2),
    price NUMERIC(10, 2) NOT NULL,
    rating NUMERIC(2, 1) DEFAULT 5.0,
    reviews_count INT DEFAULT 0,
    image_url TEXT NOT NULL,
    in_stock BOOLEAN DEFAULT true,
    popularity INT DEFAULT 50 CHECK (popularity BETWEEN 0 AND 100),
    spiritual_type TEXT CHECK (spiritual_type IN ('Rituals', 'Meditation', 'Vastu', 'Wisdom', 'Aromatherapy')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================================
-- 3. LOCALIZATION TRANSLATIONS ENGINE (INFINITE LANGUAGES DYNAMIC ENGINE)

CREATE TABLE IF NOT EXISTS public.puja_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    puja_id UUID REFERENCES public.pujas(id) ON DELETE CASCADE NOT NULL,
    language_code VARCHAR(5) NOT NULL, -- Standard ISO codes e.g. 'en', 'hi', 'sa', 'gu', 'mr', 'ta', 'te'
    title TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    samagri TEXT,
    prasad_description TEXT,
    other_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (puja_id, language_code)
);

CREATE TABLE IF NOT EXISTS public.puja_benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    puja_id UUID REFERENCES public.pujas(id) ON DELETE CASCADE NOT NULL,
    language_code VARCHAR(5) DEFAULT 'en' NOT NULL,
    benefit_text TEXT NOT NULL,
    sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.puja_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    puja_id UUID REFERENCES public.pujas(id) ON DELETE CASCADE NOT NULL,
    language_code VARCHAR(5) DEFAULT 'en' NOT NULL,
    step_title TEXT NOT NULL,
    step_description TEXT,
    sort_order INT DEFAULT 0
);

-- =====================================================================
-- 4. POLYMORPHIC JOINS & METADATA

-- Unified Categories Map
CREATE TABLE IF NOT EXISTS public.catalog_categories_join (
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    puja_id UUID REFERENCES public.pujas(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    CHECK (
        (puja_id IS NOT NULL AND product_id IS NULL) OR 
        (puja_id IS NULL AND product_id IS NOT NULL)
    ),
    PRIMARY KEY (category_id, puja_id, product_id)
);

-- Unified Tags Map
CREATE TABLE IF NOT EXISTS public.catalog_tags_join (
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    puja_id UUID REFERENCES public.pujas(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    CHECK (
        (puja_id IS NOT NULL AND product_id IS NULL) OR 
        (puja_id IS NULL AND product_id IS NOT NULL)
    ),
    PRIMARY KEY (tag_id, puja_id, product_id)
);

-- Polymorphic SEO Database
CREATE TABLE IF NOT EXISTS public.seo_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    puja_id UUID REFERENCES public.pujas(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    seo_title TEXT,
    seo_description VARCHAR(160),
    canonical_url TEXT,
    keywords TEXT[],
    CHECK (
        (puja_id IS NOT NULL AND product_id IS NULL) OR 
        (puja_id IS NULL AND product_id IS NOT NULL)
    ),
    UNIQUE(puja_id),
    UNIQUE(product_id)
);

-- =====================================================================
-- 5. ORDER INVOICING & RITUAL BOOKING CORE

-- Unified Checkout Headers
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.app_users(id) ON DELETE RESTRICT NOT NULL,
    order_number TEXT UNIQUE NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    discount NUMERIC(10, 2) DEFAULT 0.00,
    shipping_cost NUMERIC(10, 2) DEFAULT 0.00,
    tax NUMERIC(10, 2) DEFAULT 0.00,
    total NUMERIC(10, 2) NOT NULL,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method TEXT,
    shipping_name TEXT NOT NULL,
    shipping_email TEXT NOT NULL,
    shipping_phone TEXT NOT NULL,
    shipping_address_line1 TEXT NOT NULL,
    shipping_address_line2 TEXT,
    shipping_city TEXT NOT NULL,
    shipping_state TEXT NOT NULL,
    shipping_pincode TEXT NOT NULL,
    order_status TEXT DEFAULT 'processing' CHECK (order_status IN ('processing', 'packed', 'shipped', 'completed', 'cancelled')),
    placed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Shared Checkout Lines
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('puja', 'product')),
    puja_id UUID REFERENCES public.pujas(id) ON DELETE RESTRICT,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INT DEFAULT 1 NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    package_level TEXT CHECK (package_level IN ('single', 'family')),
    CHECK (
        (item_type = 'puja' AND puja_id IS NOT NULL AND product_id IS NULL) OR
        (item_type = 'product' AND product_id IS NOT NULL AND puja_id IS NULL)
    )
);

-- Operational Puja Bookings & Sankalps Table
CREATE TABLE IF NOT EXISTS public.puja_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.app_users(id) ON DELETE RESTRICT NOT NULL,
    puja_id UUID REFERENCES public.pujas(id) ON DELETE RESTRICT NOT NULL,
    scheduled_date DATE NOT NULL,
    sankalp_type TEXT DEFAULT 'single' CHECK (sankalp_type IN ('single', 'family')),
    devotee_names TEXT[] NOT NULL CHECK (cardinality(devotee_names) BETWEEN 1 AND 4),
    devotee_gotras TEXT[] NOT NULL CHECK (cardinality(devotee_gotras) = cardinality(devotee_names)),
    whatsapp_number TEXT NOT NULL,
    live_stream_url TEXT,
    recorded_proof_url TEXT, -- Dynamic Cloudflare R2 reference video
    booking_status TEXT DEFAULT 'pending' CHECK (booking_status IN ('pending', 'scheduled', 'completed', 'cancelled')),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================================
-- 6. INDEX OPTIMIZATIONS

CREATE INDEX IF NOT EXISTS idx_pujas_slug ON public.pujas(slug);
CREATE INDEX IF NOT EXISTS idx_pujas_deity ON public.pujas(target_deity);
CREATE INDEX IF NOT EXISTS idx_puja_translations_lang ON public.puja_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_puja_benefits_sort ON public.puja_benefits(puja_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_puja_steps_sort ON public.puja_steps(puja_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_placed ON public.orders(placed_at DESC);
CREATE INDEX IF NOT EXISTS idx_puja_bookings_date ON public.puja_bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_puja_bookings_status ON public.puja_bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_spiritual_type ON public.products(spiritual_type);

-- =====================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS across schemas
ALTER TABLE public.temples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pandits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pujas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puja_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puja_bookings ENABLE ROW LEVEL SECURITY;

-- Anonymous/Devotee SELECT policies for catalog browsing
CREATE POLICY "Allow public read of temples" ON public.temples FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read of pandits" ON public.pandits FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read of categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read of tags" ON public.tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read of pujas" ON public.pujas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read of products" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read of puja translations" ON public.puja_translations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read of puja benefits" ON public.puja_benefits FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read of puja steps" ON public.puja_steps FOR SELECT TO anon, authenticated USING (true);

-- Checkout, Cart operations and Order placements
CREATE POLICY "Allow users to view own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Allow users to place orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow users to view own order items" ON public.order_items FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND user_id = auth.uid()));
CREATE POLICY "Allow users to insert order items" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow users to view own puja bookings" ON public.puja_bookings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Allow users to create bookings" ON public.puja_bookings FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Admin control policies (Service overrides or custom role claims check placeholder)
CREATE POLICY "Allow admin operations on temples" ON public.temples FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin operations on pandits" ON public.pandits FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin operations on categories" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin operations on tags" ON public.tags FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin operations on pujas" ON public.pujas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin operations on products" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin operations on puja translations" ON public.puja_translations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin operations on bookings" ON public.puja_bookings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================================
-- 8. AUTOMATIC ROW UPDATE TRIGGERS

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_temples BEFORE UPDATE ON public.temples FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_pandits BEFORE UPDATE ON public.pandits FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_categories BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_pujas BEFORE UPDATE ON public.pujas FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_products BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_puja_translations BEFORE UPDATE ON public.puja_translations FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_orders BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_puja_bookings BEFORE UPDATE ON public.puja_bookings FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
