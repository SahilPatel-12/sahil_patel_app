-- Migration: Create push_notifications table
-- Date: 2026-06-11

-- Create push_notifications table
CREATE TABLE IF NOT EXISTS public.push_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('vrat', 'global', 'coins', 'generic')),
  target_vrat_id DATE, -- date_key of the spiritual calendar event
  coin_amount INTEGER,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL, -- time of day (HH:MM:SS)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.push_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
DROP POLICY IF EXISTS "Allow public read access" ON public.push_notifications;
CREATE POLICY "Allow public read access" ON public.push_notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow auth all access" ON public.push_notifications;
CREATE POLICY "Allow auth all access" ON public.push_notifications FOR ALL USING (true) WITH CHECK (true);

-- Register Trigger for updated_at tracking
DROP TRIGGER IF EXISTS set_timestamp_push_notifications ON public.push_notifications;
CREATE TRIGGER set_timestamp_push_notifications BEFORE UPDATE ON public.push_notifications
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Add Table to Supabase Realtime Publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'push_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.push_notifications;
  END IF;
END
$$;
