-- Migration: Create user_push_tokens table
-- Date: 2026-06-12

CREATE TABLE IF NOT EXISTS public.user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
  push_token TEXT UNIQUE NOT NULL,
  platform TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all anonymous access so app can register/deregister/update tokens without strict JWT auth
DROP POLICY IF EXISTS "Allow anonymous read" ON public.user_push_tokens;
CREATE POLICY "Allow anonymous read" ON public.user_push_tokens FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert" ON public.user_push_tokens;
CREATE POLICY "Allow anonymous insert" ON public.user_push_tokens FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous update" ON public.user_push_tokens;
CREATE POLICY "Allow anonymous update" ON public.user_push_tokens FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous delete" ON public.user_push_tokens;
CREATE POLICY "Allow anonymous delete" ON public.user_push_tokens FOR DELETE USING (true);

-- Register Trigger for updated_at tracking
DROP TRIGGER IF EXISTS set_timestamp_user_push_tokens ON public.user_push_tokens;
CREATE TRIGGER set_timestamp_user_push_tokens BEFORE UPDATE ON public.user_push_tokens
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Add Table to Supabase Realtime Publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'user_push_tokens'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_push_tokens;
  END IF;
END
$$;
