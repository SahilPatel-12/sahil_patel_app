-- Migration: Add Refer & Earn system structures and triggers
-- Date: 2026-06-10

-- 1. Helper function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_unique_referral_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  exists_code BOOLEAN;
BEGIN
  LOOP
    -- Generate a code of format MPXXXXXX where X is uppercase alphanumeric
    new_code := 'MP' || upper(substring(md5(random()::text) from 1 for 6));
    SELECT EXISTS(SELECT 1 FROM public.app_users WHERE referral_code = new_code) INTO exists_code;
    IF NOT exists_code THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 2. Add columns to app_users and profiles
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS referred_by_code TEXT;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by_code TEXT;

-- 3. Backfill existing users with unique referral codes
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM public.app_users WHERE referral_code IS NULL LOOP
    UPDATE public.app_users 
    SET referral_code = public.generate_unique_referral_code()
    WHERE id = user_record.id;
  END LOOP;
END;
$$;

-- 4. Apply DEFAULT values for future registrations
ALTER TABLE public.app_users ALTER COLUMN referral_code SET DEFAULT public.generate_unique_referral_code();

-- 5. Update handling of app user profile syncing trigger function
CREATE OR REPLACE FUNCTION public.handle_app_user_sync()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email, created_at, referral_code, referred_by_code)
  VALUES (NEW.id, NEW.name, NEW.phone, NEW.email, NEW.created_at, NEW.referral_code, NEW.referred_by_code)
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      email = EXCLUDED.email,
      referral_code = EXCLUDED.referral_code,
      referred_by_code = EXCLUDED.referred_by_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Backfill profiles with referral details from app_users
UPDATE public.profiles p
SET referral_code = u.referral_code,
    referred_by_code = u.referred_by_code
FROM public.app_users u
WHERE p.id = u.id;

-- 6. Create user_referrals table
CREATE TABLE IF NOT EXISTS public.user_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE NOT NULL,
  referee_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE NOT NULL,
  reward_coins INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT unique_referee UNIQUE (referee_id)
);

-- Enable RLS for user_referrals
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_referrals
DROP POLICY IF EXISTS "Allow public read for user_referrals" ON public.user_referrals;
CREATE POLICY "Allow public read for user_referrals" ON public.user_referrals FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public write for user_referrals" ON public.user_referrals;
CREATE POLICY "Allow public write for user_referrals" ON public.user_referrals FOR ALL USING (true) WITH CHECK (true);

-- 7. Trigger to reward referrer when a referee signs up with a valid referral code
CREATE OR REPLACE FUNCTION public.handle_referral_reward()
RETURNS TRIGGER AS $$
DECLARE
  referrer_rec RECORD;
BEGIN
  -- Check if user entered a referral code and it is not self-referral
  IF NEW.referred_by_code IS NOT NULL AND NEW.referred_by_code <> '' THEN
    -- Look up referrer
    SELECT * INTO referrer_rec FROM public.app_users 
    WHERE referral_code = NEW.referred_by_code;
    
    -- Ensure referrer exists and is not the referee themselves
    IF referrer_rec.id IS NOT NULL AND referrer_rec.id <> NEW.id THEN
      -- Log the referral relation
      INSERT INTO public.user_referrals (referrer_id, referee_id, reward_coins)
      VALUES (referrer_rec.id, NEW.id, 100)
      ON CONFLICT DO NOTHING;
      
      -- Add 100 coins to referrer's wallet
      INSERT INTO public.user_wallets (user_id, balance)
      VALUES (referrer_rec.id, 150) -- 50 initial + 100 reward if wallet didn't exist
      ON CONFLICT (user_id) DO UPDATE 
      SET balance = public.user_wallets.balance + 100,
          updated_at = now();
          
      -- Create transaction history entry for the referrer
      INSERT INTO public.coin_transactions (user_id, amount, type, recipient_phone)
      VALUES (referrer_rec.id, 100, 'referral_reward', NEW.phone);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_referral_reward ON public.app_users;
CREATE TRIGGER sync_referral_reward
AFTER INSERT ON public.app_users
FOR EACH ROW
EXECUTE FUNCTION public.handle_referral_reward();

-- 8. Enable Realtime replication for user_referrals
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_referrals;
