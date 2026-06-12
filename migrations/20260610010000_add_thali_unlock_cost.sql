-- Migration: Add unlock_cost to god_thalis and create user_unlocked_thalis table
-- Date: 2026-06-10

-- 1. Add unlock_cost to public.god_thalis
ALTER TABLE public.god_thalis ADD COLUMN IF NOT EXISTS unlock_cost INTEGER NOT NULL DEFAULT 0;

-- 2. Create user_unlocked_thalis Table
CREATE TABLE IF NOT EXISTS public.user_unlocked_thalis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE NOT NULL,
  thali_id UUID REFERENCES public.god_thalis(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT unique_user_thali UNIQUE (user_id, thali_id)
);

-- Enable RLS for user_unlocked_thalis
ALTER TABLE public.user_unlocked_thalis ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_unlocked_thalis
DROP POLICY IF EXISTS "Allow public read for unlocked_thalis" ON public.user_unlocked_thalis;
CREATE POLICY "Allow public read for unlocked_thalis" ON public.user_unlocked_thalis FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public write for unlocked_thalis" ON public.user_unlocked_thalis;
CREATE POLICY "Allow public write for unlocked_thalis" ON public.user_unlocked_thalis FOR ALL USING (true) WITH CHECK (true);

-- 3. Enable Realtime for unlocked thalis to sync mobile clients automatically
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'user_unlocked_thalis'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_unlocked_thalis;
  END IF;
END
$$;
