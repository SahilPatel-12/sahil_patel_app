-- Enable pgcrypto extension for bcrypt and UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create admins table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on admins table (optional but secure)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create policy to deny all public access to admins table directly
CREATE POLICY "Admins are not readable by anonymous users" ON public.admins
    FOR SELECT TO anon USING (false);

-- Create a secure RPC function to verify admin login
CREATE OR REPLACE FUNCTION verify_admin_login(p_username TEXT, p_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_password_hash TEXT;
BEGIN
    -- Query the password hash for the specified username
    SELECT password_hash INTO v_password_hash
    FROM public.admins
    WHERE username = p_username;

    -- If username not found, return false
    IF v_password_hash IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Verify the password using crypt
    RETURN v_password_hash = crypt(p_password, v_password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed default admin user (username: admin, password: admin123)
-- Using blowfish (bf) algorithm with a standard cost factor
INSERT INTO public.admins (username, password_hash)
VALUES ('admin', crypt('admin123', gen_salt('bf', 10)))
ON CONFLICT (username) DO NOTHING;
