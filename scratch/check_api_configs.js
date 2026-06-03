const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseAnonKey = 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L';
const ENCRYPTION_KEY = 'sg6XisTlL2QcXSuE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkConfigs() {
  try {
    console.log('Querying api_configs table (select name, provider, is_active)...');
    const { data: configs, error: configsErr } = await supabase
      .from('api_configs')
      .select('id, name, provider, is_active');
    
    if (configsErr) {
      console.error('Error querying configs:', configsErr);
      return;
    }

    console.log('Configs:', configs);

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
  } catch (err) {
    console.error(err);
  }
}

checkConfigs();
