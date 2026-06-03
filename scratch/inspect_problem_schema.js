const { createClient } = require('@supabase/supabase-js');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const supabaseUrl = 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseKey = 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  try {
    console.log('--- Inspecting life_problems schema and entries ---');
    const { data: lpData, error: lpErr } = await supabase
      .from('life_problems')
      .select('*');
    if (lpErr) {
      console.error('Error fetching life_problems:', lpErr);
    } else {
      console.log(`life_problems count: ${lpData.length}`);
      if (lpData.length > 0) {
        console.log('Keys of first life_problem:', Object.keys(lpData[0]));
        console.log('Sample life_problem row:', lpData[0]);
        console.log('All life_problems:');
        lpData.forEach(p => console.log(`- ${p.title} (ID: ${p.id})`));
      }
    }

    console.log('\n--- Inspecting problem_poojas schema and entries ---');
    const { data: ppData, error: ppErr } = await supabase
      .from('problem_poojas')
      .select('*')
      .limit(1);
    if (ppErr) {
      console.error('Error fetching problem_poojas:', ppErr);
    } else {
      console.log(`problem_poojas exists!`);
      if (ppData && ppData[0]) {
        console.log('Keys of first problem_pooja:', Object.keys(ppData[0]));
        console.log('Sample problem_pooja row:', ppData[0]);
      } else {
        console.log('No rows in problem_poojas. Let\'s try to find if there are any columns.');
        // We can do a select of columns or just inspect the table properties if possible.
      }
    }
  } catch (err) {
    console.error(err);
  }
}

inspect();
