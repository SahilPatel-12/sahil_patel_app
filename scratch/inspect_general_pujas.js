const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Applications/sahil_MP_app/APP/mantrapuja/.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  try {
    const { data, error } = await supabase
      .from('general_poojas')
      .select('*')
      .limit(2);
    
    if (error) throw error;
    console.log('--- general_poojas COLUMNS & SAMPLES ---');
    if (data && data.length > 0) {
      console.log(Object.keys(data[0]));
      console.log(data);
    } else {
      console.log('No data found in general_poojas');
    }
  } catch (e) {
    console.error(e);
  }
}

inspect();
