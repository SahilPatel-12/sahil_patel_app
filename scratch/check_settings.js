const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseAnonKey = 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  try {
    console.log('Querying website_settings...');
    const { data, error } = await supabase
      .from('website_settings')
      .select('*');
    
    if (error) {
      console.error('Error fetching settings:', error);
      return;
    }
    
    console.log('Found website_settings:', data);
  } catch (err) {
    console.error(err);
  }
}

check();
