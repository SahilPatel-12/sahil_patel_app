-- Migration: Add custom notification sounds and details
-- Date: 2026-06-17

-- 1. Create notification_sounds table
CREATE TABLE IF NOT EXISTS public.notification_sounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                  -- Friendly name, e.g. "Temple Bell Chime"
  filename TEXT NOT NULL,              -- Local bundle file name in native app, e.g. "bell_sound.mp3"
  file_url TEXT NOT NULL,              -- Remote CDN URL for browser preview/playback
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.notification_sounds ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
DROP POLICY IF EXISTS "Allow public read access" ON public.notification_sounds;
CREATE POLICY "Allow public read access" ON public.notification_sounds FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow auth all access" ON public.notification_sounds;
CREATE POLICY "Allow auth all access" ON public.notification_sounds FOR ALL USING (true) WITH CHECK (true);

-- 2. Add columns to push_notifications table
ALTER TABLE public.push_notifications ADD COLUMN IF NOT EXISTS sound_name TEXT DEFAULT 'default';
ALTER TABLE public.push_notifications ADD COLUMN IF NOT EXISTS sound_url TEXT;
ALTER TABLE public.push_notifications ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;

-- 3. Insert default sounds for quick bootstrap
INSERT INTO public.notification_sounds (name, filename, file_url)
VALUES 
  ('Default System Chime', 'default', ''),
  ('Temple Bell Chime', 'bell_sound', 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/notifications/bell_sound.mp3'),
  ('Sacred Shankh (Conch)', 'shankh_sound', 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/notifications/shankh_sound.mp3'),
  ('Mantra Flute Tune', 'flute_sound', 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/notifications/flute_sound.mp3')
ON CONFLICT DO NOTHING;
