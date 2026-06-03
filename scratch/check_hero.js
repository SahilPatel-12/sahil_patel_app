const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseAnonKey = 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  try {
    console.log('Querying homepage_hero table...');
    const { data, error } = await supabase
      .from('homepage_hero')
      .select('*');
    
    if (error) {
      console.error('Error fetching homepage_hero:', error);
      return;
    }
    
    console.log('Total records:', data.length);
    data.forEach((hero, index) => {
      console.log(`\n--- Record #${index + 1} ---`);
      console.log('ID:', hero.id);
      console.log('Title:', hero.title);
      console.log('Subtitle:', hero.subtitle);
      console.log('Date Text:', hero.date_text);
      console.log('Image URL:', hero.background_image);
      console.log('Is Active:', hero.is_active);
      console.log('Created At:', hero.created_at);
    });
  } catch (err) {
    console.error(err);
  }
}

check();
