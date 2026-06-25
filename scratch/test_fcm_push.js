require('dotenv').config({ path: '/Applications/sahil_MP_app/APP/mantrapuja/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const admin = require('firebase-admin');
const { getMessaging } = require('firebase-admin/messaging');
const { resolveFcmServiceAccount } = require('../services/notificationDispatcher');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPush() {
  console.log('🔄 Resolving FCM credentials from Supabase API configurations...');
  const serviceAccount = await resolveFcmServiceAccount();
  if (!serviceAccount) {
    console.error('❌ Failed to resolve FCM credentials. Check if your encryption key is correct and firebase_fcm settings are active.');
    return;
  }
  
  console.log('✅ FCM Credentials resolved successfully for project:', serviceAccount.project_id);
  
  // Initialize firebase admin
  const app = admin.initializeApp({
    credential: admin.cert(serviceAccount)
  }, 'test-app');
  
  // Fetch active tokens
  console.log('🔄 Fetching active native Android FCM tokens from database...');
  const { data: tokens, error } = await supabase
    .from('user_push_tokens')
    .select('*')
    .not('push_token', 'ilike', 'ExponentPushToken%')
    .eq('platform', 'android')
    .limit(1);
    
  if (error) {
    console.error('❌ Error fetching tokens from Supabase:', error.message);
    await app.delete();
    return;
  }

  if (!tokens || tokens.length === 0) {
    console.warn('⚠️ No active Android native FCM tokens found in DB. Please open the app on your Android device first so it registers a token.');
    await app.delete();
    return;
  }
  
  const testToken = tokens[0].push_token;
  console.log('📬 Selected Test Token:', testToken.substring(0, 35) + '...');
  
  const message = {
    token: testToken,
    notification: {
      title: 'Divine Chime Test 🌸',
      body: 'Testing system tray notification banner & custom sound channelId.'
    },
    data: {
      sound_name: 'bell_real',
      sound_url: 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/notifications/bell_sound.mp3'
    },
    android: {
      notification: {
        sound: 'bell_real',
        channelId: 'bell_real'
      }
    }
  };
  
  console.log('📤 Dispatching FCM message to Google servers...');
  try {
    const messaging = getMessaging(app);
    const response = await messaging.send(message);
    console.log('🎉 SUCCESS! FCM message accepted by Google. Message ID:', response);
  } catch (err) {
    console.error('❌ Error sending FCM message:', err.message);
  } finally {
    await app.delete();
  }
}

testPush();
