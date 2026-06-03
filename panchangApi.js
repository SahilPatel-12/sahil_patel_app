/**
 * Standalone Vedic Panchang API for Express (Node.js)
 * 
 * Replaces AstroSage scraping with dynamic, location-accurate AstrologyAPI `/advanced_panchang` integrations.
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
    // Ignore env loading errors
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
            console.warn('[PanchangAPI] Supabase client could not be loaded:', err.message);
        }
    }
}

/**
 * Maps the rich AstrologyAPI advanced panchang details into the client's expected format.
 */
const mapPanchangResponse = (apiData, referenceDate, lat, lon) => {
    const formatTime = (t) => {
        if (!t) return 'N/A';
        if (typeof t === 'string') return t;
        return `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}:${String(t.second || 0).padStart(2, '0')}`;
    };

    const getEndString = (elem) => {
        if (!elem || !elem.details) return 'N/A';
        const name = elem.details.tithi_name || elem.details.nak_name || elem.details.yog_name || elem.details.karan_name || 'N/A';
        if (elem.end_time) {
            return `${name} (ends at ${String(elem.end_time.hour).padStart(2, '0')}:${String(elem.end_time.minute).padStart(2, '0')})`;
        }
        return name;
    };

    return {
        reference_date: referenceDate,
        title: `Panchang for ${referenceDate}`,
        location: `Latitude: ${lat.toFixed(4)}, Longitude: ${lon.toFixed(4)}`,
        panchang_for_today: {
            "Tithi": getEndString(apiData.tithi),
            "Nakshatra": getEndString(apiData.nakshatra),
            "Yoga": getEndString(apiData.yog || apiData.yoga),
            "Karan": getEndString(apiData.karan),
            "Weekday": apiData.day || 'N/A',
            "Ritu": apiData.ritu || 'N/A',
            "Paksha": apiData.paksha || 'N/A',
            "Sun Sign": apiData.sun?.sun_sign || apiData.sun_sign || 'N/A',
            "Moon Sign": apiData.moon?.moon_sign || apiData.moon_sign || 'N/A'
        },
        sun_moon_calculations: {
            "Sunrise": formatTime(apiData.sunrise || apiData.sun?.sunrise),
            "Sunset": formatTime(apiData.sunset || apiData.sun?.sunset),
            "Moonrise": formatTime(apiData.moonrise || apiData.moon?.moonrise),
            "Moonset": formatTime(apiData.moonset || apiData.moon?.moonset)
        },
        hindu_month_year: {
            "Shaka Samvat": apiData.shaka_samvat ? `${apiData.shaka_samvat} (${apiData.shaka_samvat_name || ''})` : 'N/A',
            "Vikram Samvat": apiData.vikram_samvat ? `${apiData.vikram_samvat} (${apiData.vkram_samvat_name || ''})` : 'N/A',
            "Month Amanta": apiData.hindu_maah?.amanta || 'N/A',
            "Month Purnimanta": apiData.hindu_maah?.purnimanta || 'N/A'
        },
        inauspicious_timings: {
            "Rahu Kaal": apiData.rahukaal ? `${apiData.rahukaal.start} - ${apiData.rahukaal.end}` : 'N/A',
            "Yamaganda": apiData.yamghant_kaal ? `${apiData.yamghant_kaal.start} - ${apiData.yamghant_kaal.end}` : 'N/A',
            "Gulika": apiData.guliKaal ? `${apiData.guliKaal.start} - ${apiData.guliKaal.end}` : 'N/A'
        },
        auspicious_timings: {
            "Abhijit Muhurta": apiData.abhijit_muhurta ? `${apiData.abhijit_muhurta.start} - ${apiData.abhijit_muhurta.end}` : 'N/A'
        }
    };
};

/**
 * Endpoint: GET/POST /astrology/panchang
 */
const handlePanchangRequest = async (req, res) => {
    try {
        const now = new Date();
        
        // Accept parameters from query (GET) or body (POST)
        const day = Number(req.query.day || req.body?.day || now.getDate());
        const month = Number(req.query.month || req.body?.month || (now.getMonth() + 1));
        const year = Number(req.query.year || req.body?.year || now.getFullYear());
        const hour = Number(req.query.hour || req.body?.hour || now.getHours());
        const min = Number(req.query.min || req.body?.min || now.getMinutes());
        
        // Default to New Delhi coordinates
        const lat = Number(req.query.lat || req.body?.lat || 28.6139);
        const lon = Number(req.query.lon || req.body?.lon || 77.2090);
        const tzone = Number(req.query.tzone || req.body?.tzone || 5.5);

        const referenceDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        console.log(`[PanchangAPI] Request for ${referenceDateStr} at Lat: ${lat}, Lon: ${lon}`);

        // 1. Try DB cache first (only for default parameters to prevent coordinates mismatch in simple key cache)
        const isDefaultLocation = Math.abs(lat - 28.6139) < 0.01 && Math.abs(lon - 77.2090) < 0.01;
        if (supabase && isDefaultLocation) {
            try {
                const { data: existing } = await supabase
                    .from('panchangs')
                    .select('*')
                    .eq('reference_date', referenceDateStr)
                    .maybeSingle();

                if (existing && existing.data) {
                    console.log(`[PanchangAPI] DB cache hit for date ${referenceDateStr}`);
                    return res.json({ success: true, data: existing.data });
                }
            } catch (dbErr) {
                console.error('[PanchangAPI] DB Cache read error:', dbErr.message);
            }
        }

        // 2. Fetch from AstrologyAPI /advanced_panchang
        const userId = process.env.ASTROLOGY_USER_ID || '651550';
        const apiKey = process.env.ASTROLOGY_API_KEY || 'ak-36483fc8a7f94df8504faacc4db3a46cafb353bd';

        if (!userId || !apiKey) {
            console.error('[PanchangAPI] Credentials missing in environment variables.');
            return res.status(500).json({ 
                success: false, 
                error: "CONFIGURATION_ERROR", 
                msg: "AstrologyAPI credentials not configured in environment variables." 
            });
        }

        const auth = `Basic ${Buffer.from(`${userId}:${apiKey}`).toString('base64')}`;
        const url = `${ASTROLOGY_API_BASE_URL}/advanced_panchang`;

        const payload = {
            day,
            month,
            year,
            hour,
            min,
            lat: Number(lat.toFixed(4)),
            lon: Number(lon.toFixed(4)),
            tzone
        };

        console.log(`[PanchangAPI] Calling AstrologyAPI: ${url}`);
        const apiResponse = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': auth,
                'x-astrologyapi-key': apiKey
            },
            timeout: 15000
        });

        const mappedResult = mapPanchangResponse(apiResponse.data, referenceDateStr, lat, lon);

        // 3. Save to DB cache
        if (supabase) {
            try {
                await supabase
                    .from('panchangs')
                    .upsert({
                        reference_date: referenceDateStr,
                        data: mappedResult
                    }, { onConflict: 'reference_date' });
                console.log(`[PanchangAPI] DB cache updated for date ${referenceDateStr}`);
            } catch (saveError) {
                console.error('[PanchangAPI] DB Cache save error:', saveError.message);
            }
        }

        return res.json({ success: true, data: mappedResult });

    } catch (error) {
        console.error('[PanchangAPI] Error:', error.message);
        return res.status(500).json({ 
            success: false, 
            error: "INTERNAL_SERVER_ERROR", 
            msg: error.response?.data?.msg || error.message 
        });
    }
};

router.get('/astrology/panchang', handlePanchangRequest);
router.post('/astrology/panchang', handlePanchangRequest);

module.exports = router;
