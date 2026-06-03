const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseAnonKey = 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  try {
    console.log('Querying website_pooja_products image columns...');
    const { data, error } = await supabase
      .from('website_pooja_products')
      .select('id, name, image, banner_image, gallery_images, ritual_images');
    
    if (error) {
      console.error('Error fetching:', error);
      return;
    }
    
    data.forEach(p => {
      console.log({
        id: p.id,
        name: p.name,
        image: p.image,
        banner_image: p.banner_image,
        gallery_images: p.gallery_images,
        ritual_images: p.ritual_images
      });
    });
  } catch (err) {
    console.error(err);
  }
}

check();
