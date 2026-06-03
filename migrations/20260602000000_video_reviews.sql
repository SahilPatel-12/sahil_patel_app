-- Migration: Create video_reviews table
-- Date: 2026-06-02

-- Create video_reviews table
CREATE TABLE IF NOT EXISTS public.video_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devotee_name TEXT NOT NULL,
  location TEXT NOT NULL,
  puja_name TEXT NOT NULL,
  rating DECIMAL(2,1) NOT NULL DEFAULT 5.0,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration TEXT NOT NULL DEFAULT '1:00',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.video_reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
DROP POLICY IF EXISTS "Allow public read access" ON public.video_reviews;
CREATE POLICY "Allow public read access" ON public.video_reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow auth all access" ON public.video_reviews;
CREATE POLICY "Allow auth all access" ON public.video_reviews FOR ALL USING (true) WITH CHECK (true);

-- Register Trigger for updated_at tracking
DROP TRIGGER IF EXISTS set_timestamp_video_reviews ON public.video_reviews;
CREATE TRIGGER set_timestamp_video_reviews BEFORE UPDATE ON public.video_reviews
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Add Table to Supabase Realtime Publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'video_reviews'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.video_reviews;
  END IF;
END
$$;
