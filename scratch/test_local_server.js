const axios = require('axios');
const app = require('../server'); // Import the main server

async function testLocalEndpoints() {
  const PORT = 4005;
  let server;

  try {
    // Start the server on port 4005
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Test server started on http://localhost:${PORT}`);
    });

    console.log('\n--- TESTING PANCHANG API ---');
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
    console.log(`Sending POST /api/astrology/panchang with payload:`, panchangPayload);
    const panchangRes = await axios.post(`http://localhost:${PORT}/api/astrology/panchang`, panchangPayload, { timeout: 15000 });
    console.log('Panchang Status:', panchangRes.status);
    console.log('Panchang Keys returned:', Object.keys(panchangRes.data.data || {}));
    if (panchangRes.data.data && panchangRes.data.data.panchang_for_today) {
      console.log('Sample Tithi:', panchangRes.data.data.panchang_for_today.Tithi);
    }

    console.log('\n--- TESTING HOROSCOPE (RASHI) API ---');
    console.log(`Sending GET /api/astrology/horoscope?sign=aries&period=daily`);
    const horoscopeRes = await axios.get(`http://localhost:${PORT}/api/astrology/horoscope?sign=aries&period=daily`, { timeout: 15000 });
    console.log('Horoscope Status:', horoscopeRes.status);
    console.log('Horoscope lucky_number:', horoscopeRes.data.data?.lucky_number);
    console.log('Horoscope lucky_color:', horoscopeRes.data.data?.lucky_color);
    console.log('Horoscope content sample:', horoscopeRes.data.data?.content?.substring(0, 150) + '...');

    console.log('\n--- TESTING KUNDLI API ---');
    const kundliPayload = {
      birthData: {
        day: 23,
        month: 4,
        year: 1995,
        hour: 10,
        min: 30,
        lat: 28.6139,
        lon: 77.2090,
        tzone: 5.5,
        gender: 'male'
      },
      language: 'en'
    };
    console.log(`Sending POST /api/astrology/kundli with payload:`, kundliPayload);
    const kundliRes = await axios.post(`http://localhost:${PORT}/api/astrology/kundli`, kundliPayload, { timeout: 20000 });
    console.log('Kundli Status:', kundliRes.status);
    console.log('Kundli compiled keys count:', Object.keys(kundliRes.data.data || {}).length);
    console.log('Kundli sample planets count:', (kundliRes.data.data?.planets || []).length);
    console.log('Kundli sample gemstone recommendation:', kundliRes.data.data?.gemstone?.life);

    console.log('\nAll tests completed successfully!');

  } catch (err) {
    console.error('\nTest failed with error:', err.message);
    if (err.response) {
      console.error('Error status:', err.response.status);
      console.error('Error data:', err.response.data);
    }
  } finally {
    if (server) {
      server.close(() => {
        console.log('Test server shut down.');
      });
    }
  }
}

testLocalEndpoints();
