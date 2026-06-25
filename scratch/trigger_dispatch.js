require('dotenv').config({ path: '/Applications/sahil_MP_app/APP/mantrapuja/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { checkAndDispatchNotifications } = require('../services/notificationDispatcher');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function trigger() {
  const notiId = 'c1de4e26-6400-4b4a-9ea1-3f96b34751c5';
  console.log(`🔄 Updating status of notification ID ${notiId} to 'pending' with current time...`);

  // Get current date/time to force immediate dispatch
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const currentDate = `${yyyy}-${mm}-${dd}`;

  const hh = String(today.getHours()).padStart(2, '0');
  const min = String(today.getMinutes()).padStart(2, '0');
  const ss = String(today.getSeconds()).padStart(2, '0');
  const currentTime = `${hh}:${min}:${ss}`;

  const { data, error } = await supabase
    .from('push_notifications')
    .update({
      status: 'pending',
      scheduled_date: currentDate,
      scheduled_time: currentTime,
      updated_at: new Date().toISOString()
    })
    .eq('id', notiId)
    .select('*');

  if (error) {
    console.error('❌ Error updating notification:', error.message);
    return;
  }

  console.log('✅ Notification updated successfully:', data[0]);
  
  console.log('🚀 Triggering manual background dispatcher check...');
  try {
    await checkAndDispatchNotifications();
    console.log('✅ Manual dispatch trigger complete.');
  } catch (err) {
    console.error('❌ Error executing dispatch sequence:', err.message);
  }
}

trigger();
