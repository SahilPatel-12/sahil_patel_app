const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseAnonKey = 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('Querying columns for puja_booking_details table...');
  try {
    const { data, error } = await supabase
      .from('puja_booking_details')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Database query error:', error);
    } else {
      console.log('Success! Sample row returned:', data[0]);
    }
  } catch (err) {
    console.error('System error:', err);
  }
}

check();
