const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Applications/sahil_MP_app/APP/mantrapuja/.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSounds() {
  console.log('Retrieving all registered notification sounds...');
  const { data: sounds, error } = await supabase
    .from('notification_sounds')
    .select('*');

  if (error) {
    console.error('❌ Error fetching sounds:', error.message);
  } else {
    console.log('--- Registered Sounds in Supabase ---');
    sounds.forEach(s => {
      console.log(`ID: ${s.id} | Name: "${s.name}" | Filename: "${s.filename}" | URL: ${s.file_url}`);
    });
  }
}

checkSounds();
