const { createClient } = require('@supabase/supabase-js');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const supabaseUrl = 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseKey = 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L';
const supabase = createClient(supabaseUrl, supabaseKey);

async function clearCombos() {
  console.log('Clearing all entries from combo_poojas table...');
  try {
    const { data, error } = await supabase
      .from('combo_poojas')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all
    
    if (error) {
      console.error('Error clearing combo_poojas:', error);
      process.exit(1);
    } else {
      console.log('Successfully cleared all combo poojas!');
      process.exit(0);
    }
  } catch (err) {
    console.error('System error:', err);
    process.exit(1);
  }
}

clearCombos();
