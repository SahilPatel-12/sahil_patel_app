const https = require('https');

function check(url) {
  return new Promise((resolve) => {
    console.log(`Checking health of ${url}...`);
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname,
      method: 'GET',
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          url,
          statusCode: res.statusCode,
          body: data.substring(0, 300)
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

    req.end();
  });
}

async function run() {
  const urls = [
    'https://mantrapuja.com/api/health',
    'https://bc.mantrapuja.com/api/health',
    'https://bc.mantrapuja.com/health'
  ];

  for (const url of urls) {
    const res = await check(url);
    if (res.error) {
      console.log(`${res.url} -> Error: ${res.error}`);
    } else {
      console.log(`${res.url} -> Status: ${res.statusCode}, Body: ${res.body}`);
    }
  }
}

run();
