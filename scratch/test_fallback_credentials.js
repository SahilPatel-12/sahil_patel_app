const https = require('https');

function test() {
  const url = 'https://json.astrologyapi.com/v1/advanced_panchang';
  const userId = '651550';
  const apiKey = 'ak-36483fc8a7f94df8504faacc4db3a46cafb353bd';

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
      'Content-Length': Buffer.byteLength(payload),
      'Authorization': 'Basic ' + Buffer.from(userId + ':' + apiKey).toString('base64'),
      'x-astrologyapi-key': apiKey
    },
    timeout: 10000
  };

  console.log(`Sending POST request to ${url} with fallback credentials...`);
  const req = https.request(options, (res) => {
    console.log('Status Code:', res.statusCode);
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        console.log('Response:', JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('Raw Response:', data);
      }
    });
  });

  req.on('error', (err) => {
    console.error('Request Error:', err.message);
  });

  req.write(payload);
  req.end();
}

test();
