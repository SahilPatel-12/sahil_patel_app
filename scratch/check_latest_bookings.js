const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkLatestBookings() {
  console.log("Checking table: website_store_pundit_bookings (Latest 3)...");
  const { data: punditBookings, error: err1 } = await supabase
    .from('website_store_pundit_bookings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  if (err1) {
    console.error("Error querying website_store_pundit_bookings:", err1.message);
  } else {
    console.log("website_store_pundit_bookings entries found:", punditBookings.length);
    console.log(JSON.stringify(punditBookings, null, 2));
  }

  console.log("\nChecking table: puja_booking_details join with orders (Latest 3)...");
  const { data: pujaDetails, error: err2 } = await supabase
    .from('puja_booking_details')
    .select('*, orders(*)')
    .order('created_at', { ascending: false })
    .limit(3);

  if (err2) {
    console.error("Error querying puja_booking_details:", err2.message);
  } else {
    console.log("puja_booking_details entries found:", pujaDetails.length);
    console.log(JSON.stringify(pujaDetails, null, 2));
  }
}

checkLatestBookings();
