const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Initialize Supabase Client for the Dispatcher
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ [Notification Dispatcher] Supabase credentials missing in environment. Dispatcher inactive.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

let isProcessing = false;

/**
 * Periodically polls the push_notifications table and dispatches pending notifications.
 */
async function checkAndDispatchNotifications() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    // 1. Get current local date and time YYYY-MM-DD and HH:MM:SS
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

    // 2. Query all pending notifications
    const { data: pendingNotifications, error } = await supabase
      .from('push_notifications')
      .select('*')
      .eq('status', 'pending');

    if (error) {
      console.error('❌ [Notification Dispatcher] Error fetching pending notifications:', error.message);
      isProcessing = false;
      return;
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      isProcessing = false;
      return;
    }

    // 3. Filter notifications whose scheduled date/time is past or current
    const notificationsToDispatch = pendingNotifications.filter(noti => {
      const notiDateTime = `${noti.scheduled_date}T${noti.scheduled_time}`;
      return notiDateTime <= nowDateTime;
    });

    if (notificationsToDispatch.length === 0) {
      isProcessing = false;
      return;
    }

    console.log(`🚀 [Notification Dispatcher] Found ${notificationsToDispatch.length} notifications to dispatch.`);

    // 4. Load all registered user push tokens
    const { data: tokensData, error: tokensErr } = await supabase
      .from('user_push_tokens')
      .select('push_token, user_id');

    if (tokensErr) {
      console.error('❌ [Notification Dispatcher] Error loading registered push tokens:', tokensErr.message);
      isProcessing = false;
      return;
    }

    const uniqueTokens = [...new Set((tokensData || []).map(t => t.push_token))];

    for (const noti of notificationsToDispatch) {
      console.log(`📬 [Notification Dispatcher] Dispatching notification ID ${noti.id}: "${noti.title}"`);

      // 5. Handle Reward Coins Type
      if (noti.notification_type === 'coins' && noti.coin_amount > 0) {
        try {
          console.log(`🪙 [Notification Dispatcher] Distributing ${noti.coin_amount} coins to all users.`);
          
          // Get all users
          const { data: users, error: usersErr } = await supabase
            .from('app_users')
            .select('id');

          if (usersErr) throw usersErr;

          if (users && users.length > 0) {
            for (const user of users) {
              // Get current wallet balance
              const { data: wallet } = await supabase
                .from('user_wallets')
                .select('balance')
                .eq('user_id', user.id)
                .maybeSingle();

              if (wallet) {
                const newBalance = wallet.balance + noti.coin_amount;
                await supabase
                  .from('user_wallets')
                  .update({ balance: newBalance, updated_at: new Date().toISOString() })
                  .eq('user_id', user.id);
              } else {
                await supabase
                  .from('user_wallets')
                  .insert({ user_id: user.id, balance: 50 + noti.coin_amount });
              }

              // Create coin transaction record
              await supabase
                .from('coin_transactions')
                .insert({
                  user_id: user.id,
                  amount: noti.coin_amount,
                  type: 'admin_adjustment', // Matches allowed standard types
                  created_at: new Date().toISOString()
                });
            }
            console.log(`🪙 [Notification Dispatcher] Successfully credited wallets for ${users.length} users.`);
          }
        } catch (coinErr) {
          console.error(`❌ [Notification Dispatcher] Error processing coin distribution for ID ${noti.id}:`, coinErr.message);
        }
      }

      // 6. Send push notifications to Expo Push API
      if (uniqueTokens.length > 0) {
        // Build message payload for each token
        const messages = uniqueTokens.map(token => ({
          to: token,
          sound: 'default',
          title: noti.title,
          body: noti.body,
          data: {
            id: noti.id,
            notification_type: noti.notification_type,
            target_vrat_id: noti.target_vrat_id,
            coin_amount: noti.coin_amount
          },
          // Format image attachment if provided
          attachments: noti.image_url ? [
            {
              identifier: 'image',
              url: noti.image_url,
              type: 'image/jpeg'
            }
          ] : []
        }));

        // Chunk messages into groups of 100 (Expo limits batch payloads to 100 messages)
        const chunks = [];
        for (let i = 0; i < messages.length; i += 100) {
          chunks.push(messages.slice(i, i + 100));
        }

        // Send requests to Expo API
        for (let i = 0; i < chunks.length; i++) {
          try {
            console.log(`📤 [Notification Dispatcher] Sending chunk ${i + 1}/${chunks.length} containing ${chunks[i].length} targets...`);
            const response = await axios.post('https://exp.host/--/api/v2/push/send', chunks[i], {
              headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
              }
            });
            console.log(`✅ [Notification Dispatcher] Chunk ${i + 1} sent:`, response.data);
          } catch (apiErr) {
            console.error(`❌ [Notification Dispatcher] Failed to send chunk ${i + 1}:`, apiErr.message);
          }
        }
      } else {
        console.log(`⚠️ [Notification Dispatcher] No active push tokens registered. Dispatching 0 notifications.`);
      }

      // 7. Update status to 'sent'
      const { error: updateErr } = await supabase
        .from('push_notifications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', noti.id);

      if (updateErr) {
        console.error(`❌ [Notification Dispatcher] Failed to update status for notification ${noti.id}:`, updateErr.message);
      } else {
        console.log(`✅ [Notification Dispatcher] Marked notification ${noti.id} as "sent".`);
      }
    }
  } catch (err) {
    console.error('❌ [Notification Dispatcher] Critical error in checkAndDispatchNotifications:', err);
  } finally {
    isProcessing = false;
  }
}

/**
 * Initializes and starts the background dispatch worker.
 */
function startNotificationDispatcher() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('⚠️ [Notification Dispatcher] Background dispatcher is inactive due to missing credentials.');
    return;
  }

  console.log('🔌 [Notification Dispatcher] Starting notification dispatch loop (polling every 30s)...');
  
  // Run once immediately on startup
  checkAndDispatchNotifications();

  // Schedule periodic checks
  setInterval(checkAndDispatchNotifications, 30000);
}

module.exports = {
  startNotificationDispatcher,
  checkAndDispatchNotifications
};
