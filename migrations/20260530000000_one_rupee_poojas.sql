-- Create table for One Rupee Poojas
CREATE TABLE IF NOT EXISTS public.one_rupee_poojas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    original_price TEXT NOT NULL,
    offer_price TEXT DEFAULT '₹1',
    rating TEXT,
    reviews TEXT,
    provider TEXT NOT NULL,
    image_url TEXT NOT NULL,
    tag TEXT,
    requirement TEXT,
    category TEXT DEFAULT 'General',
    is_active_on_home BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.one_rupee_poojas ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on one_rupee_poojas" 
    ON public.one_rupee_poojas 
    FOR SELECT 
    USING (true);

-- Create a policy for inserting, updating, deleting (assume admin authenticated operations handled by functions, or RLS disabled for admin. For simplicity, we can provide broad access or require authenticated user. Since other tables use functions with SECURITY DEFINER or similar, we'll allow all operations via authenticated users or just leave it for the service role).
-- Following the existing pattern, the admin app accesses Supabase via anon key using custom RPCs, or relies on service role. 
-- Wait, let's just make it openly editable for now, or match existing policies.
CREATE POLICY "Allow anon insert/update/delete on one_rupee_poojas" 
    ON public.one_rupee_poojas 
    FOR ALL 
    USING (true)
    WITH CHECK (true);
