const https = require('https');

const paths = [
  '/',
  '/health',
  '/api/astrology/panchang',
  '/api/astrology/horoscope',
  '/v1/advanced_panchang',
  '/api/v1/advanced_panchang',
  '/advanced_panchang'
];

async function probe(path) {
  return new Promise((resolve) => {
    const url = `https://bc.mantrapuja.com${path}`;
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
      method: path === '/' || path === '/health' ? 'GET' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          path,
          statusCode: res.statusCode,
          body: data.substring(0, 200).trim()
        });
      });
    });

    req.on('error', (err) => {
      resolve({ path, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ path, error: 'timeout' });
    });

    if (options.method === 'POST') {
      req.write(payload);
    }
    req.end();
  });
}

async function run() {
  for (const path of paths) {
    const res = await probe(path);
    console.log(`Path: ${res.path}`);
    if (res.error) {
      console.log(`  Error: ${res.error}`);
    } else {
      console.log(`  Status: ${res.statusCode}`);
      console.log(`  Body: ${res.body}`);
    }
    console.log('-'.repeat(40));
  }
}

run();
