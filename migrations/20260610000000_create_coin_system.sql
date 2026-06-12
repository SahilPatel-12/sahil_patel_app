-- Migration: Create coin wallet, unlocked flowers, and transaction history tables
-- Date: 2026-06-10

-- 1. Add unlock_cost to public.god_flowers
ALTER TABLE public.god_flowers ADD COLUMN IF NOT EXISTS unlock_cost INTEGER NOT NULL DEFAULT 0;

-- 2. Create user_wallets Table
CREATE TABLE IF NOT EXISTS public.user_wallets (
  user_id UUID PRIMARY KEY REFERENCES public.app_users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 50 CHECK (balance >= 0),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS for user_wallets
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_wallets
DROP POLICY IF EXISTS "Allow public read for user_wallets" ON public.user_wallets;
CREATE POLICY "Allow public read for user_wallets" ON public.user_wallets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public write for user_wallets" ON public.user_wallets;
CREATE POLICY "Allow public write for user_wallets" ON public.user_wallets FOR ALL USING (true) WITH CHECK (true);

-- 3. Create user_unlocked_flowers Table
CREATE TABLE IF NOT EXISTS public.user_unlocked_flowers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE NOT NULL,
  flower_id UUID REFERENCES public.god_flowers(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT unique_user_flower UNIQUE (user_id, flower_id)
);

-- Enable RLS for user_unlocked_flowers
ALTER TABLE public.user_unlocked_flowers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_unlocked_flowers
DROP POLICY IF EXISTS "Allow public read for unlocked_flowers" ON public.user_unlocked_flowers;
CREATE POLICY "Allow public read for unlocked_flowers" ON public.user_unlocked_flowers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public write for unlocked_flowers" ON public.user_unlocked_flowers;
CREATE POLICY "Allow public write for unlocked_flowers" ON public.user_unlocked_flowers FOR ALL USING (true) WITH CHECK (true);

-- 4. Create coin_transactions Table
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'signup_bonus', 'purchase', 'transfer_sent', 'transfer_received', 'unlock_flower', 'admin_adjustment'
  recipient_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS for coin_transactions
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coin_transactions
DROP POLICY IF EXISTS "Allow public read for coin_transactions" ON public.coin_transactions;
CREATE POLICY "Allow public read for coin_transactions" ON public.coin_transactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public write for coin_transactions" ON public.coin_transactions;
CREATE POLICY "Allow public write for coin_transactions" ON public.coin_transactions FOR ALL USING (true) WITH CHECK (true);

-- 5. Trigger to automatically create wallet & log signup bonus when a new user registers in app_users
CREATE OR REPLACE FUNCTION public.handle_new_app_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user wallet
  INSERT INTO public.user_wallets (user_id, balance)
  VALUES (NEW.id, 50)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create signup bonus transaction record
  INSERT INTO public.coin_transactions (user_id, amount, type)
  VALUES (NEW.id, 50, 'signup_bonus')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_new_app_user_wallet ON public.app_users;
CREATE TRIGGER sync_new_app_user_wallet
AFTER INSERT ON public.app_users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_app_user_wallet();

-- 6. Backfill existing users who don't have wallets yet
INSERT INTO public.user_wallets (user_id, balance)
SELECT id, 50 FROM public.app_users
ON CONFLICT (user_id) DO NOTHING;

-- Also log signup bonus transaction for backfilled users if not exists
INSERT INTO public.coin_transactions (user_id, amount, type)
SELECT id, 50, 'signup_bonus' FROM public.app_users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.coin_transactions t
  WHERE t.user_id = u.id AND t.type = 'signup_bonus'
)
ON CONFLICT DO NOTHING;

-- Enable Realtime for wallets and unlocked flowers to sync mobile clients automatically
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_unlocked_flowers;
