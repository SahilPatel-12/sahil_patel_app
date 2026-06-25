const { createClient } = require('@supabase/supabase-js');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const supabaseUrl = 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseKey = 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Adding is_visible column to public.god_thalis table...');
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: 'ALTER TABLE public.god_thalis ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true;'
    });
    console.log('Result:', { data, error });
  } catch (err) {
    console.error('System error:', err);
  }
}

run();
