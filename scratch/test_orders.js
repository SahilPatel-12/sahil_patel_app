const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseAnonKey = 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        app_users(
          profiles(full_name, phone, email)
        ),
        order_items(*),
        puja_booking_details(*),
        shipping_addresses(*)
      `);
    
    if (error) {
      console.error('SUPABASE QUERY ERROR:', error);
    } else {
      console.log('SUCCESS! Fetch counts:', data.length);
      if (data.length > 0) {
        console.log('Sample record user details:', data[0].app_users);
      }
    }
  } catch (err) {
    console.error('SYSTEM ERROR:', err);
  }
}

test();
