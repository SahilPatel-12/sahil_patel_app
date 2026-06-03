-- Create app_users table
CREATE TABLE IF NOT EXISTS public.app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT UNIQUE NOT NULL,
    name TEXT,
    email TEXT,
    dob TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous SELECT/INSERT/UPDATE (so client app can register/login users)
CREATE POLICY "Allow anonymous select for app_users" ON public.app_users
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous insert for app_users" ON public.app_users
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous update for app_users" ON public.app_users
    FOR UPDATE TO anon USING (true) WITH CHECK (true);
