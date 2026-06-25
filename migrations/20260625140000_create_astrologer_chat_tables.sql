-- 1. Create website_store_astrologers Table (if not exists)
CREATE TABLE IF NOT EXISTS public.website_store_astrologers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  profile_photo TEXT,
  rating NUMERIC(2,1) DEFAULT 4.5 NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
  experience_years INTEGER NOT NULL DEFAULT 5 CHECK (experience_years >= 0),
  readings_count INTEGER NOT NULL DEFAULT 100 CHECK (readings_count >= 0),
  languages TEXT[] NOT NULL,
  specialties TEXT[] NOT NULL,
  charge_per_min INTEGER NOT NULL DEFAULT 30 CHECK (charge_per_min >= 0),
  is_online BOOLEAN NOT NULL DEFAULT true,
  spiritual_title TEXT,
  bio TEXT,
  city TEXT,
  state TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on website_store_astrologers
ALTER TABLE public.website_store_astrologers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read for website_store_astrologers" ON public.website_store_astrologers;
CREATE POLICY "Allow public read for website_store_astrologers" ON public.website_store_astrologers 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow user to update own astrologer profile" ON public.website_store_astrologers;
CREATE POLICY "Allow user to update own astrologer profile" ON public.website_store_astrologers 
  FOR ALL USING (true) WITH CHECK (true);


-- 2. Create astrologer_bookings Table (if not exists)
CREATE TABLE IF NOT EXISTS public.astrologer_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  astrologer_id UUID REFERENCES public.website_store_astrologers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE NOT NULL,
  devotee_name TEXT NOT NULL,
  devotee_phone TEXT NOT NULL,
  booking_date DATE NOT NULL DEFAULT CURRENT_DATE,
  booking_time TEXT NOT NULL,
  special_notes TEXT,
  consult_type TEXT NOT NULL CHECK (consult_type IN ('chat', 'call')),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Active', 'Completed', 'Cancelled')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on astrologer_bookings
ALTER TABLE public.astrologer_bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read for astrologer_bookings" ON public.astrologer_bookings;
CREATE POLICY "Allow public read for astrologer_bookings" ON public.astrologer_bookings 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public write for astrologer_bookings" ON public.astrologer_bookings;
CREATE POLICY "Allow public write for astrologer_bookings" ON public.astrologer_bookings 
  FOR ALL USING (true) WITH CHECK (true);


-- 3. Create astrologer_chat_messages Table
CREATE TABLE IF NOT EXISTS public.astrologer_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.astrologer_bookings(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'astrologer')),
  message_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on astrologer_chat_messages
ALTER TABLE public.astrologer_chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read for astrologer_chat_messages" ON public.astrologer_chat_messages;
CREATE POLICY "Allow public read for astrologer_chat_messages" ON public.astrologer_chat_messages 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public write for astrologer_chat_messages" ON public.astrologer_chat_messages;
CREATE POLICY "Allow public write for astrologer_chat_messages" ON public.astrologer_chat_messages 
  FOR ALL USING (true) WITH CHECK (true);


-- 4. Enable Realtime Replication for the tables
-- Check if table is in publication, if not, add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'website_store_astrologers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.website_store_astrologers;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'astrologer_bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.astrologer_bookings;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'astrologer_chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.astrologer_chat_messages;
  END IF;
END $$;
