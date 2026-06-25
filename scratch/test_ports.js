const http = require('http');

function probePort(port, path = '/health') {
  return new Promise((resolve) => {
    console.log(`[PROBING] Port ${port} at path ${path}...`);
    const req = http.get({
      hostname: '127.0.0.1',
      port: port,
      path: path,
      timeout: 2000
    }, (res) => {
      console.log(`[PORT ${port}] Responded! Status: ${res.statusCode}`);
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`[PORT ${port}] Response body (truncated):`, data.substring(0, 150));
        resolve(true);
      });
    });

    req.on('error', (err) => {
      console.log(`[PORT ${port}] Failed to connect:`, err.message);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`[PORT ${port}] Timeout occurred`);
      req.destroy();
      resolve(false);
    });
  });
}

async function run() {
  console.log('--- Probing Local Ports ---');
  await probePort(3000);
  await probePort(3000, '/api/astrology/horoscope?sign=aries&period=daily');
  await probePort(4000);
  await probePort(5000);
}

run();
