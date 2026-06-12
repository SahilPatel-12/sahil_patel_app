const axios = require('axios');

const keys = [
  {
    userId: '652693',
    apiKey: 'ak-78d22f4e9a7680c4ac68ce28053f9d09fd3d56bf',
    desc: 'New/Standalone Key'
  },
  {
    userId: '651550',
    apiKey: 'ak-36483fc8a7f94df8504faacc4db3a46cafb353bd',
    desc: 'Old Fallback Key'
  }
];

async function testKeys() {
  const payload = {
    day: 12,
    month: 6,
    year: 2026,
    hour: 12,
    min: 0,
    lat: 28.6139,
    lon: 77.2090,
    tzone: 5.5
  };

  for (const key of keys) {
    console.log(`\nTesting key: ${key.desc} (User ID: ${key.userId})`);
    const auth = `Basic ${Buffer.from(`${key.userId}:${key.apiKey}`).toString('base64')}`;
    
    try {
      const response = await axios.post('https://json.astrologyapi.com/v1/advanced_panchang', payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': auth,
          'x-astrologyapi-key': key.apiKey
        },
        timeout: 10000
      });
      console.log(`SUCCESS! Status: ${response.status}`);
      console.log(`Response keys:`, Object.keys(response.data || {}));
    } catch (err) {
      console.log(`FAILED! Error: ${err.message}`);
      if (err.response) {
        console.log(`Status: ${err.response.status}`);
        console.log(`Message:`, err.response.data.msg || err.response.data.message || err.response.data);
      }
    }
  }
}

testKeys();
