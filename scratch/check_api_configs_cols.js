const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseAnonKey = 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('Querying columns for api_configs table...');
  try {
    const { data, error } = await supabase
      .from('api_configs')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Database query error:', error);
    } else {
      console.log('Success! Sample row returned:', data);
    }
  } catch (err) {
    console.error('System error:', err);
  }
}

check();
