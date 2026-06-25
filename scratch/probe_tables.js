const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Applications/sahil_MP_app/APP/mantrapuja/.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function probe() {
  const tables = [
    'orders',
    'order_items',
    'puja_booking_details',
    'custom_bookings',
    'custom_puja_requests',
    'puja_requests',
    'pandit_bookings',
    'astrologer_bookings',
    'inquiries',
    'user_inquiries',
    'website_inquiries'
  ];

  for (const t of tables) {
    try {
      const { data, error } = await supabase.from(t).select('*').limit(1);
      if (error) {
        console.log(`Table '${t}': ERROR/MISSING (${error.message})`);
      } else {
        console.log(`Table '${t}': EXISTS! (Sample row: ${data ? JSON.stringify(data[0]) : 'None'})`);
      }
    } catch (e) {
      console.log(`Table '${t}': EXCEPTION (${e.message})`);
    }
  }
}

probe();
