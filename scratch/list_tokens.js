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
        const { data: tokens, error } = await supabase
            .from('user_push_tokens')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) throw error;

        console.log(`Found ${tokens.length} total tokens:`);
        tokens.forEach(t => {
            console.log(`Token: ${t.push_token.substring(0, 40)}... | Platform: ${t.platform} | User: ${t.user_id} | Updated: ${t.updated_at}`);
        });
    } catch (err) {
        console.error(err);
    }
}

run();
