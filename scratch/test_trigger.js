const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseAnonKey = 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTrigger() {
  try {
    console.log('Attempting to set an inactive banner (id: 72c1eaf3-6de7-4437-972e-1425ae5eab66) to is_active = true...');
    const { data, error } = await supabase
      .from('homepage_hero')
      .update({ is_active: true })
      .eq('id', '72c1eaf3-6de7-4437-972e-1425ae5eab66')
      .select();
    
    if (error) {
      console.error('Database Error occurred:', error);
    } else {
      console.log('Success! Result:', data);
    }
  } catch (err) {
    console.error('System error:', err);
  }
}

testTrigger();
