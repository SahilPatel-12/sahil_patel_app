-- Migration: Add puja_video_url to puja_booking_details table for personalized recordings
-- Date: 2026-06-01

ALTER TABLE public.puja_booking_details
ADD COLUMN IF NOT EXISTS puja_video_url TEXT;

-- Verify/Refresh Realtime subscription
ALTER PUBLICATION supabase_realtime ADD TABLE public.puja_booking_details;
