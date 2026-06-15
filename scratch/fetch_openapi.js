const axios = require('axios');

const supabaseUrl = 'https://vjkwmefdutltwccpgnny.supabase.co';
const supabaseKey = 'sb_publishable_gZzOlAfCHCDDgdTbMop8zQ_18bQRX0L';

async function getOpenAPI() {
  try {
    const res = await axios.get(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    console.log('OpenAPI details retrieved successfully!');
    
    const paths = Object.keys(res.data.paths);
    console.log('\nExposed Paths:');
    paths.forEach(p => console.log(`- ${p}`));

    console.log('\nRPC functions (paths starting with /rpc/):');
    paths.filter(p => p.startsWith('/rpc/')).forEach(p => {
      console.log(`- ${p}`);
      const info = res.data.paths[p];
      console.log('  Parameters:', info.post?.parameters || 'None');
    });

  } catch (err) {
    console.error('Error fetching OpenAPI spec:', err.response ? err.response.data : err.message);
  }
}

getOpenAPI();
