const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseAnonKey = 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  try {
    console.log('Querying website_pooja_products...');
    const { data: prodData, error: prodErr } = await supabase
      .from('website_pooja_products')
      .select('*')
      .limit(1);

    if (prodErr) {
      console.error('Error fetching website_pooja_products:', prodErr);
    } else {
      console.log('website_pooja_products sample row:');
      if (prodData && prodData[0]) {
        for (const [key, val] of Object.entries(prodData[0])) {
          console.log(`- ${key}: ${val === null ? 'NULL' : typeof val} (sample: ${JSON.stringify(val)})`);
        }
      } else {
        console.log('No rows found in website_pooja_products');
      }
    }

    console.log('\nQuerying website_settings...');
    const { data: setRecs, error: setErr } = await supabase
      .from('website_settings')
      .select('*');

    if (setErr) {
      console.error('Error fetching website_settings:', setErr);
    } else {
      console.log('website_settings rows:');
      if (setRecs) {
        setRecs.forEach(r => {
          console.log(`- key: ${r.key}, value type: ${typeof r.value}, sample: ${JSON.stringify(r.value)}`);
        });
      }
    }
  } catch (err) {
    console.error(err);
  }
}

check();
