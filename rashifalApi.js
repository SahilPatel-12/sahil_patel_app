/**
 * Standalone Rashifal (Horoscope) API for Express (Node.js)
 * 
 * Replaces scraping with official AstrologyAPI integrations.
 * 
 * Dependencies:
 * npm install express axios
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Try loading environment variables from .env.local manually
try {
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
            if (match) {
                const key = match[1];
                let value = match[2] || '';
                if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) {
                    value = value.replace(/(^"|"$)/g, '');
                }
                process.env[key] = value;
            }
        });
    }
} catch (e) {
    // Ignore manual env parsing errors
}

const ASTROLOGY_API_BASE_URL = "https://json.astrologyapi.com/v1";

// Attempt to load Supabase for DB caching
let supabase = null;
try {
    const supabaseModule = require('./backend/src/utils/supabase') || require('./src/utils/supabase');
    supabase = supabaseModule.supabase;
} catch (e) {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
            const { createClient } = require('@supabase/supabase-js');
            supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        } catch (err) {
            console.warn('[RashifalAPI] Supabase client could not be loaded:', err.message);
        }
    }
}

/**
 * Calculates the reference date for caching
 */
const getReferenceDate = (period) => {
    const now = new Date();
    if (period === 'monthly') {
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    } else if (period === 'yearly') {
        return new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    } else if (period === 'weekly') {
        const day = now.getDay() || 7;
        if (day !== 1) now.setHours(-24 * (day - 1));
        return now.toISOString().split('T')[0];
    } else {
        return now.toISOString().split('T')[0]; // daily
    }
};

/**
 * Endpoint: GET/POST /astrology/horoscope
 */
const handleHoroscopeRequest = async (req, res) => {
    try {
        const sign = req.query.sign || req.body?.sign;
        const period = req.query.period || req.body?.period || 'daily';

        if (!sign) {
            return res.status(400).json({ success: false, error: "Sign parameter is required (e.g. 'aries', 'taurus')" });
        }

        const validPeriods = ['daily', 'weekly', 'monthly', 'yearly'];
        if (!validPeriods.includes(period)) {
            return res.status(400).json({ success: false, error: "Invalid period. Must be daily, weekly, monthly, or yearly" });
        }

        const signLower = sign.toLowerCase();
        const refDate = getReferenceDate(period);

        // 1. Try DB cache first
        if (supabase) {
            try {
                const { data: existing } = await supabase
                    .from('horoscopes')
                    .select('*')
                    .eq('sign', signLower)
                    .eq('period_type', period)
                    .eq('reference_date', refDate)
                    .maybeSingle();

                if (existing) {
                    console.log(`[RashifalAPI] DB cache hit for ${signLower} (${period})`);
                    return res.json({ success: true, data: existing });
                }
            } catch (dbErr) {
                console.error('[RashifalAPI] DB Cache read error:', dbErr.message);
            }
        }

        // 2. Fetch fresh prediction from AstrologyAPI (using process.env with working keys fallback)
        const userId = process.env.ASTROLOGY_USER_ID || '651550';
        const apiKey = process.env.ASTROLOGY_API_KEY || 'ak-36483fc8a7f94df8504faacc4db3a46cafb353bd';

        if (!userId || !apiKey) {
            console.error('[RashifalAPI] Credentials missing.');
            return res.status(500).json({ 
                success: false, 
                error: "CONFIGURATION_ERROR", 
                msg: "AstrologyAPI credentials not configured." 
            });
        }

        const auth = `Basic ${Buffer.from(`${userId}:${apiKey}`).toString('base64')}`;
        const url = `${ASTROLOGY_API_BASE_URL}/sun_sign_prediction/${period}/${signLower}`;

        console.log(`[RashifalAPI] Calling AstrologyAPI: ${url}`);
        const apiResponse = await axios.post(url, { timezone: 5.5 }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': auth,
                'x-astrologyapi-key': apiKey
            },
            timeout: 15000
        });

        const resData = apiResponse.data;
        const prediction = resData.prediction || resData;

        // Parse sections & ratings (backwards-compatible mapping)
        const categories = [
            { key: 'personal_life', label: 'Personal Life', ratingLabel: 'Love' },
            { key: 'profession', label: 'Profession', ratingLabel: 'Career' },
            { key: 'health', label: 'Health', ratingLabel: 'Health' },
            { key: 'travel', label: 'Travel', ratingLabel: 'Travel' },
            { key: 'luck', label: 'Luck', ratingLabel: 'Luck' },
            { key: 'emotions', label: 'Emotions', ratingLabel: 'Emotions' }
        ];

        const sections = [];
        const ratings = [];

        categories.forEach(cat => {
            const text = prediction[cat.key];
            if (text) {
                sections.push({ heading: cat.label, body: text });
                const score = (text.length % 3) + 3; // deterministic 3-5 rating
                ratings.push({ label: cat.ratingLabel, score });
            }
        });

        let content = '';
        if (sections.length > 0) {
            content = sections.map(s => `${s.heading}: ${s.body}`).join('\n\n');
        } else if (typeof prediction === 'string') {
            content = prediction;
        } else if (prediction.report || prediction.prediction) {
            content = prediction.report || prediction.prediction;
        } else {
            content = JSON.stringify(prediction);
        }

        // Clean values for lucky number, color, remedy, date label
        const lucky_number = String(resData.lucky_number || resData.lucky_number_rashi || ((signLower.charCodeAt(0) + new Date().getDate()) % 9 + 1));
        
        const colorMap = {
            aries: 'Red', taurus: 'Pink', gemini: 'Green', cancer: 'White',
            leo: 'Gold', virgo: 'Green', libra: 'Blue', scorpio: 'Maroon',
            sagittarius: 'Yellow', capricorn: 'Black', aquarius: 'Dark Blue', pisces: 'Yellow'
        };
        const lucky_color = resData.lucky_color || colorMap[signLower] || 'Yellow';

        const remediesPool = [
            "Offer water to the Sun in the morning.",
            "Chant Gayatri Mantra 108 times.",
            "Feed green fodder to cows today.",
            "Donate yellow items to the needy.",
            "Keep a copper coin in your pocket.",
            "Meditate for 10 minutes in the morning.",
            "Avoid conflicts and focus on creative work."
        ];
        const remedyIndex = (new Date().getDate() + signLower.length) % remediesPool.length;
        const remedy = resData.remedy || resData.remedies || remediesPool[remedyIndex];

        const date_label = resData.prediction_date || resData.date || `${sign.charAt(0).toUpperCase() + sign.slice(1)} ${period.charAt(0).toUpperCase() + period.slice(1)} Horoscope - ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

        const mappedData = {
            sign: signLower,
            period_type: period,
            content,
            date_label,
            lucky_number,
            lucky_color,
            remedy,
            ratings: ratings.length > 0 ? ratings : null,
            sections: sections.length > 0 ? sections : null,
            reference_date: refDate
        };

        // 3. Save to DB cache
        if (supabase) {
            try {
                await supabase
                    .from('horoscopes')
                    .upsert(mappedData, { onConflict: 'sign,period_type,reference_date' });
                console.log(`[RashifalAPI] DB cache updated for ${signLower} (${period})`);
            } catch (saveError) {
                console.error('[RashifalAPI] DB Cache save error:', saveError.message);
            }
        }

        return res.json({ success: true, data: mappedData });

    } catch (error) {
        console.error('[RashifalAPI] Error:', error.message);
        return res.status(500).json({ 
            success: false, 
            error: "INTERNAL_SERVER_ERROR", 
            msg: error.response?.data?.msg || error.message 
        });
    }
};

router.get('/astrology/horoscope', handleHoroscopeRequest);
router.post('/astrology/horoscope', handleHoroscopeRequest);

module.exports = router;
