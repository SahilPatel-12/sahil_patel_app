-- 1. Create/update panchangs table to cache multiple locations
DROP TABLE IF EXISTS public.panchangs CASCADE;
CREATE TABLE public.panchangs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_date DATE NOT NULL,
    lat NUMERIC(8, 4) NOT NULL,
    lon NUMERIC(8, 4) NOT NULL,
    tzone NUMERIC(3, 1) NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_panchang_request UNIQUE (reference_date, lat, lon, tzone)
);

-- Enable RLS on panchangs
ALTER TABLE public.panchangs ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read/write
CREATE POLICY "Allow anon read access to panchangs" ON public.panchangs FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert/update to panchangs" ON public.panchangs FOR ALL TO anon USING (true);


-- 2. Create/update horoscopes table for Rashifal/Horoscope API caching
CREATE TABLE IF NOT EXISTS public.horoscopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sign TEXT NOT NULL,
    period_type TEXT NOT NULL,
    content TEXT NOT NULL,
    date_label TEXT,
    lucky_number TEXT,
    lucky_color TEXT,
    remedy TEXT,
    ratings JSONB,
    sections JSONB,
    reference_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_sign_period_ref_date UNIQUE (sign, period_type, reference_date)
);

-- Enable RLS on horoscopes
ALTER TABLE public.horoscopes ENABLE ROW LEVEL SECURITY;

-- Allow anonymous select/upsert
DROP POLICY IF EXISTS "Allow anon read access to horoscopes" ON public.horoscopes;
CREATE POLICY "Allow anon read access to horoscopes" ON public.horoscopes FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Allow anon insert/update to horoscopes" ON public.horoscopes;
CREATE POLICY "Allow anon insert/update to horoscopes" ON public.horoscopes FOR ALL TO anon USING (true);


-- 3. Create/update kundlis table for Vedic Birth Chart caching
CREATE TABLE IF NOT EXISTS public.kundlis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day INT NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    hour INT NOT NULL,
    min INT NOT NULL,
    lat NUMERIC(8, 4) NOT NULL,
    lon NUMERIC(8, 4) NOT NULL,
    tzone NUMERIC(3, 1) NOT NULL,
    gender TEXT NOT NULL,
    language TEXT NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_kundli_details UNIQUE (day, month, year, hour, min, lat, lon, tzone, gender, language)
);

-- Enable RLS on kundlis
ALTER TABLE public.kundlis ENABLE ROW LEVEL SECURITY;

-- Allow anonymous select/upsert
DROP POLICY IF EXISTS "Allow anon read access to kundlis" ON public.kundlis;
CREATE POLICY "Allow anon read access to kundlis" ON public.kundlis FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Allow anon insert/update to kundlis" ON public.kundlis;
CREATE POLICY "Allow anon insert/update to kundlis" ON public.kundlis FOR ALL TO anon USING (true);
