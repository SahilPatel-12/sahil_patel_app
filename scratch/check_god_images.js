const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseKey = 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('Querying public.god_images table...');
  try {
    const { data, error } = await supabase
      .from('god_images')
      .select('*');

    if (error) {
      console.error('Error querying god_images:', error);
    } else {
      console.log(`Success! Found ${data.length} records:`);
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Exception occurred:', err);
  }
}

checkDatabase();
