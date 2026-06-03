/**
 * MantraPuja - Rashifal Horoscope API Server
 * 
 * Usage:
 *   node server.js         (default port 4000)
 *   PORT=5000 node server.js
 *
 * Prerequisites: npm install express axios cheerio cors
 */

const express = require('express');
const cors = require('cors');
const rashifalRouter = require('./rashifalApi');
const kundliRouter = require('./kundliApi');
const panchangRouter = require('./panchangApi');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'MantraPuja Rashifal API', timestamp: new Date().toISOString() });
});

// Mount the routers
app.use('/api', rashifalRouter);
app.use('/api', kundliRouter);
app.use('/api', panchangRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[Server] Unhandled error:', err.message);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🔮 MantraPuja Rashifal API running at:`);
  console.log(`   ➜ Local:    http://localhost:${PORT}`);
  console.log(`   ➜ Android:  http://10.0.2.2:${PORT}`);
  console.log(`   ➜ Health:   http://localhost:${PORT}/health`);
  console.log(`   ➜ Test:     http://localhost:${PORT}/api/astrology/horoscope?sign=aries&period=daily\n`);
});
