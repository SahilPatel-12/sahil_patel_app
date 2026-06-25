const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Applications/sahil_MP_app/APP/mantrapuja/.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  try {
    const { data, error } = await supabase
      .from('website_pooja_products')
      .select('*')
      .limit(1);
    
    if (error) throw error;
    console.log('--- website_pooja_products COLUMNS ---');
    if (data && data.length > 0) {
      console.log(Object.keys(data[0]));
      console.log(data[0]);
    } else {
      console.log('No data found');
    }
  } catch (e) {
    console.error(e);
  }
}

inspect();
