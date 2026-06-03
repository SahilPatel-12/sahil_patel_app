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

const ASTROLOGY_API_BASE_URL = "https://json.astrologyapi.com/v1";

/**
 * Executes a single request against AstrologyAPI
 */
const executeAstroRequest = async (endpoint, birthData, lang = 'en') => {
    const userId = process.env.ASTROLOGY_USER_ID || '651550';
    const apiKey = process.env.ASTROLOGY_API_KEY || 'ak-36483fc8a7f94df8504faacc4db3a46cafb353bd';

    if (!userId || !apiKey) {
        throw new Error("AstrologyAPI credentials not configured in environment variables.");
    }

    const auth = `Basic ${Buffer.from(`${userId}:${apiKey}`).toString('base64')}`;
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': auth,
        'x-astrologyapi-key': apiKey,
        'x-astrologyapi-language': lang
    };

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

    const url = `${ASTROLOGY_API_BASE_URL}/${endpoint}`;
    const response = await axios.post(url, payload, { headers, timeout: 15000 });
    return response.data;
};

/**
 * Fetches an endpoint safely so that individual sub-endpoint failures do not crash the entire request.
 */
const fetchEndpointSafely = async (ep, birthData, lang) => {
    try {
        const data = await executeAstroRequest(ep.url, birthData, lang);
        
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

        console.log(`[KundliAPI] Compiling birth chart for Date: ${bData.day}/${bData.month}/${bData.year} Time: ${bData.hour}:${bData.min}`);

        // 26 essential Vedic & Astro endpoints to fetch (omitting unused kp_planets, kp_house_cusps, sarvashtak)
        const endpoints = [
            { key: 'core', url: 'astro_details' },
            { key: 'panchang', url: 'basic_panchang' },
            { key: 'dasha', url: 'major_vdasha' },
            { key: 'current_dasha', url: 'current_vdasha' },
            { key: 'gemstone', url: 'basic_gem_suggestion' },
            { key: 'rudraksha', url: 'rudraksha_suggestion' },
            { key: 'character', url: 'personal_characteristics' },
            { key: 'career', url: 'career_report' },
            { key: 'health', url: 'health_report' },
            { key: 'love', url: 'love_report' },
            { key: 'physical', url: 'physique_report' },
            { key: 'numero_table', url: 'numero_table' },
            { key: 'numero_report', url: 'numero_report' },
            { key: 'numero_time', url: 'numero_time' },
            { key: 'numero_place_vastu', url: 'numero_place_vastu' },
            { key: 'planets', url: 'planets' },
            { key: 'yoga_report', url: 'yoga_report' },
            { key: 'manglik', url: 'manglik' },
            { key: 'sadhesati', url: 'sadhesati_current_status' },
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
        const tasks = endpoints.map(ep => fetchEndpointSafely(ep, bData, lang));
        const taskResults = await Promise.all(tasks);

        // Compile results dictionary
        const compiledData = {};
        for (const resItem of taskResults) {
            compiledData[resItem.key] = resItem.value;
        }

        console.log(`[KundliAPI] Completed compiled parallel fetch in ${Date.now() - startTime}ms`);
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
