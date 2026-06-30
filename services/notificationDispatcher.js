const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const admin = require('firebase-admin');

// Initialize Supabase Client for the Dispatcher
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ [Notification Dispatcher] Supabase credentials missing in environment. Dispatcher inactive.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

let isProcessing = false;
let firebaseApp = null;

/**
 * Initializes/resolves the Firebase Admin App instance dynamically using decrypted credentials.
 */
function getFirebaseAdminApp(serviceAccount) {
  if (firebaseApp) return firebaseApp;

  // Check if there is already a default app initialized
  const existingApp = admin.getApps().find(app => app.name === '[DEFAULT]');
  if (existingApp) {
    firebaseApp = existingApp;
    return firebaseApp;
  }

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.cert(serviceAccount)
    });
    console.log('🔥 [Notification Dispatcher] Firebase Admin SDK initialized successfully.');
    return firebaseApp;
  } catch (err) {
    console.error('❌ [Notification Dispatcher] Failed to initialize Firebase Admin:', err.message);
    throw err;
  }
}

/**
 * Fetches and decrypts FCM Service Account JSON configuration from Supabase.
 */
async function resolveFcmServiceAccount() {
  const encryptionKey = process.env.EXPO_PUBLIC_ENCRYPTION_KEY || process.env.VITE_ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('Encryption key is missing in environment variables.');
  }
  if (encryptionKey.length < 16) {
    throw new Error('Encryption key must be at least 16 characters long.');
  }
  try {
    const { data: configs, error: configsErr } = await supabase.rpc('get_api_configs');

    if (configsErr) {
      console.error('❌ [Notification Dispatcher] Error querying api_configs for FCM:', configsErr.message);
      return null;
    }

    const config = configs ? configs.find(c => c.provider === 'firebase_fcm') : null;

    if (!config || !config.is_active) {
      console.warn('⚠️ [Notification Dispatcher] firebase_fcm configuration is inactive or not found in database.');
      return null;
    }

    const { data: decryptedKey, error: decryptErr } = await supabase.rpc('get_decrypted_api_key', {
      p_provider: 'firebase_fcm',
      p_encryption_key: encryptionKey
    });

    if (decryptErr) {
      console.error('❌ [Notification Dispatcher] Failed to decrypt FCM credentials JSON:', decryptErr.message);
      return null;
    }

    if (!decryptedKey) {
      console.warn('⚠️ [Notification Dispatcher] Decrypted FCM key is empty.');
      return null;
    }

    const parsedCredentials = JSON.parse(decryptedKey);
    return parsedCredentials;
  } catch (err) {
    console.error('❌ [Notification Dispatcher] Error resolving FCM Service Account:', err.message);
    return null;
  }
}

/**
 * Helper to add 1 day to YYYY-MM-DD string avoiding local timezone shifts.
 */
function addOneDay(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

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
      .select('push_token, user_id, platform');

    if (tokensErr) {
      console.error('❌ [Notification Dispatcher] Error loading registered push tokens:', tokensErr.message);
      isProcessing = false;
      return;
    }

    const uniqueTokens = tokensData || [];
    
    // De-duplicate by push_token string
    const seenTokens = new Set();
    const deduplicatedTokens = [];
    for (const t of uniqueTokens) {
      if (!seenTokens.has(t.push_token)) {
        seenTokens.add(t.push_token);
        deduplicatedTokens.push(t);
      }
    }

    // Split tokens by push mechanism
    const expoTokens = deduplicatedTokens
      .filter(t => t.push_token.startsWith('ExponentPushToken'))
      .map(t => t.push_token);

    const fcmTokens = deduplicatedTokens
      .filter(t => !t.push_token.startsWith('ExponentPushToken') && t.platform === 'android')
      .map(t => t.push_token);

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
                  type: 'admin_adjustment',
                  created_at: new Date().toISOString()
                });
            }
            console.log(`🪙 [Notification Dispatcher] Successfully credited wallets for ${users.length} users.`);
          }
        } catch (coinErr) {
          console.error(`❌ [Notification Dispatcher] Error processing coin distribution for ID ${noti.id}:`, coinErr.message);
        }
      }

      // 6. Send push notifications
      let dispatchStatus = 'sent';

      // 6A. Send via FCM HTTP v1 (Android native)
      if (fcmTokens.length > 0) {
        try {
          const serviceAccount = await resolveFcmServiceAccount();
          if (serviceAccount) {
            const fcmApp = getFirebaseAdminApp(serviceAccount);
            const { getMessaging } = require('firebase-admin/messaging');
            const messaging = getMessaging(fcmApp);

            // Chunk FCM tokens by 500
            const fcmChunks = [];
            for (let i = 0; i < fcmTokens.length; i += 500) {
              fcmChunks.push(fcmTokens.slice(i, i + 500));
            }

            for (let i = 0; i < fcmChunks.length; i++) {
              const tokensChunk = fcmChunks[i];
              const soundFileForAndroid = 'bell_sound';
              const channelIdForAndroid = 'bell_sound_v2';
              const soundFileForApns = 'default';

              const message = {
                tokens: tokensChunk,
                notification: {
                  title: noti.title,
                  body: noti.body
                },
                data: {
                  id: String(noti.id),
                  notification_type: String(noti.notification_type),
                  target_vrat_id: noti.target_vrat_id ? String(noti.target_vrat_id) : '',
                  coin_amount: noti.coin_amount ? String(noti.coin_amount) : '',
                  sound_name: noti.sound_name ? String(noti.sound_name) : 'default',
                  sound_url: noti.sound_url ? String(noti.sound_url) : '',
                },
                android: {
                  notification: {
                    sound: soundFileForAndroid,
                    channel_id: channelIdForAndroid
                  }
                },
                apns: {
                  payload: {
                    aps: {
                      sound: soundFileForApns
                    }
                  }
                }
              };

              if (noti.image_url) {
                message.notification.imageUrl = noti.image_url;
                message.data.image_url = noti.image_url;
                message.android.notification.image = noti.image_url;
              }

              console.log(`📤 [Notification Dispatcher] Sending FCM HTTP v1 chunk ${i + 1}/${fcmChunks.length} containing ${tokensChunk.length} targets...`);
              const response = await messaging.sendEachForMulticast(message);
              console.log(`✅ [Notification Dispatcher] FCM Chunk ${i + 1} sent: successCount=${response.successCount}, failureCount=${response.failureCount}`);

              // Automatic Cleanup of Invalid/Inactive Tokens
              if (response.failureCount > 0) {
                const tokensToRemove = [];
                response.responses.forEach((res, idx) => {
                  if (!res.success) {
                    const errCode = res.error?.code;
                    console.warn(`⚠️ [Notification Dispatcher] FCM Token delivery failed for token [${tokensChunk[idx].substring(0, 15)}...]:`, errCode, res.error?.message);
                    if (
                      errCode === 'messaging/registration-token-not-registered' || 
                      errCode === 'messaging/invalid-argument'
                    ) {
                      tokensToRemove.push(tokensChunk[idx]);
                    }
                  }
                });

                if (tokensToRemove.length > 0) {
                  console.log(`🧹 [Notification Dispatcher] Automatically cleaning up ${tokensToRemove.length} inactive FCM tokens...`);
                  const { error: cleanErr } = await supabase
                    .from('user_push_tokens')
                    .delete()
                    .in('push_token', tokensToRemove);
                  
                  if (cleanErr) {
                    console.error('❌ [Notification Dispatcher] Failed to clean up invalid tokens:', cleanErr.message);
                  } else {
                    console.log('✅ [Notification Dispatcher] Cleaned up invalid tokens successfully.');
                  }
                }
              }
            }
          } else {
            console.log(`⚠️ [Notification Dispatcher] FCM tokens registered but credentials unconfigured/inactive in Settings. Skipping FCM dispatch.`);
            dispatchStatus = 'failed';
          }
        } catch (fcmErr) {
          console.error(`❌ [Notification Dispatcher] FCM dispatch sequence failed:`, fcmErr.message);
          dispatchStatus = 'failed';
        }
      }

      // 6B. Send via Expo Push API (Fallback for legacy Expo tokens)
      if (expoTokens.length > 0) {
        try {
          const messages = expoTokens.map(token => {
            const soundFile = noti.sound_name && noti.sound_name !== 'default'
              ? `${noti.sound_name}.mp3`
              : 'default';
            return {
              to: token,
              sound: soundFile,
              channelId: noti.sound_name || 'default',
              title: noti.title,
              body: noti.body,
              data: {
                id: noti.id,
                notification_type: noti.notification_type,
                target_vrat_id: noti.target_vrat_id,
                coin_amount: noti.coin_amount,
                sound_name: noti.sound_name || 'default',
                sound_url: noti.sound_url || '',
              },
              attachments: noti.image_url ? [
                {
                  identifier: 'image',
                  url: noti.image_url,
                  type: noti.image_url.toLowerCase().endsWith('.gif') ? 'image/gif' : 'image/jpeg'
                }
              ] : []
            };
          });

          const chunks = [];
          for (let i = 0; i < messages.length; i += 100) {
            chunks.push(messages.slice(i, i + 100));
          }

          for (let i = 0; i < chunks.length; i++) {
            console.log(`📤 [Notification Dispatcher] Sending Expo chunk ${i + 1}/${chunks.length} containing ${chunks[i].length} targets...`);
            const response = await axios.post('https://exp.host/--/api/v2/push/send', chunks[i], {
              headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
              }
            });
            console.log(`✅ [Notification Dispatcher] Expo Chunk ${i + 1} sent:`, response.data);
          }
        } catch (expoErr) {
          console.error(`❌ [Notification Dispatcher] Expo dispatch sequence failed:`, expoErr.message);
          dispatchStatus = 'failed';
        }
      }

      if (fcmTokens.length === 0 && expoTokens.length === 0) {
        console.log(`⚠️ [Notification Dispatcher] No active push tokens registered. Dispatching 0 notifications.`);
      }

      // 7. Update status or Reschedule if recurring
      if (noti.is_recurring && dispatchStatus === 'sent') {
        const nextDate = addOneDay(noti.scheduled_date);
        console.log(`🔁 [Notification Dispatcher] Notification ${noti.id} is recurring. Rescheduling for tomorrow: ${nextDate}`);
        const { error: updateErr } = await supabase
          .from('push_notifications')
          .update({
            scheduled_date: nextDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', noti.id);
        
        if (updateErr) {
          console.error(`❌ [Notification Dispatcher] Failed to reschedule recurring notification ${noti.id}:`, updateErr.message);
        } else {
          console.log(`✅ [Notification Dispatcher] Successfully rescheduled recurring notification ${noti.id} to ${nextDate}.`);
        }
      } else {
        const { error: updateErr } = await supabase
          .from('push_notifications')
          .update({
            status: dispatchStatus,
            sent_at: dispatchStatus === 'sent' ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', noti.id);

        if (updateErr) {
          console.error(`❌ [Notification Dispatcher] Failed to update status for notification ${noti.id}:`, updateErr.message);
        } else {
          console.log(`✅ [Notification Dispatcher] Marked notification ${noti.id} as "${dispatchStatus}".`);
        }
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
  checkAndDispatchNotifications,
  resolveFcmServiceAccount
};
