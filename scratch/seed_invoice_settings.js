const { createClient } = require('@supabase/supabase-js');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const supabaseUrl = 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseKey = 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Seeding global_invoice_settings into website_settings...');
  try {
    const globalSettings = {
      puja: {
        gst_percent: 0,
        discount_percent: 0,
        delivery_charge: 0,
        delivery_free_above: 0
      },
      product: {
        gst_percent: 0,
        discount_percent: 0,
        delivery_charge: 100,
        delivery_free_above: 150
      }
    };

    const { data, error } = await supabase
      .from('website_settings')
      .upsert({
        key: 'global_invoice_settings',
        value: globalSettings
      })
      .select();

    if (error) {
      console.error('Error seeding global_invoice_settings:', error);
    } else {
      console.log('Successfully seeded global_invoice_settings:', data);
    }
  } catch (err) {
    console.error('System error:', err);
  }
}

seed();
