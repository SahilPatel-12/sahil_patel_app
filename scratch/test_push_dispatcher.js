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

const { checkAndDispatchNotifications } = require('../services/notificationDispatcher');

async function testDispatcher() {
  console.log('⚡ Starting Push Notification Dispatcher Verification Test...');

  try {
    // 1. Get an existing user for testing coins logic
    const { data: users, error: usersErr } = await supabase
      .from('app_users')
      .select('id, phone')
      .limit(1);

    if (usersErr) throw usersErr;
    if (!users || users.length === 0) {
      console.warn('⚠️ No users found in database app_users table. Create a user first before running this test.');
      return;
    }

    const testUser = users[0];
    console.log(`👤 Using test user: ID=${testUser.id}, Phone=${testUser.phone}`);

    // Check initial wallet balance
    const { data: initialWallet } = await supabase
      .from('user_wallets')
      .select('balance')
      .eq('user_id', testUser.id)
      .maybeSingle();

    const startBalance = initialWallet ? initialWallet.balance : 50;
    console.log(`🪙 User initial wallet balance: ${startBalance} coins`);

    // 2. Insert a test push token linked to the user
    const testToken = `ExponentPushToken[test-verification-${Math.random().toString(36).substring(7)}]`;
    console.log(`🔑 Registering mock push token: ${testToken}`);

    const { error: tokenErr } = await supabase
      .from('user_push_tokens')
      .insert({
        user_id: testUser.id,
        push_token: testToken,
        platform: 'android'
      });

    if (tokenErr) {
      console.error('❌ Failed to insert test push token:', tokenErr.message);
      console.log('💡 Note: Make sure you have run the migrations SQL to create user_push_tokens table!');
      return;
    }

    // 3. Create a pending notification scheduled for immediate dispatch
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const scheduledDate = `${yyyy}-${mm}-${dd}`;

    const hh = String(today.getHours()).padStart(2, '0');
    const min = String(today.getMinutes()).padStart(2, '0');
    const ss = String(today.getSeconds()).padStart(2, '0');
    const scheduledTime = `${hh}:${min}:${ss}`;

    console.log(`📝 Seeding pending 'coins' reward notification scheduled at: Date=${scheduledDate}, Time=${scheduledTime}`);

    const { data: notiData, error: notiErr } = await supabase
      .from('push_notifications')
      .insert({
        title: '🎉 Verification Coin Bonus!',
        body: 'You have been awarded 10 verification test coins. Enjoy!',
        notification_type: 'coins',
        coin_amount: 10,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        status: 'pending'
      })
      .select()
      .single();

    if (notiErr) throw notiErr;
    console.log(`✅ Seeded push notification ID: ${notiData.id}`);

    // 4. Invoke the dispatcher sequence manually
    console.log('🔄 Invoking dispatcher checkAndDispatchNotifications()...');
    await checkAndDispatchNotifications();

    // 5. Verify the updates
    console.log('🧐 Verifying results in database...');

    // A. Verify push notification status updated to 'sent'
    const { data: updatedNoti, error: getNotiErr } = await supabase
      .from('push_notifications')
      .select('status, sent_at')
      .eq('id', notiData.id)
      .single();

    if (getNotiErr) throw getNotiErr;
    console.log(`   - Notification status: ${updatedNoti.status} (sent_at: ${updatedNoti.sent_at})`);

    // B. Verify wallet balance incremented
    const { data: updatedWallet } = await supabase
      .from('user_wallets')
      .select('balance')
      .eq('user_id', testUser.id)
      .single();

    const endBalance = updatedWallet ? updatedWallet.balance : 0;
    console.log(`   - User final wallet balance: ${endBalance} coins (Expected: ${startBalance + 10})`);

    // C. Verify transaction record logged
    const { data: txn, error: getTxnErr } = await supabase
      .from('coin_transactions')
      .select('amount, type')
      .eq('user_id', testUser.id)
      .eq('amount', 10)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (getTxnErr) throw getTxnErr;
    if (txn) {
      console.log(`   - Logged coin transaction: Type=${txn.type}, Amount=${txn.amount}`);
    } else {
      console.log('   - ❌ Coin transaction record not found.');
    }

    // 6. Cleanup mock test items
    console.log('🧹 Cleaning up verification test records...');
    await supabase.from('push_notifications').delete().eq('id', notiData.id);
    await supabase.from('user_push_tokens').delete().eq('push_token', testToken);
    
    // Reset user balance back
    await supabase.from('user_wallets').update({ balance: startBalance }).eq('user_id', testUser.id);
    console.log('✨ Cleanup complete.');

    if (updatedNoti.status === 'sent' && endBalance === startBalance + 10 && txn) {
      console.log('\n👑 SUCCESS: Push Notifications and Dispatcher integration verified successfully!');
    } else {
      console.log('\n❌ FAILURE: Verification checklist not fully matched.');
    }

  } catch (err) {
    console.error('💥 Verification error:', err.message || err);
  }
}

testDispatcher();
