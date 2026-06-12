const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const supabaseUrl = env['EXPO_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['EXPO_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is missing from .env.local');
  process.exit(1);
}

console.log('Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);

const parsePrice = (val) => {
  if (val === undefined || val === null) return 0;
  return parseFloat(String(val).replace(/[^0-9.]/g, '')) || 0;
};

async function testResolution() {
  console.log('\n--- Starting Dynamic Item Metadata Resolution Test ---\n');

  // 1. Check one_rupee_poojas
  try {
    const { data, error } = await supabase.from('one_rupee_poojas').select('*').limit(1);
    if (error) throw error;
    if (data && data.length > 0) {
      const d = data[0];
      const resolved = {
        title: d.title,
        subtitle: d.provider || 'One Rupee Store',
        originalPrice: parsePrice(d.original_price),
        offerPrice: parsePrice(d.offer_price),
        isDeliverable: false
      };
      console.log('✅ Resolved One Rupee Store Item successfully:');
      console.log(`   ID: ${d.id}`);
      console.log(`   Mapped values:`, resolved);
    } else {
      console.log('⚠️ No rows found in one_rupee_poojas');
    }
  } catch (err) {
    console.error('❌ Failed resolving one_rupee_poojas:', err.message);
  }

  // 2. Check general_poojas
  try {
    const { data, error } = await supabase.from('general_poojas').select('*').limit(1);
    if (error) throw error;
    if (data && data.length > 0) {
      const d = data[0];
      const resolved = {
        title: d.title,
        subtitle: d.provider || 'Vedic Shrine',
        originalPrice: parsePrice(d.original_price),
        offerPrice: parsePrice(d.offer_price),
        isDeliverable: false
      };
      console.log('✅ Resolved General Puja Item successfully:');
      console.log(`   ID: ${d.id}`);
      console.log(`   Mapped values:`, resolved);
    } else {
      console.log('⚠️ No rows found in general_poojas');
    }
  } catch (err) {
    console.error('❌ Failed resolving general_poojas:', err.message);
  }

  // 3. Check website_pooja_products
  try {
    const { data, error } = await supabase.from('website_pooja_products').select('*').limit(1);
    if (error) throw error;
    if (data && data.length > 0) {
      const d = data[0];
      const resolved = {
        title: d.name,
        subtitle: d.subtitle || d.temple_association || 'Store Product',
        originalPrice: parsePrice(d.original_price),
        offerPrice: parsePrice(d.price),
        isDeliverable: true
      };
      console.log('✅ Resolved Website/Store Product successfully:');
      console.log(`   ID: ${d.id}`);
      console.log(`   Mapped values:`, resolved);
    } else {
      console.log('⚠️ No rows found in website_pooja_products');
    }
  } catch (err) {
    console.error('❌ Failed resolving website_pooja_products:', err.message);
  }

  // 4. Check problem_poojas
  try {
    const { data, error } = await supabase.from('problem_poojas').select('*').limit(1);
    if (error) throw error;
    if (data && data.length > 0) {
      const d = data[0];
      const resolved = {
        title: d.title,
        subtitle: d.provider || 'Vedic Shrine',
        originalPrice: parsePrice(d.original_price),
        offerPrice: parsePrice(d.offer_price),
        isDeliverable: false
      };
      console.log('✅ Resolved Problem Solution Puja successfully:');
      console.log(`   ID: ${d.id}`);
      console.log(`   Mapped values:`, resolved);
    } else {
      console.log('⚠️ No rows found in problem_poojas');
    }
  } catch (err) {
    console.error('❌ Failed resolving problem_poojas:', err.message);
  }

  // 5. Check offer_pujas
  try {
    const { data, error } = await supabase.from('offer_pujas').select('*').limit(1);
    if (error) throw error;
    if (data && data.length > 0) {
      const d = data[0];
      const resolved = {
        title: d.title,
        subtitle: 'Special Offer Puja',
        originalPrice: parsePrice(d.price),
        offerPrice: parsePrice(d.discounted_price),
        isDeliverable: false
      };
      console.log('✅ Resolved Special Offer Puja successfully:');
      console.log(`   ID: ${d.id}`);
      console.log(`   Mapped values:`, resolved);
    } else {
      console.log('⚠️ No rows found in offer_pujas');
    }
  } catch (err) {
    console.error('❌ Failed resolving offer_pujas:', err.message);
  }

  // 6. Check daily_pujas
  try {
    const { data, error } = await supabase.from('daily_pujas').select('*').limit(1);
    if (error) throw error;
    if (data && data.length > 0) {
      const d = data[0];
      const resolved = {
        title: d.title,
        subtitle: 'Daily Ritual',
        originalPrice: parsePrice(d.price),
        offerPrice: parsePrice(d.discounted_price),
        isDeliverable: false
      };
      console.log('✅ Resolved Daily Ritual successfully:');
      console.log(`   ID: ${d.id}`);
      console.log(`   Mapped values:`, resolved);
    } else {
      console.log('⚠️ No rows found in daily_pujas');
    }
  } catch (err) {
    console.error('❌ Failed resolving daily_pujas:', err.message);
  }
}

testResolution();
