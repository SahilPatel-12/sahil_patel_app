-- Create/update choghadiyas table to cache Choghadiya timings requests
CREATE TABLE IF NOT EXISTS public.choghadiyas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_date DATE NOT NULL,
    lat NUMERIC(8, 4) NOT NULL,
    lon NUMERIC(8, 4) NOT NULL,
    tzone NUMERIC(3, 1) NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_choghadiya_request UNIQUE (reference_date, lat, lon, tzone)
);

-- Enable RLS on choghadiyas
ALTER TABLE public.choghadiyas ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read/write
DROP POLICY IF EXISTS "Allow anon read access to choghadiyas" ON public.choghadiyas;
CREATE POLICY "Allow anon read access to choghadiyas" ON public.choghadiyas FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Allow anon insert/update to choghadiyas" ON public.choghadiyas;
CREATE POLICY "Allow anon insert/update to choghadiyas" ON public.choghadiyas FOR ALL TO anon USING (true);
