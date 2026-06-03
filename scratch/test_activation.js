const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseAnonKey = 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  try {
    console.log('Activating "Sunday Kalashtami Special" (id: 224f3e1f-08eb-4fbc-b627-270888e4d93e)...');
    const { data, error } = await supabase
      .from('homepage_hero')
      .update({ is_active: true })
      .eq('id', '224f3e1f-08eb-4fbc-b627-270888e4d93e')
      .select();
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    console.log('Update result:', data);

    console.log('\nChecking all banners status...');
    const { data: list } = await supabase.from('homepage_hero').select('id, title, is_active');
    console.log(list);
  } catch (err) {
    console.error(err);
  }
}

test();
