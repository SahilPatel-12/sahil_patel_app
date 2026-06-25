const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Applications/sahil_MP_app/APP/mantrapuja/.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  try {
    const { data, error } = await supabase
      .from('category_by_product')
      .select('*');
    
    if (error) throw error;
    console.log('--- category_by_product CATEGORIES ---');
    console.log(data);
  } catch (e) {
    console.error(e);
  }
}

inspect();
