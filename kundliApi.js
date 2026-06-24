/**
 * Standalone Janam Kundli API for Express (Node.js)
 * 
 * Refactored for high-performance (parallel endpoints fetching) and security (environment variables credentials).
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

// Attempt to load Supabase for DB config
let supabase = null;
try {
    const supabaseModule = require('./backend/src/utils/supabase') || require('./src/utils/supabase');
    supabase = supabaseModule.supabase;
} catch (e) {
    const url = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
        try {
            const { createClient } = require('@supabase/supabase-js');
            supabase = createClient(url, key);
        } catch (err) {
            console.warn('[KundliAPI] Supabase client could not be loaded:', err.message);
        }
    }
}

/**
 * Resolves the API Configuration dynamically from Supabase or environment fallbacks.
 */
const resolveAstrologyConfig = async (provider) => {
    let userId = process.env.ASTROLOGY_USER_ID || '652693';
    let apiKey = process.env.ASTROLOGY_API_KEY || 'ak-78d22f4e9a7680c4ac68ce28053f9d09fd3d56bf';
    let baseUrl = "https://json.astrologyapi.com/v1";

    if (supabase) {
        try {
            const encryptionKey = process.env.EXPO_PUBLIC_ENCRYPTION_KEY || process.env.VITE_ENCRYPTION_KEY;
            if (!encryptionKey) {
                throw new Error('Encryption key is missing in environment variables.');
            }
            if (encryptionKey.length < 16) {
                throw new Error('Encryption key must be at least 16 characters long.');
            }
            
            // Fetch configs via RPC to bypass RLS
            const { data: configs, error: configsErr } = await supabase.rpc('get_api_configs');
            if (configsErr) throw configsErr;

            let config = configs ? configs.find(c => c.provider === provider) : null;

            // Fallback to general astrology_api if specific not found or inactive
            if (!config || !config.is_active) {
                const generalConfig = configs ? configs.find(c => c.provider === 'astrology_api') : null;
                if (generalConfig && generalConfig.is_active) {
                    config = generalConfig;
                }
            }

            if (config && config.is_active) {
                if (config.base_url) baseUrl = config.base_url.replace(/\/+$/, '');
                if (config.api_username) userId = config.api_username;

                // Decrypt API key using RPC
                const { data: decryptedKey, error: decryptErr } = await supabase.rpc('get_decrypted_api_key', {
                    p_provider: config.provider,
                    p_encryption_key: encryptionKey
                });

                if (decryptedKey && !decryptErr) {
                    apiKey = decryptedKey;
                } else {
                    console.warn(`[KundliAPI] Failed to decrypt key for ${config.provider}:`, decryptErr?.message);
                }
            }
        } catch (err) {
            console.error('[KundliAPI] Error resolving DB config:', err.message);
        }
    }

    return { userId, apiKey, baseUrl };
};

/**
 * Executes a single request against AstrologyAPI
 */
const executeAstroRequest = async (endpoint, birthData, lang = 'en', config) => {
    const { userId, apiKey, baseUrl } = config;

    const headers = {
        'Content-Type': 'application/json',
        'x-astrologyapi-language': lang
    };
    if (userId && apiKey) {
        headers['Authorization'] = `Basic ${Buffer.from(`${userId}:${apiKey}`).toString('base64')}`;
    }
    if (apiKey) {
        headers['x-astrologyapi-key'] = apiKey;
    }

    // Format lat/lon to 4 decimal places matching the standard
    const payload = {
        day: Number(birthData.day),
        month: Number(birthData.month),
        year: Number(birthData.year),
        hour: Number(birthData.hour),
        min: Number(birthData.min),
        lat: Number(parseFloat(birthData.lat).toFixed(4)),
        lon: Number(parseFloat(birthData.lon).toFixed(4)),
        tzone: Number(birthData.tzone),
        gender: birthData.gender || 'male',
        ayanamsa: 1,
        lan: lang,
        language: lang
    };

    const url = `${baseUrl}/${endpoint}`;
    const response = await axios.post(url, payload, { headers, timeout: 15000 });
    return response.data;
};

/**
 * Fetches an endpoint safely so that individual sub-endpoint failures do not crash the entire request.
 */
const fetchEndpointSafely = async (ep, birthData, lang, config) => {
    try {
        const data = await executeAstroRequest(ep.url, birthData, lang, config);
        
        let value;
        if (ep.url.includes('horo_chart_image')) {
            value = data.svg || data.svg_code || null;
        } else if (ep.key === 'planets') {
            value = Array.isArray(data) ? data : (data.planets || data);
        } else {
            value = data;
        }
        return { key: ep.key, value };
    } catch (error) {
        console.error(`[KundliAPI] Failed to fetch sub-endpoint '${ep.key}' (${ep.url}):`, error.message);
        return { 
            key: ep.key, 
            value: { error: true, msg: 'FETCH_FAILED', detail: error.response?.data?.msg || error.message } 
        };
    }
};

/**
 * Mega Endpoint: Fetches all 26 essential Kundli endpoints in parallel & returns compiled data
 */
router.post('/astrology/kundli', async (req, res) => {
    try {
        const { birthData, language } = req.body;
        const lang = language || 'en';
        
        // Handle potential nested birthData object
        const bData = birthData?.birthData || birthData;

        if (!bData || !bData.day || !bData.month || !bData.year || bData.hour === undefined || bData.min === undefined || !bData.lat || !bData.lon || bData.tzone === undefined) {
            return res.status(400).json({ 
                success: false, 
                error: "INVALID_INPUT", 
                msg: "Required fields: day, month, year, hour, min, lat, lon, tzone" 
            });
        }

        const day = Number(bData.day);
        const month = Number(bData.month);
        const year = Number(bData.year);
        const hour = Number(bData.hour);
        const min = Number(bData.min);
        const lat = Number(parseFloat(bData.lat).toFixed(4));
        const lon = Number(parseFloat(bData.lon).toFixed(4));
        const tzone = Number(parseFloat(bData.tzone).toFixed(1));
        const gender = (bData.gender || 'male').toLowerCase();

        const birthDataToUse = {
            day,
            month,
            year,
            hour,
            min,
            lat,
            lon,
            tzone,
            gender
        };

        console.log(`[KundliAPI] Compiling birth chart for Date: ${day}/${month}/${year} Time: ${hour}:${min}`);

        // 1. Try DB cache first
        if (supabase) {
            try {
                const { data: existing } = await supabase
                    .from('kundlis')
                    .select('*')
                    .eq('day', day)
                    .eq('month', month)
                    .eq('year', year)
                    .eq('hour', hour)
                    .eq('min', min)
                    .eq('lat', lat)
                    .eq('lon', lon)
                    .eq('tzone', tzone)
                    .eq('gender', gender)
                    .eq('language', lang)
                    .maybeSingle();

                if (existing && existing.data) {
                    console.log(`[KundliAPI] DB cache hit for birth chart`);
                    return res.json({ success: true, data: existing.data });
                }
            } catch (dbErr) {
                console.error('[KundliAPI] DB Cache read error:', dbErr.message);
            }
        }

        // Resolve config dynamically once at beginning of request
        const config = await resolveAstrologyConfig('kundli_api');

        // All 26 essential Kundli endpoints to fetch
        const endpoints = [
            { key: 'core', url: 'astro_details' },
            { key: 'panchang', url: 'basic_panchang' },
            { key: 'dasha', url: 'major_vdasha' },
            { key: 'current_dasha', url: 'current_vdasha' },
            { key: 'gemstone', url: 'basic_gem_suggestion' },
            { key: 'rudraksha', url: 'rudraksha_suggestion' },
            { key: 'character', url: 'general_ascendant_report' },
            { key: 'career', url: 'career_report' },
            { key: 'health', url: 'health_report' },
            { key: 'love', url: 'manglik' },
            { key: 'physical', url: 'general_ascendant_report' },
            { key: 'numero_table', url: 'numero_table' },
            { key: 'numero_report', url: 'numero_report' },
            { key: 'numero_time', url: 'numero_fav_time' },
            { key: 'numero_place_vastu', url: 'numero_place_vastu' },
            { key: 'planets', url: 'planets' },
            { key: 'yoga_report', url: 'yoga_report' },
            { key: 'manglik', url: 'manglik' },
            { key: 'sadhesati', url: 'sadhesati_current_status' },
            { key: 'kp_planets', url: 'kp_planets' },
            { key: 'kp_house_cusps', url: 'kp_house_cusps' },
            { key: 'sarvashtak', url: 'sarvashtak' },
            { key: 'chart_d1', url: 'horo_chart_image/D1' },
            { key: 'chart_d9', url: 'horo_chart_image/D9' },
            { key: 'chart_sun', url: 'horo_chart_image/SUN' },
            { key: 'chart_moon', url: 'horo_chart_image/MOON' },
            { key: 'chart_d2', url: 'horo_chart_image/D2' },
            { key: 'chart_d3', url: 'horo_chart_image/D3' },
            { key: 'chart_d10', url: 'horo_chart_image/D10' }
        ];

        const startTime = Date.now();

        // Fetch all 26 endpoints concurrently
        const tasks = endpoints.map(ep => fetchEndpointSafely(ep, birthDataToUse, lang, config));
        const taskResults = await Promise.all(tasks);

        // Compile results dictionary
        const compiledData = {};
        for (const resItem of taskResults) {
            compiledData[resItem.key] = resItem.value;
        }

        console.log(`[KundliAPI] Completed compiled parallel fetch in ${Date.now() - startTime}ms`);

        // Save to DB cache
        if (supabase) {
            try {
                const cacheData = {
                    day,
                    month,
                    year,
                    hour,
                    min,
                    lat,
                    lon,
                    tzone,
                    gender,
                    language: lang,
                    data: compiledData
                };
                await supabase
                    .from('kundlis')
                    .upsert(cacheData, { onConflict: 'day,month,year,hour,min,lat,lon,tzone,gender,language' });
                console.log(`[KundliAPI] DB cache updated for birth chart`);
            } catch (saveError) {
                console.error('[KundliAPI] DB Cache save error:', saveError.message);
            }
        }

        return res.json({ success: true, data: compiledData });

    } catch (error) {
        console.error('[KundliAPI] Critical Exception:', error);
        return res.status(500).json({ 
            success: false, 
            error: "INTERNAL_SERVER_ERROR", 
            msg: error.message 
        });
    }
});

module.exports = router;
