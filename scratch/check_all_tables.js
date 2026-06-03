const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseAnonKey = 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  try {
    console.log('Querying information_schema to list tables and columns...');
    
    // We can query information_schema via a postgres function if it exists,
    // or try querying common settings table names, or fetch all tables.
    // Let's first try to query a query that gets all tables.
    // Supabase JS doesn't allow direct SELECT from information_schema due to PostgREST security rules,
    // but let's test if we can query common settings tables like 'store_settings', 'app_config', 'homepage_hero', 'website_settings'.
    
    const tablesToTry = [
      'website_pooja_products',
      'general_poojas',
      'one_rupee_poojas',
      'problem_poojas',
      'homepage_hero',
      'store_settings',
      'website_settings',
      'app_settings',
      'api_configs'
    ];
    
    for (const table of tablesToTry) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`Table '${table}': does not exist or error (${error.message})`);
      } else {
        console.log(`Table '${table}': EXISTS! Found rows: ${data ? data.length : 0}`);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

check();
