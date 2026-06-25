const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runAudit() {
  console.log('--- DATABASE SCHEMA & SECURITY AUDIT ---');

  const queries = {
    'api_configs_columns': `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'api_configs';
    `,
    'api_configs_constraints': `
      SELECT conname, contype, pg_get_constraintdef(c.oid)
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'api_configs';
    `,
    'user_push_tokens_columns': `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'user_push_tokens';
    `,
    'user_push_tokens_constraints': `
      SELECT conname, contype, pg_get_constraintdef(c.oid)
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'user_push_tokens';
    `,
    'push_notifications_columns': `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'push_notifications';
    `,
    'push_notifications_constraints': `
      SELECT conname, contype, pg_get_constraintdef(c.oid)
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'push_notifications';
    `,
    'plaintext_secrets_check': `
      SELECT provider, name, is_active FROM public.api_configs;
    `
  };

  for (const [name, sql] of Object.entries(queries)) {
    console.log(`\n🔍 Executing query for: ${name}...`);
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
      if (error) {
        console.error(`❌ Error in ${name}:`, error.message);
      } else {
        console.log(data);
      }
    } catch (err) {
      console.error(`❌ Exception in ${name}:`, err.message);
    }
  }
}

runAudit();
