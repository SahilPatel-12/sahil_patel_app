-- Migration: Create pandit_videos table
-- Date: 2026-06-02

-- Create pandit_videos table
CREATE TABLE IF NOT EXISTS public.pandit_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pandit_name TEXT NOT NULL,
  temple TEXT NOT NULL,
  ritual_name TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration TEXT NOT NULL DEFAULT '1:00',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.pandit_videos ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
DROP POLICY IF EXISTS "Allow public read access" ON public.pandit_videos;
CREATE POLICY "Allow public read access" ON public.pandit_videos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow auth all access" ON public.pandit_videos;
CREATE POLICY "Allow auth all access" ON public.pandit_videos FOR ALL USING (true) WITH CHECK (true);

-- Register Trigger for updated_at tracking
DROP TRIGGER IF EXISTS set_timestamp_pandit_videos ON public.pandit_videos;
CREATE TRIGGER set_timestamp_pandit_videos BEFORE UPDATE ON public.pandit_videos
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Add Table to Supabase Realtime Publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'pandit_videos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pandit_videos;
  END IF;
END
$$;
