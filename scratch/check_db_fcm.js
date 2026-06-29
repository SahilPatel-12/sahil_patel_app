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
const encryptionKey = process.env.EXPO_PUBLIC_ENCRYPTION_KEY || process.env.VITE_ENCRYPTION_KEY;

if (!supabaseUrl || !supabaseAnonKey || !encryptionKey) {
    console.error('Credentials missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    try {
        const { data: decryptedKey, error: decryptErr } = await supabase.rpc('get_decrypted_api_key', {
            p_provider: 'firebase_fcm',
            p_encryption_key: encryptionKey
        });

        if (decryptErr) {
            console.error('Decrypt error:', decryptErr.message);
            return;
        }

        if (!decryptedKey) {
            console.log('No key decrypted.');
            return;
        }

        const creds = JSON.parse(decryptedKey);
        console.log('Database FCM Config Project ID:', creds.project_id);
        console.log('Database FCM Config Client Email:', creds.client_email);
    } catch (err) {
        console.error(err);
    }
}

run();
