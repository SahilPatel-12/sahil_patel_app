const https = require('https');

function test() {
  const url = 'https://bc.mantrapuja.com/advanced_panchang';
  const payload = JSON.stringify({
    day: 12,
    month: 6,
    year: 2026,
    hour: 12,
    min: 0,
    lat: 28.6139,
    lon: 77.2090,
    tzone: 5.5
  });

  const parsedUrl = new URL(url);
  const options = {
    hostname: parsedUrl.hostname,
    path: parsedUrl.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    },
    timeout: 15000
  };

  console.log(`Sending POST request to ${url}...`);
  const req = https.request(options, (res) => {
    console.log('API Status Code:', res.statusCode);
    console.log('API Headers:', JSON.stringify(res.headers, null, 2));

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('API Response Raw Length:', data.length);
      try {
        const parsed = JSON.parse(data);
        console.log('API Response Data:', JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('API Response (Not JSON):', data.substring(0, 1000));
      }
    });
  });

  req.on('error', (err) => {
    console.error('API Error:', err.message);
  });

  req.on('timeout', () => {
    console.error('Request timed out after 15s');
    req.destroy();
  });

  req.write(payload);
  req.end();
}

test();
