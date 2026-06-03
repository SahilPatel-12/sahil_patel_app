import { createClient } from '@supabase/supabase-js';

const bhajanSupabaseUrl = 'https://wsjyrvaygneejcaovglc.supabase.co';
const bhajanSupabaseAnonKey = 'sb_publishable_sq86edipSsedPGQ31t5TzA_WjB7rPQM';

export const bhajanSupabase = createClient(bhajanSupabaseUrl, bhajanSupabaseAnonKey);
