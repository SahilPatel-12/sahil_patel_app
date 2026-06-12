const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseAnonKey = 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L';
const ENCRYPTION_KEY = 'sg6XisTlL2QcXSuE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const configsToSet = [
  {
    name: 'General Astrology API',
    provider: 'astrology_api',
    apiKey: 'ak-78d22f4e9a7680c4ac68ce28053f9d09fd3d56bf',
    baseUrl: 'https://json.astrologyapi.com/v1',
    apiUsername: '652693'
  },
  {
    name: 'Dedicated Vedic Panchang API',
    provider: 'panchang_api',
    apiKey: 'ak-78d22f4e9a7680c4ac68ce28053f9d09fd3d56bf',
    baseUrl: 'https://json.astrologyapi.com/v1',
    apiUsername: '652693'
  },
  {
    name: 'Dedicated Rashifal API',
    provider: 'rashifal_api',
    apiKey: 'ak-78d22f4e9a7680c4ac68ce28053f9d09fd3d56bf',
    baseUrl: 'https://json.astrologyapi.com/v1',
    apiUsername: '652693'
  },
  {
    name: 'Dedicated Janam Kundli API',
    provider: 'kundli_api',
    apiKey: 'ak-78d22f4e9a7680c4ac68ce28053f9d09fd3d56bf',
    baseUrl: 'https://json.astrologyapi.com/v1',
    apiUsername: '652693'
  }
];

async function updateConfigs() {
  for (const cfg of configsToSet) {
    console.log(`Setting config for ${cfg.provider}...`);
    try {
      const { data, error } = await supabase.rpc('set_api_config', {
        p_name: cfg.name,
        p_provider: cfg.provider,
        p_api_key: cfg.apiKey,
        p_encryption_key: ENCRYPTION_KEY,
        p_base_url: cfg.baseUrl,
        p_api_username: cfg.apiUsername
      });

      if (error) {
        console.error(`Error setting ${cfg.provider}:`, error);
      } else {
        console.log(`Successfully set config for ${cfg.provider}`);
      }

      // Also ensure it is marked as is_active in the table
      const { error: activeErr } = await supabase
        .from('api_configs')
        .update({ is_active: true })
        .eq('provider', cfg.provider);

      if (activeErr) {
        console.error(`Error activating ${cfg.provider}:`, activeErr);
      } else {
        console.log(`Activated ${cfg.provider}`);
      }
    } catch (err) {
      console.error(`Exception setting ${cfg.provider}:`, err);
    }
  }
}

updateConfigs();
