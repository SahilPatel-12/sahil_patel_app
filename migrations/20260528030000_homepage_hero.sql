-- Create homepage_hero table
CREATE TABLE IF NOT EXISTS public.homepage_hero (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    date_text TEXT,
    button_text TEXT,
    button_link TEXT,
    background_image TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for quick lookups on active status
CREATE INDEX IF NOT EXISTS idx_homepage_hero_is_active ON public.homepage_hero (is_active);

-- Trigger for updating the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_homepage_hero_updated_at
BEFORE UPDATE ON public.homepage_hero
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger to guarantee only a single row can be active at a given time
CREATE OR REPLACE FUNCTION ensure_single_active_hero()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active = true THEN
        UPDATE public.homepage_hero
        SET is_active = false
        WHERE id <> NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER ensure_single_active_hero_trigger
BEFORE INSERT OR UPDATE OF is_active ON public.homepage_hero
FOR EACH ROW
EXECUTE FUNCTION ensure_single_active_hero();

-- Enable Row Level Security (RLS)
ALTER TABLE public.homepage_hero ENABLE ROW LEVEL SECURITY;

-- 1. Read Policy: Allow anyone (public/anonymous) to read hero configurations
DROP POLICY IF EXISTS "Allow public read access for homepage_hero" ON public.homepage_hero;
CREATE POLICY "Allow public read access for homepage_hero"
ON public.homepage_hero FOR SELECT USING (true);

-- 2. Insert Policy: Allow admin operations (scoped to anon and authenticated roles)
DROP POLICY IF EXISTS "Allow insert for homepage_hero" ON public.homepage_hero;
CREATE POLICY "Allow insert for homepage_hero"
ON public.homepage_hero FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 3. Update Policy: Allow admin updates (scoped to anon and authenticated roles)
DROP POLICY IF EXISTS "Allow update for homepage_hero" ON public.homepage_hero;
CREATE POLICY "Allow update for homepage_hero"
ON public.homepage_hero FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- 4. Delete Policy: Allow admin deletes (scoped to anon and authenticated roles)
DROP POLICY IF EXISTS "Allow delete for homepage_hero" ON public.homepage_hero;
CREATE POLICY "Allow delete for homepage_hero"
ON public.homepage_hero FOR DELETE TO anon, authenticated USING (true);
