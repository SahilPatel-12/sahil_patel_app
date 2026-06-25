const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Applications/sahil_MP_app/APP/mantrapuja/.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function probe() {
  const tables = [
    'general_poojas',
    'one_rupee_poojas',
    'problem_poojas',
    'combo_poojas',
    'website_pooja_products'
  ];

  for (const t of tables) {
    try {
      const { data, error } = await supabase.from(t).select('*').limit(1);
      if (error) {
        console.log(`Table '${t}': ERROR/MISSING (${error.message})`);
      } else {
        console.log(`Table '${t}': EXISTS! Found rows: ${data ? data.length : 0} | Sample: ${data && data[0] ? data[0].title || data[0].name : 'None'}`);
      }
    } catch (e) {
      console.log(`Table '${t}': EXCEPTION (${e.message})`);
    }
  }
}

probe();
