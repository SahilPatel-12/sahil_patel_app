const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in env vars!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTable() {
  console.log("Querying table: website_store_pundits...");
  const { data, error } = await supabase
    .from('website_store_pundits')
    .select('*')
    .limit(3);

  if (error) {
    console.error("Error querying table website_store_pundits:", error);
    
    console.log("Trying to query default pandits table...");
    const { data: pData, error: pErr } = await supabase.from('pandits').select('*').limit(3);
    if (pErr) {
      console.error("Error querying 'pandits' table:", pErr);
    } else {
      console.log("Success with 'pandits' table! Data sample:", JSON.stringify(pData, null, 2));
    }
  } else {
    console.log("Successfully fetched data from website_store_pundits! Sample:");
    console.log(JSON.stringify(data, null, 2));
  }
}

checkTable();
