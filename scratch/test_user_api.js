const axios = require('axios');

async function test() {
  const url = 'https://bc.mantrapuja.com/advanced_panchang';
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

  console.log(`Sending POST request to ${url}...`);
  try {
    const response = await axios.post(url, payload, { timeout: 10000 });
    console.log('API Status Code:', response.status);
    console.log('API Response Data:', JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.error('API Error:', err.message);
    if (err.response) {
      console.error('API Error Response Status:', err.response.status);
      console.error('API Error Response Data:', err.response.data);
    }
  }
}

test();
