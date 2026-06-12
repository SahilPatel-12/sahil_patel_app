const https = require('https');

function test(url, method, payload = null) {
  return new Promise((resolve) => {
    console.log(`Testing ${method} to ${url}...`);
    const parsedUrl = new URL(url);
    const bodyStr = payload ? JSON.stringify(payload) : '';

    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    };

    if (payload) {
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      resolve({ error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ error: 'timeout' });
    });

    if (payload) {
      req.write(bodyStr);
    }
    req.end();
  });
}

async function run() {
  const horoscopeUrl = 'https://bc.mantrapuja.com/api/astrology/horoscope?sign=aries&period=daily';
  const r1 = await test(horoscopeUrl, 'GET');
  console.log(`Horoscope Status: ${r1.statusCode || r1.error}`);
  console.log(`Horoscope Body: ${r1.body ? r1.body.substring(0, 500) : 'none'}`);
  console.log('-'.repeat(50));

  const panchangUrl = 'https://bc.mantrapuja.com/api/astrology/panchang';
  const panchangPayload = {
    day: 12,
    month: 6,
    year: 2026,
    hour: 12,
    min: 0,
    lat: 28.6139,
    lon: 77.2090,
    tzone: 5.5
  };
  const r2 = await test(panchangUrl, 'POST', panchangPayload);
  console.log(`Panchang Status: ${r2.statusCode || r2.error}`);
  console.log(`Panchang Body: ${r2.body ? r2.body.substring(0, 500) : 'none'}`);
}

run();
