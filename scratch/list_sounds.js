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
        const { data: sounds, error } = await supabase
            .from('notification_sounds')
            .select('*');

        if (error) throw error;

        console.log(`Found ${sounds.length} sounds:`);
        sounds.forEach(s => {
            console.log(`- Name: ${s.name} | Filename: ${s.filename} | URL: ${s.file_url}`);
        });
    } catch (err) {
        console.error(err);
    }
}

run();
