const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Applications/sahil_MP_app/APP/mantrapuja/.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkLatestNotification() {
  console.log('Retrieving the latest push notification from database...');
  const { data, error } = await supabase
    .from('push_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('❌ Error fetching latest notification:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No notifications found in push_notifications table.');
    return;
  }

  const n = data[0];
  console.log('--- Latest Scheduled Notification ---');
  console.log('ID:', n.id);
  console.log('Title:', n.title);
  console.log('Body:', n.body);
  console.log('Status:', n.status);
  console.log('Scheduled Date:', n.scheduled_date);
  console.log('Scheduled Time:', n.scheduled_time);
  console.log('Sound Name:', n.sound_name);
  console.log('Sound URL:', n.sound_url);
  console.log('Image URL:', n.image_url);
  console.log('Is Recurring:', n.is_recurring);
  console.log('Created At:', n.created_at);
}

checkLatestNotification();
