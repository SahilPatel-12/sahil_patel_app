const http = require('http');

function check() {
  const url = 'http://localhost:4000/health';
  console.log(`Checking local Express server health at ${url}...`);

  const req = http.get(url, (res) => {
    console.log('Local Server Status Code:', res.statusCode);
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log('Local Server Response:', data);
    });
  });

  req.on('error', (err) => {
    console.error('Local Server is OFFLINE or error:', err.message);
  });
}

check();
