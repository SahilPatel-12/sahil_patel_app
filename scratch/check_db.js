const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Applications/sahil_MP_app/APP/mantrapuja/.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('Retrieving last 10 push notifications...');
  const { data, error } = await supabase
    .from('push_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching push_notifications:', error);
    return;
  }

  console.log('--- Push Notifications Status ---');
  data.forEach(n => {
    console.log(`ID: ${n.id} | Title: "${n.title}" | Status: ${n.status} | Scheduled: ${n.scheduled_date} ${n.scheduled_time} | Sound: ${n.sound_name} | Recur: ${n.is_recurring}`);
  });

  console.log('\nRetrieving user push tokens...');
  const { data: tokens, error: tokenError } = await supabase
    .from('user_push_tokens')
    .select('*');

  if (tokenError) {
    console.error('Error fetching tokens:', tokenError);
  } else {
    console.log(`Total active tokens: ${tokens.length}`);
    tokens.forEach(t => {
      console.log(`Token: ${t.push_token.substring(0, 30)}... | UserID: ${t.user_id} | Platform: ${t.platform}`);
    });
  }
}

check();
