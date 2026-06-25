const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const encryptionKey = process.env.EXPO_PUBLIC_ENCRYPTION_KEY;

if (!supabaseUrl || !supabaseAnonKey || !encryptionKey) {
  console.error('Missing configuration in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    console.log('Connecting to Supabase at:', supabaseUrl);
    
    // Fetch configs via RPC to bypass RLS
    const { data: configs, error: configsErr } = await supabase.rpc('get_api_configs');
    if (configsErr) throw configsErr;

    console.log('\n--- ACTIVE API CONFIGURATIONS ---');
    for (const config of configs) {
      if (config.is_active) {
        console.log(`\nProvider: ${config.provider}`);
        console.log(`Base URL: ${config.base_url}`);
        console.log(`Username/User ID: ${config.api_username}`);

        // Decrypt key
        const { data: decryptedKey, error: decryptErr } = await supabase.rpc('get_decrypted_api_key', {
          p_provider: config.provider,
          p_encryption_key: encryptionKey
        });

        if (decryptErr) {
          console.log(`Key Decryption Error: ${decryptErr.message}`);
        } else {
          console.log(`Decrypted API Key: ${decryptedKey}`);
        }
      }
    }
    console.log('\n---------------------------------\n');
  } catch (err) {
    console.error('Exception:', err.message || err);
  }
}

run();
