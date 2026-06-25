const url = 'https://json.freeastrologyapi.com/choghadiya-timings';
const apiKey = 'lroMrRAr4a9O8x3MP7cek3yR9kVvOuVb8wr35hVy';

async function runTest() {
  const payload = {
    year: 2026,
    month: 6,
    date: 25,
    hours: 12,
    minutes: 0,
    seconds: 0,
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: 5.5,
    observation_point: "topocentric"
  };

  try {
    console.log(`[TESTING] Calling FreeAstrologyAPI at ${url}...`);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(payload)
    });

    console.log(`[RESPONSE] Status: ${res.status}`);
    const text = await res.text();
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch (e) {}

    if (res.ok) {
      console.log('[SUCCESS] API Key works correctly! Output:');
      console.log(JSON.stringify(parsed, null, 2));
    } else {
      console.log('[FAILURE] API responded with error:');
      console.log(text);
    }
  } catch (error) {
    console.log('[ERROR] Network request failed:', error.message);
  }
}

runTest();
