const https = require('https');

const apiKey = 'ak-78d22f4e9a7680c4ac68ce28053f9d09fd3d56bf';

const payload = {
  year: 2026,
  month: 6,
  date: 25,
  hours: 11,
  minutes: 0,
  seconds: 0,
  latitude: 28.6139,
  longitude: 77.2090,
  timezone: 5.5,
  config: {
    observation_point: 'topocentric',
    ayanamsha: 'lahiri'
  }
};

const payloadStr = JSON.stringify(payload);

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'json.freeastrologyapi.com',
      port: 443,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'Content-Length': Buffer.byteLength(payloadStr)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(payloadStr);
    req.end();
  });
}

async function run() {
  console.log('Testing endpoint /choghadiya-timings ...');
  try {
    const res1 = await makeRequest('/choghadiya-timings');
    console.log('Status:', res1.statusCode);
    console.log('Body:', res1.body.substring(0, 1000));
  } catch (err) {
    console.error('Error testing /choghadiya-timings:', err.message);
  }

  console.log('\nTesting endpoint /bchoghadiya-timings ...');
  try {
    const res2 = await makeRequest('/bchoghadiya-timings');
    console.log('Status:', res2.statusCode);
    console.log('Body:', res2.body.substring(0, 1000));
  } catch (err) {
    console.error('Error testing /bchoghadiya-timings:', err.message);
  }
}

run();
