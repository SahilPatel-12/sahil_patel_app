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
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const fs = require('fs');
const path = require('path');
if (fs.existsSync(path.join(__dirname, '.env.local'))) {
    dotenv.config({ path: path.join(__dirname, '.env.local') });
} else {
    dotenv.config();
}

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

// FCM / Notification Health Check Endpoint
app.get('/api/notifications/health', async (req, res) => {
    const encryptionKey = process.env.EXPO_PUBLIC_ENCRYPTION_KEY || process.env.VITE_ENCRYPTION_KEY;
    const keyValid = encryptionKey && encryptionKey.length >= 16;
    
    let fcmConfigured = false;
    let fcmDecrypted = false;
    let fcmInitialized = false;
    let errorMsg = null;

    try {
        const { resolveFcmServiceAccount } = require('./services/notificationDispatcher');
        const serviceAccount = await resolveFcmServiceAccount();
        if (serviceAccount) {
            fcmConfigured = true;
            if (serviceAccount.project_id && serviceAccount.private_key) {
                fcmDecrypted = true;
                
                const admin = require('firebase-admin');
                const apps = admin.getApps();
                const app = apps.find(a => a.name === '[DEFAULT]');
                fcmInitialized = !!app;
            }
        }
    } catch (err) {
        errorMsg = err.message;
    }

    const overallStatus = keyValid && fcmInitialized ? 'healthy' : 'degraded';

    res.json({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        encryption_key: {
            available: !!encryptionKey,
            valid_length: keyValid
        },
        fcm: {
            configured: fcmConfigured,
            decrypted: fcmDecrypted,
            initialized: fcmInitialized
        },
        error: errorMsg
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

// Production Security and Connection Validation Sequence
async function performStartupValidation() {
    console.log('🛡️  [Security Check] Running production security validations...');

    // 1. Verify Encryption Key
    const encryptionKey = process.env.EXPO_PUBLIC_ENCRYPTION_KEY || process.env.VITE_ENCRYPTION_KEY;
    if (!encryptionKey) {
        console.error('❌ [Security Check Failed] Production startup blocked: Encryption key is missing in environment variables (EXPO_PUBLIC_ENCRYPTION_KEY or VITE_ENCRYPTION_KEY must be set).');
        process.exit(1);
    }
    if (encryptionKey.length < 16) {
        console.error('❌ [Security Check Failed] Production startup blocked: Encryption key length is insufficient. Key must be at least 16 characters long.');
        process.exit(1);
    }
    console.log('✅ [Security Check] Encryption key loaded and length is valid.');

    // 2. Validate Supabase credentials and connectivity
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('❌ [Security Check Failed] Supabase credentials (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY) are missing in environment variables.');
        process.exit(1);
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { error: pingErr } = await supabase.from('api_configs').select('provider').limit(1);
        if (pingErr && pingErr.code !== 'PGRST116') {
            throw pingErr;
        }
        console.log('✅ [Security Check] Supabase connection established successfully.');
    } catch (dbErr) {
        console.error('❌ [Security Check Failed] Failed to connect to Supabase database:', dbErr.message);
        process.exit(1);
    }

    // 3. Validate Firebase FCM Configuration
    try {
        const { resolveFcmServiceAccount } = require('./services/notificationDispatcher');
        const serviceAccount = await resolveFcmServiceAccount();
        if (!serviceAccount) {
            console.warn('⚠️  [Security Check] Firebase FCM configuration is missing or inactive in Supabase. Push notifications will be disabled until configured in the Admin Panel settings.');
        } else {
            console.log('✅ [Security Check] Firebase FCM credentials resolved and decrypted successfully.');
            if (!serviceAccount.project_id || !serviceAccount.private_key) {
                console.error('❌ [Security Check Failed] Decrypted FCM credentials JSON is invalid: missing project_id or private_key.');
                process.exit(1);
            }
            console.log('✅ [Security Check] Firebase Service Account JSON parsed and verified.');
            
            // Initialize Firebase Admin on startup to verify setup and populate health checks
            const admin = require('firebase-admin');
            const apps = admin.getApps();
            if (!apps.find(app => app.name === '[DEFAULT]')) {
                admin.initializeApp({
                    credential: admin.cert(serviceAccount)
                });
                console.log('🔥 [Security Check] Firebase Admin SDK initialized successfully on startup.');
            }
        }
    } catch (fcmErr) {
        console.error('❌ [Security Check Failed] Firebase configuration validation failed:', fcmErr.message);
        process.exit(1);
    }
    console.log('🛡️  [Security Check] All security checks passed.');
}

// Start Server Wrapper
(async () => {
    await performStartupValidation();

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Astrology API Server running on http://localhost:${PORT}`);
        console.log(`   - Rashi API:      POST/GET http://localhost:${PORT}/api/astrology/horoscope`);
        console.log(`   - Panchang API:   POST/GET http://localhost:${PORT}/api/astrology/panchang`);
        console.log(`   - Kundli API:     POST      http://localhost:${PORT}/api/astrology/kundli`);
        console.log(`   - Health Check:   GET       http://localhost:${PORT}/api/notifications/health`);
        
        // Start Push Notification Dispatcher Loop
        startNotificationDispatcher();
    });
})();

module.exports = app;
