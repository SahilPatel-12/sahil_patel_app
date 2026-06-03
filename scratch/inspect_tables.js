const { createClient } = require('@supabase/supabase-js');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const supabaseUrl = 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseKey = 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  try {
    console.log('--- category_by_product categories ---');
    const { data: catData, error: catErr } = await supabase
      .from('category_by_product')
      .select('id, category');
    if (catErr) console.error(catErr);
    else console.log(catData);

    console.log('\n--- combo_poojas items count ---');
    const { data: comboData, error: comboErr } = await supabase
      .from('combo_poojas')
      .select('id, title, price, original_price');
    if (comboErr) console.error(comboErr);
    else console.log(comboData);
  } catch (e) {
    console.error(e);
  }
}

inspect();
