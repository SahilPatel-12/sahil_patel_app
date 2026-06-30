const fs = require('fs');
const path = require('path');

// 1. Parse .env.local
const envPath = '/Applications/sahil_MP_app/APP/mantrapuja/.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value;
  }
});

const supabaseUrl = env['EXPO_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = env['EXPO_PUBLIC_SUPABASE_ANON_KEY'];

console.log('Supabase URL:', supabaseUrl);

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const currentDate = `${yyyy}-${mm}-${dd}`;

  const hh = String(today.getHours()).padStart(2, '0');
  const min = String(today.getMinutes()).padStart(2, '0');
  const ss = String(today.getSeconds()).padStart(2, '0');
  const currentTime = `${hh}:${min}:${ss}`;

  const nowDateTime = `${currentDate}T${currentTime}`;

  console.log('--- Current Server DateTime ---');
  console.log('Date:', currentDate);
  console.log('Time:', currentTime);
  console.log('String:', nowDateTime);
  console.log('Timezone Offset:', today.getTimezoneOffset());

  // Query pending
  const { data: pendingNotifications, error } = await supabase
    .from('push_notifications')
    .select('*')
    .eq('status', 'pending');

  if (error) {
    console.error('Error fetching pending notifications:', error.message);
    return;
  }

  console.log(`\nFound ${pendingNotifications.length} pending notifications in database.`);

  pendingNotifications.forEach(noti => {
    const notiDateTime = `${noti.scheduled_date}T${noti.scheduled_time}`;
    const shouldDispatch = notiDateTime <= nowDateTime;
    console.log(`\nNotification ID: ${noti.id}`);
    console.log(`Title: "${noti.title}"`);
    console.log(`Scheduled DateTime: ${notiDateTime}`);
    console.log(`Comparison: "${notiDateTime}" <= "${nowDateTime}" -> ${shouldDispatch}`);
  });
}

main();
