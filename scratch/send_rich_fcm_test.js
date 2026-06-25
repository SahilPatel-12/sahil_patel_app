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

async function testRichPush() {
  console.log('🔄 Resolving FCM credentials...');
  const serviceAccount = await resolveFcmServiceAccount();
  if (!serviceAccount) {
    console.error('❌ Failed to resolve FCM credentials.');
    return;
  }
  
  // Initialize firebase admin
  const app = admin.initializeApp({
    credential: admin.cert(serviceAccount)
  }, 'test-rich-app');
  
  // Fetch active tokens
  console.log('🔄 Fetching active native Android FCM tokens...');
  const { data: tokens, error } = await supabase
    .from('user_push_tokens')
    .select('*')
    .not('push_token', 'ilike', 'ExponentPushToken%')
    .eq('platform', 'android')
    .limit(1);
    
  if (error || !tokens || tokens.length === 0) {
    console.error('❌ No active Android native FCM tokens found in DB.');
    await app.delete();
    return;
  }
  
  const testToken = tokens[0].push_token;
  console.log('📬 Target Device Token:', testToken.substring(0, 35) + '...');
  
  // Custom sound and GIF payload parameters
  const title = 'Divine Chanting Session 🌸';
  const body = 'Tap to play the sacred mantras. Experience the deep spiritual aura of Mahadev.';
  const gifUrl = 'https://media.giphy.com/media/l1J9FiGx162wBALUM/giphy.gif'; // Glowing Golden Lotus animation
  const soundName = 'bell_real'; // The custom chime uploaded in your admin panel
  
  const message = {
    token: testToken,
    notification: {
      title: title,
      body: body,
      imageUrl: gifUrl
    },
    data: {
      id: 'test-rich-push-id',
      notification_type: 'generic',
      sound_name: soundName,
      image_url: gifUrl,
      sound_url: 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/notifications/sounds/pw9tpyru-1781690693063.mp3'
    },
    android: {
      notification: {
        sound: soundName,
        channelId: soundName,
        imageUrl: gifUrl
      }
    },
    apns: {
      payload: {
        aps: {
          sound: `${soundName}.mp3`
        }
      }
    }
  };
  
  console.log(`📤 Dispatching push with GIF banner & custom sound "${soundName}"...`);
  try {
    const messaging = getMessaging(app);
    const response = await messaging.send(message);
    console.log('🎉 SUCCESS! FCM accepted payload. Message ID:', response);
  } catch (err) {
    console.error('❌ Error sending FCM message:', err.message);
  } finally {
    await app.delete();
  }
}

testRichPush();
