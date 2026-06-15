const { createClient } = require('@supabase/supabase-js');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const supabaseUrl = 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseKey = 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing RPC calls...');
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: 'SELECT 1;'
    });
    console.log('exec_sql result:', { data, error });
  } catch (err) {
    console.error('System error:', err);
  }
}

test();
