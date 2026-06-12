const https = require('https');

function testEndpoint(url, method, payload = null) {
  return new Promise((resolve) => {
    console.log(`Sending ${method} to ${url}...`);
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
          url,
          statusCode: res.statusCode,
          body: data.trim()
        });
      });
    });

    req.on('error', (err) => {
      resolve({ url, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ url, error: 'timeout' });
    });

    if (payload) {
      req.write(bodyStr);
    }
    req.end();
  });
}

async function run() {
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

  const horoscopePayload = {
    sign: 'aries',
    period: 'daily'
  };

  const tests = [
    { url: 'https://mantrapuja.com/api/panchang', method: 'POST', payload: panchangPayload },
    { url: 'https://mantrapuja.com/api/astrology/panchang', method: 'POST', payload: panchangPayload },
    { url: 'https://mantrapuja.com/api/horoscope?sign=aries&period=daily', method: 'GET', payload: null },
    { url: 'https://mantrapuja.com/api/astrology/horoscope?sign=aries&period=daily', method: 'GET', payload: null }
  ];

  for (const t of tests) {
    const res = await testEndpoint(t.url, t.method, t.payload);
    if (res.error) {
      console.log(`${res.url} -> Error: ${res.error}`);
    } else {
      console.log(`${res.url} -> Status: ${res.statusCode}`);
      console.log(`Body: ${res.body.substring(0, 500)}`);
    }
    console.log('-'.repeat(50));
  }
}

run();
