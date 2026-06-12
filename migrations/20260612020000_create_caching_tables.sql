-- Create panchangs table for Vedic Panchang API caching
CREATE TABLE IF NOT EXISTS public.panchangs (
    reference_date DATE PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on panchangs
ALTER TABLE public.panchangs ENABLE ROW LEVEL SECURITY;

-- Allow anonymous select (since the app will query it)
CREATE POLICY "Allow anon read access to panchangs" ON public.panchangs
    FOR SELECT TO anon USING (true);

-- Allow anonymous upsert (since the app backend uses anon client to cache, or backend can insert)
CREATE POLICY "Allow anon insert/update to panchangs" ON public.panchangs
    FOR ALL TO anon USING (true);


-- Create horoscopes table for Rashifal/Horoscope API caching
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

-- Allow anonymous select
CREATE POLICY "Allow anon read access to horoscopes" ON public.horoscopes
    FOR SELECT TO anon USING (true);

-- Allow anonymous upsert
CREATE POLICY "Allow anon insert/update to horoscopes" ON public.horoscopes
    FOR ALL TO anon USING (true);
