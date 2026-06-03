-- Migration: Drop old order tables and create new Orders System tables
-- Date: 2026-06-01

DROP TABLE IF EXISTS public.puja_bookings CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;

-- 1. Create profiles table linked to app_users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES public.app_users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger to sync profiles from app_users
CREATE OR REPLACE FUNCTION public.handle_app_user_sync()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email, created_at)
  VALUES (NEW.id, NEW.name, NEW.phone, NEW.email, NEW.created_at)
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_app_user_created
AFTER INSERT OR UPDATE ON public.app_users
FOR EACH ROW EXECUTE FUNCTION public.handle_app_user_sync();

-- Insert existing users into profiles
INSERT INTO public.profiles (id, full_name, phone, email, created_at)
SELECT id, name, phone, email, created_at FROM public.app_users
ON CONFLICT (id) DO NOTHING;

-- 2. Create carts table
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create cart_items table
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID REFERENCES public.carts(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('puja', 'product')),
  item_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL,
  price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.app_users(id) ON DELETE RESTRICT NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('puja', 'product', 'mixed')),
  total_amount NUMERIC NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  order_status TEXT DEFAULT 'Pending' CHECK (order_status IN ('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Completed', 'Cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('puja', 'product')),
  item_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL,
  price NUMERIC NOT NULL
);

-- 6. Create puja_booking_details table
CREATE TABLE IF NOT EXISTS public.puja_booking_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  devotee_name TEXT NOT NULL,
  gotra TEXT,
  special_notes TEXT,
  preferred_date DATE,
  preferred_time TEXT
);

-- 7. Create shipping_addresses table
CREATE TABLE IF NOT EXISTS public.shipping_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  landmark TEXT
);

-- Enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puja_booking_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_addresses ENABLE ROW LEVEL SECURITY;

-- Select policies
CREATE POLICY "Allow public select for profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow auth all access for profiles" ON public.profiles FOR ALL USING (true);

CREATE POLICY "Allow all access for carts" ON public.carts FOR ALL USING (true);
CREATE POLICY "Allow all access for cart_items" ON public.cart_items FOR ALL USING (true);
CREATE POLICY "Allow all access for orders" ON public.orders FOR ALL USING (true);
CREATE POLICY "Allow all access for order_items" ON public.order_items FOR ALL USING (true);
CREATE POLICY "Allow all access for puja_booking_details" ON public.puja_booking_details FOR ALL USING (true);
CREATE POLICY "Allow all access for shipping_addresses" ON public.shipping_addresses FOR ALL USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.carts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cart_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.puja_booking_details;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shipping_addresses;
