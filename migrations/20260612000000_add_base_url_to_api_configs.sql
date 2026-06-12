-- Alter api_configs table to add base_url and api_username
ALTER TABLE public.api_configs ADD COLUMN IF NOT EXISTS base_url TEXT;
ALTER TABLE public.api_configs ADD COLUMN IF NOT EXISTS api_username TEXT;

-- Update set_api_config RPC function to accept base_url and api_username
CREATE OR REPLACE FUNCTION set_api_config(
    p_name TEXT,
    p_provider TEXT,
    p_api_key TEXT,
    p_encryption_key TEXT,
    p_base_url TEXT DEFAULT NULL,
    p_api_username TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.api_configs (name, provider, api_key_encrypted, base_url, api_username)
    VALUES (
        p_name,
        p_provider,
        pgp_sym_encrypt(p_api_key, p_encryption_key),
        p_base_url,
        p_api_username
    )
    ON CONFLICT (provider)
    DO UPDATE SET
        name = EXCLUDED.name,
        api_key_encrypted = CASE WHEN p_api_key IS NOT NULL AND p_api_key <> '' THEN EXCLUDED.api_key_encrypted ELSE api_configs.api_key_encrypted END,
        base_url = EXCLUDED.base_url,
        api_username = EXCLUDED.api_username,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_api_configs RPC function to return base_url and api_username
CREATE OR REPLACE FUNCTION get_api_configs()
RETURNS TABLE (
    id UUID,
    name TEXT,
    provider TEXT,
    base_url TEXT,
    api_username TEXT,
    is_active BOOLEAN,
    is_configured BOOLEAN,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT a.id, a.name, a.provider, a.base_url, a.api_username, a.is_active, (a.api_key_encrypted IS NOT NULL) AS is_configured, a.updated_at
    FROM public.api_configs a;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
