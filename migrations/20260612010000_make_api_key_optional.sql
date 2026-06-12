-- Drop the NOT NULL constraint on api_key_encrypted
ALTER TABLE public.api_configs ALTER COLUMN api_key_encrypted DROP NOT NULL;

-- Update set_api_config function to handle null api keys safely
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
        CASE WHEN p_api_key IS NOT NULL AND p_api_key <> '' THEN pgp_sym_encrypt(p_api_key, p_encryption_key) ELSE NULL END,
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
