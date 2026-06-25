const { createClient } = require('@supabase/supabase-js');
const bhajanSupabaseUrl = 'https://wsjyrvaygneejcaovglc.supabase.co';
const bhajanSupabaseAnonKey = 'sb_publishable_sq86edipSsedPGQ31t5TzA_WjB7rPQM';
const bhajanSupabase = createClient(bhajanSupabaseUrl, bhajanSupabaseAnonKey);

async function run() {
  const { data, error } = await bhajanSupabase.from('bhajans').select('id, title, category, sub_type');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Bhajans count:', data.length);
    console.log(JSON.stringify(data, null, 2));
  }
}
run();
