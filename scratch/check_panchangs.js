const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseAnonKey = 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('Querying panchangs table...');
  try {
    const { data, error } = await supabase
      .from('panchangs')
      .select('*');
    
    if (error) {
      console.error('Database query error:', error);
    } else {
      console.log('Success! Rows in panchangs:', data.map(r => r.reference_date));
    }
  } catch (err) {
    console.error('System error:', err);
  }
}

check();
