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
const encryptionKey = env['EXPO_PUBLIC_SUPABASE_URL'] ? (env['EXPO_PUBLIC_ENCRYPTION_KEY'] || env['VITE_ENCRYPTION_KEY']) : '';

console.log('Supabase URL:', supabaseUrl);

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  // Get the latest token
  const { data: tokens, error: tokensErr } = await supabase
    .from('user_push_tokens')
    .select('*')
    .eq('platform', 'android')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (tokensErr) {
    console.error('Error fetching latest token:', tokensErr.message);
    return;
  }

  if (!tokens || tokens.length === 0) {
    console.error('No registered Android push tokens found in Supabase.');
    return;
  }

  const targetToken = tokens[0].push_token;
  console.log('Sending test push to token:', targetToken);

  // Load and decrypt FCM credentials
  const { data: configs, error: configsErr } = await supabase.rpc('get_api_configs');
  if (configsErr) {
    console.error('Error querying api_configs:', configsErr.message);
    return;
  }

  const config = configs ? configs.find(c => c.provider === 'firebase_fcm') : null;
  if (!config || !config.is_active) {
    console.error('FCM config not active or not found.');
    return;
  }

  const { data: decryptedKey, error: decryptErr } = await supabase.rpc('get_decrypted_api_key', {
    p_provider: 'firebase_fcm',
    p_encryption_key: encryptionKey
  });

  if (decryptErr) {
    console.error('Failed to decrypt FCM credentials:', decryptErr.message);
    return;
  }

  const serviceAccount = JSON.parse(decryptedKey);
  console.log('FCM Service Account project ID:', serviceAccount.project_id);

  // Initialize Firebase Admin
  const admin = require('firebase-admin');
  const fcmApp = admin.initializeApp({
    credential: admin.cert(serviceAccount)
  }, 'test-app');

  const { getMessaging } = require('firebase-admin/messaging');
  const messaging = getMessaging(fcmApp);

  const message = {
    tokens: [targetToken],
    notification: {
      title: 'Test Push from Admin 🌸',
      body: 'Hello! This is a test notification from the server.'
    },
    data: {
      sound_name: 'bell_sound'
    },
    android: {
      notification: {
        sound: 'bell_sound',
        channelId: 'bell_sound_v2'
      }
    }
  };

  try {
    const response = await messaging.sendEachForMulticast(message);
    console.log('FCM Send Response:');
    console.log(`Success Count: ${response.successCount}`);
    console.log(`Failure Count: ${response.failureCount}`);
    if (response.failureCount > 0) {
      console.error('Error details:', response.responses[0].error);
    }
  } catch (err) {
    console.error('Failed to send message:', err.message);
  }

  // Clean up app
  await fcmApp.delete();
}

main();
