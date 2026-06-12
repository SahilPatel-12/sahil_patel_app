const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseAnonKey = 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L';
const ENCRYPTION_KEY = 'sg6XisTlL2QcXSuE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkConfigs() {
  try {
    console.log('Querying api_configs via RPC get_api_configs...');
    const { data: configs, error: configsErr } = await supabase.rpc('get_api_configs');
    
    if (configsErr) {
      console.error('Error querying configs via RPC:', configsErr);
      return;
    }

    console.log('Configs from RPC:', configs);

    if (configs && configs.length > 0) {
      for (const config of configs) {
        console.log(`Decrypting API key for provider "${config.provider}"...`);
        const { data: decryptedKey, error: decryptErr } = await supabase.rpc('get_decrypted_api_key', {
          p_provider: config.provider,
          p_encryption_key: ENCRYPTION_KEY
        });
        if (decryptErr) {
          console.error(`Failed to decrypt for ${config.provider}:`, decryptErr);
        } else {
          console.log(`Decrypted key for ${config.provider}:`, decryptedKey);
        }
      }
    } else {
      console.log('No configs returned by RPC.');
    }
  } catch (err) {
    console.error(err);
  }
}

checkConfigs();
