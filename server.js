/**
 * Standalone General Server Code for Astrology Services (Express.js)
 * 
 * Mounts Rashi, Panchang, and Kundli API routers, sets up health checks,
 * and adds error handling middleware.
 * 
 * Dependencies:
 * npm install express cors dotenv
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Standard Middlewares
app.use(cors());
app.use(express.json());

// Import Astrology API Routers
const rashifalRouter = require('./rashifalApi');
const panchangRouter = require('./panchangApi');
const kundliRouter = require('./kundliApi');

// Import Notification Background Dispatcher
const { startNotificationDispatcher } = require('./services/notificationDispatcher');

// Mount Routers
app.use('/api', rashifalRouter);
app.use('/api', panchangRouter);
app.use('/api', kundliRouter);

// Standard Health Check Endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Astrology API Service',
        config: {
            hasUserId: !!process.env.ASTROLOGY_USER_ID,
            hasApiKey: !!process.env.ASTROLOGY_API_KEY
        }
    });
});

// Root route welcome message
app.get('/', (req, res) => {
    res.send('🌌 Astrology API Service is Running. Mount paths: /api/astrology/horoscope, /api/astrology/panchang, /api/astrology/kundli');
});

// Catch-all route for unmatched requests (404)
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        msg: `Route ${req.method} ${req.url} not found.`
    });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('💥 [Server Error]:', err.stack || err.message);
    res.status(err.status || 500).json({
        success: false,
        error: err.name || 'INTERNAL_SERVER_ERROR',
        msg: err.message || 'An unexpected error occurred on the server.'
    });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Astrology API Server running on http://localhost:${PORT}`);
    console.log(`   - Rashi API:      POST/GET http://localhost:${PORT}/api/astrology/horoscope`);
    console.log(`   - Panchang API:   POST/GET http://localhost:${PORT}/api/astrology/panchang`);
    console.log(`   - Kundli API:     POST      http://localhost:${PORT}/api/astrology/kundli`);
    
    // Start Push Notification Dispatcher Loop
    startNotificationDispatcher();
});

module.exports = app;
