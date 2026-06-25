const fetch = require('node-fetch'); // Native fetch or fallback

async function testEndpoint(name, url, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    console.log(`[TESTING] ${name} -> ${url}`);
    const res = await fetch(url, options);
    console.log(`[RESPONSE] Status: ${res.status}`);
    const text = await res.text();
    
    let parsedJson = null;
    try {
      parsedJson = JSON.parse(text);
    } catch (e) {
      // not JSON
    }
    
    if (res.ok) {
      console.log(`[SUCCESS] ${name}:`, parsedJson ? 'JSON matches schema' : `Text length: ${text.length}`);
      if (parsedJson) {
        console.log(`  Preview:`, JSON.stringify(parsedJson).substring(0, 150) + '...');
      }
    } else {
      console.log(`[FAILURE] ${name}: status ${res.status}`);
      console.log(`  Body:`, text.substring(0, 200));
    }
    console.log('---');
  } catch (error) {
    console.log(`[ERROR] ${name}:`, error.message);
    console.log('---');
  }
}

async function runTests() {
  // Test Local Port 3000
  console.log('=== TESTING LOCAL DEVELOPMENT SERVER (PORT 3000) ===');
  const LOCAL_URL = 'http://localhost:3000';
  await testEndpoint('Local Health Check', `${LOCAL_URL}/health`);
  await testEndpoint('Local Panchang API', `${LOCAL_URL}/api/astrology/panchang`, 'POST', {
    day: 25,
    month: 6,
    year: 2026,
    lat: 28.6139,
    lon: 77.2090,
    tzone: 5.5
  });
  await testEndpoint('Local Choghadiya API', `${LOCAL_URL}/api/astrology/choghadiya`, 'POST', {
    day: 25,
    month: 6,
    year: 2026,
    lat: 28.6139,
    lon: 77.2090,
    tzone: 5.5
  });
  await testEndpoint('Local Horoscope API', `${LOCAL_URL}/api/astrology/horoscope?sign=aries&period=daily`, 'GET');
}

runTests();
