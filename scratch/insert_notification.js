const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

if (fs.existsSync(path.join(__dirname, '../.env.local'))) {
    dotenv.config({ path: path.join(__dirname, '../.env.local') });
} else {
    dotenv.config();
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    try {
        console.log('🔄 Inserting test pending notification in DB...');
        
        // Get today's date formatted as YYYY-MM-DD
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const scheduledDate = `${year}-${month}-${day}`;
        
        // Format time as HH:MM:SS
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const scheduledTime = `${hours}:${minutes}:${seconds}`;

        console.log(`Scheduled for: Date = ${scheduledDate}, Time = ${scheduledTime}`);

        const { data, error } = await supabase
            .from('push_notifications')
            .insert({
                title: 'Admin Panel Test: Real Bell 🔔',
                body: 'Testing the live dispatcher processing with real bell chime sound!',
                status: 'pending',
                notification_type: 'generic',
                scheduled_date: scheduledDate,
                scheduled_time: scheduledTime,
                sound_name: 'bell_real',
                sound_url: 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/notifications/sounds/pw9tpyru-1781690693063.mp3',
                is_recurring: false
            })
            .select();

        if (error) throw error;

        console.log('✅ Pending notification successfully inserted! ID:', data[0].id);
        console.log('🕒 Waiting for local background dispatcher server to process it in next poll...');
    } catch (err) {
        console.error(err);
    }
}

run();
