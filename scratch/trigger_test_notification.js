const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseAnonKey = 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const currentDate = `${yyyy}-${mm}-${dd}`;

  const hh = String(today.getHours()).padStart(2, '0');
  const min = String(today.getMinutes()).padStart(2, '0');
  const ss = String(today.getSeconds()).padStart(2, '0');
  const currentTime = `${hh}:${min}:${ss}`;

  console.log(`Inserting test notification scheduled for: ${currentDate} ${currentTime}`);

  const { data, error } = await supabase
    .from('push_notifications')
    .insert({
      title: 'FCM Verification Test',
      body: 'Testing notification dispatch status after fixing RLS.',
      notification_type: 'generic',
      scheduled_date: currentDate,
      scheduled_time: currentTime,
      status: 'pending'
    })
    .select();

  if (error) {
    console.error('Failed to insert test notification:', error);
  } else {
    console.log('Inserted test notification:', data);
  }
}

run();
