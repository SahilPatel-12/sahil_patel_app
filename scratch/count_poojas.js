const { createClient } = require('@supabase/supabase-js');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const supabaseUrl = 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseKey = 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L';
const supabase = createClient(supabaseUrl, supabaseKey);

async function count() {
  const { data, count, error } = await supabase
    .from('general_poojas')
    .select('id, title', { count: 'exact' });
  
  if (error) {
    console.error('Error fetching general_poojas:', error);
  } else {
    console.log(`general_poojas count: ${count}`);
    console.log('Entries:');
    data.forEach((p, idx) => console.log(`${idx + 1}. ${p.title} (ID: ${p.id})`));
  }
}

count();
