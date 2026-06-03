-- Create api_configs table
CREATE TABLE IF NOT EXISTS public.api_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    provider TEXT UNIQUE NOT NULL,
    api_key_encrypted BYTEA NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on api_configs table
ALTER TABLE public.api_configs ENABLE ROW LEVEL SECURITY;

-- Create policy to deny direct SELECT, INSERT, UPDATE, DELETE to anon users
CREATE POLICY "Anon users cannot access api_configs directly" ON public.api_configs
    FOR ALL TO anon USING (false);

-- Create a secure RPC function to set/upsert API configurations
CREATE OR REPLACE FUNCTION set_api_config(
    p_name TEXT,
    p_provider TEXT,
    p_api_key TEXT,
    p_encryption_key TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.api_configs (name, provider, api_key_encrypted)
    VALUES (
        p_name,
        p_provider,
        pgp_sym_encrypt(p_api_key, p_encryption_key)
    )
    ON CONFLICT (provider)
    DO UPDATE SET
        name = EXCLUDED.name,
        api_key_encrypted = CASE WHEN p_api_key IS NOT NULL AND p_api_key <> '' THEN EXCLUDED.api_key_encrypted ELSE api_configs.api_key_encrypted END,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a secure RPC function to retrieve API configuration metadata
-- This safely checks if a key is configured without exposing the encrypted key to the client
CREATE OR REPLACE FUNCTION get_api_configs()
RETURNS TABLE (
    id UUID,
    name TEXT,
    provider TEXT,
    is_active BOOLEAN,
    is_configured BOOLEAN,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT a.id, a.name, a.provider, a.is_active, (a.api_key_encrypted IS NOT NULL) AS is_configured, a.updated_at
    FROM public.api_configs a;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a secure RPC function to delete/remove an API configuration
CREATE OR REPLACE FUNCTION delete_api_config(p_provider TEXT)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.api_configs
    WHERE provider = p_provider;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a secure RPC function to decrypt and retrieve the API key for backend/client usage
-- This requires passing the correct encryption key parameter
CREATE OR REPLACE FUNCTION get_decrypted_api_key(
    p_provider TEXT,
    p_encryption_key TEXT
) RETURNS TEXT AS $$
DECLARE
    v_encrypted BYTEA;
    v_decrypted BYTEA;
BEGIN
    SELECT api_key_encrypted INTO v_encrypted
    FROM public.api_configs
    WHERE provider = p_provider;

    IF v_encrypted IS NULL THEN
        RETURN NULL;
    END IF;

    -- Decrypt the key using pgp_sym_decrypt
    -- If the key is invalid, this will throw an exception
    BEGIN
        RETURN pgp_sym_decrypt(v_encrypted, p_encryption_key);
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Decryption failed. Invalid encryption key.';
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
