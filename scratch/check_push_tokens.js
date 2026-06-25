const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseAnonKey = 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase
    .from('user_push_tokens')
    .select('*');

  if (error) {
    console.error(error);
  } else {
    console.log('Registered User Push Tokens:', JSON.stringify(data, null, 2));
  }
}

run();
