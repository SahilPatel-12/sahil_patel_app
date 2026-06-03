const { createClient } = require('@supabase/supabase-js');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const supabaseUrl = 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseKey = 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  try {
    console.log('--- Verifying life_problems table ---');
    const { data: catData, count: catCount, error: catErr } = await supabase
      .from('life_problems')
      .select('id, title, sort_order', { count: 'exact' });
    
    if (catErr) {
      console.error('Error fetching categories:', catErr);
    } else {
      console.log(`Total life_problems categories: ${catCount}`);
      catData.forEach((c) => {
        console.log(`- ${c.title.replace('\n', ' ')} (Order: ${c.sort_order})`);
      });
    }

    console.log('\n--- Verifying problem_poojas table ---');
    const { data: pujaData, count: pujaCount, error: pujaErr } = await supabase
      .from('problem_poojas')
      .select('id, title, problem_category', { count: 'exact' });
    
    if (pujaErr) {
      console.error('Error fetching problem_poojas:', pujaErr);
    } else {
      console.log(`Total problem_poojas count: ${pujaCount}`);
      const categoriesGroup = {};
      pujaData.forEach((p) => {
        const cat = p.problem_category;
        if (!categoriesGroup[cat]) categoriesGroup[cat] = [];
        categoriesGroup[cat].push(p.title);
      });

      for (const [cat, titles] of Object.entries(categoriesGroup)) {
        console.log(`\nCategory: ${cat} (Count: ${titles.length})`);
        titles.forEach((title, idx) => console.log(`  ${idx + 1}. ${title}`));
      }
    }
  } catch (err) {
    console.error(err);
  }
}

verify();
