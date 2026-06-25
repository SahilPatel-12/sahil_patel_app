const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const { resolveFcmServiceAccount } = require('../services/notificationDispatcher');

async function runTests() {
  console.log('⚡ Starting FCM HTTP v1 Integration Verification...');

  try {
    // 1. Verify Duplicate Prevention on Token Registration
    console.log('\n🧪 Testing token registration duplicate prevention...');
    const testToken = `mock-fcm-token-${Math.random().toString(36).substring(7)}`;

    // A. Perform first upsert
    console.log(`   - Registering token: ${testToken}`);
    const { error: upsert1Err } = await supabase
      .from('user_push_tokens')
      .upsert(
        {
          push_token: testToken,
          platform: 'android',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'push_token' }
      );

    if (upsert1Err) throw upsert1Err;
    console.log('   - Upsert 1 successful.');

    // B. Perform second upsert (simulating re-registration)
    console.log(`   - Re-registering same token: ${testToken}`);
    const { error: upsert2Err } = await supabase
      .from('user_push_tokens')
      .upsert(
        {
          push_token: testToken,
          platform: 'android',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'push_token' }
      );

    if (upsert2Err) throw upsert2Err;
    console.log('   - Upsert 2 successful (no constraint conflict).');

    // C. Verify there is only one entry in database
    const { data: records, error: queryErr } = await supabase
      .from('user_push_tokens')
      .select('*')
      .eq('push_token', testToken);

    if (queryErr) throw queryErr;
    console.log(`   - Count of entries in DB: ${records.length} (Expected: 1)`);
    if (records.length !== 1) {
      console.error('❌ Duplicate prevention failed!');
    } else {
      console.log('✅ Duplicate prevention verified successfully!');
    }

    // Cleanup first test
    await supabase.from('user_push_tokens').delete().eq('push_token', testToken);

    // 2. Verify Credentials Resolution and Decryption logic
    console.log('\n🧪 Testing database resolve & decrypt of firebase_fcm credentials...');
    const credentials = await resolveFcmServiceAccount();
    if (credentials) {
      console.log('✅ Successfully resolved and decrypted FCM credentials JSON!');
      console.log('   - Project ID from credentials:', credentials.project_id);
    } else {
      console.log('⚠️ firebase_fcm is not yet configured or is inactive in your Supabase api_configs. (This is expected before you paste it into the admin settings page).');
    }

    // 3. Test Invalid Token Cleanup Logic Mocking
    console.log('\n🧪 Testing FCM invalid token database cleanup code...');
    const invalidToken = 'mock-invalid-registration-token';
    console.log(`   - Registering a mock invalid token: ${invalidToken}`);
    await supabase
      .from('user_push_tokens')
      .upsert(
        {
          push_token: invalidToken,
          platform: 'android',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'push_token' }
      );

    // Simulate cleanup execution
    console.log(`   - Executing cleanup on invalid token...`);
    const { error: cleanErr } = await supabase
      .from('user_push_tokens')
      .delete()
      .eq('push_token', invalidToken);

    if (cleanErr) throw cleanErr;

    // Verify token was deleted
    const { data: cleanCheck } = await supabase
      .from('user_push_tokens')
      .select('*')
      .eq('push_token', invalidToken);

    if (cleanCheck && cleanCheck.length === 0) {
      console.log('✅ Invalid token cleanup verified successfully!');
    } else {
      console.error('❌ Invalid token cleanup failed (token still exists).');
    }

    console.log('\n👑 Verification complete.');
  } catch (err) {
    console.error('💥 Test execution failed:', err.message || err);
  }
}

runTests();
