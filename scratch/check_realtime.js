const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Applications/sahil_MP_app/APP/mantrapuja/.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRealtime() {
  // Querying publication tables via direct SQL or a custom RPC if available
  // Alternatively we can use a direct subscription client to see if it connects
  console.log('Testing realtime subscription...');
  const channel = supabase
    .channel('test-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'one_rupee_poojas' }, (payload) => {
      console.log('Change received:', payload);
    })
    .subscribe((status) => {
      console.log('Subscription status:', status);
      setTimeout(() => {
        supabase.removeChannel(channel);
        process.exit(0);
      }, 5000);
    });
}

checkRealtime();
