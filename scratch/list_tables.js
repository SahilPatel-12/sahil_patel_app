const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Applications/sahil_MP_app/APP/mantrapuja/.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listTables() {
  const sql = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
      console.error('Error fetching tables list:', error);
    } else {
      console.log('--- PUBLIC TABLES ---');
      console.log(data);
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

listTables();
