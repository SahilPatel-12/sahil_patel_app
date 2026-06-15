const { createClient } = require('@supabase/supabase-js');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const supabaseUrl = 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseKey = 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  const tables = ['one_rupee_poojas', 'general_poojas', 'website_pooja_products'];
  for (const table of tables) {
    console.log(`\n--- Columns of table: ${table} ---`);
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.error(`Error querying ${table}:`, error);
      } else if (data && data.length > 0) {
        console.log(Object.keys(data[0]));
      } else {
        console.log(`No records in ${table} to inspect columns.`);
      }
    } catch (e) {
      console.error(`System error inspecting ${table}:`, e);
    }
  }
}

inspect();
