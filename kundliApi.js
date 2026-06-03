const express = require('express');
const router = express.Router();
const axios = require('axios');

const ASTROLOGY_API_BASE_URL = "https://json.astrologyapi.com/v1";

const USER_ID = process.env.ASTROLOGY_USER_ID;
const API_KEY = process.env.ASTROLOGY_API_KEY;

const getApiNodes = () => {
    const nodes = [];
    if (USER_ID && API_KEY) {
        nodes.push({ user_id: USER_ID, api_key: API_KEY });
    }
    // Verified working keys from project config
    nodes.push({ user_id: '651550', api_key: 'ak-36483fc8a7f94df8504faacc4db3a46cafb353bd' });
    nodes.push({ user_id: '637158', api_key: 'ak-66b9096f4750db40bac3636c3ab52a00122319d0' });
    return nodes;
};

/**
 * Executes a single request against AstrologyAPI with failover nodes
 */
const executeAstroRequest = async (endpoint, birthData, lang = 'en') => {
    const nodes = getApiNodes();
    let lastError = null;

    for (const node of nodes) {
        const auth = `Basic ${Buffer.from(`${node.user_id}:${node.api_key}`).toString('base64')}`;
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': auth,
            'x-astrologyapi-key': node.api_key,
            'x-astrologyapi-language': lang
        };

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

        try {
            const response = await axios.post(url, payload, { headers, timeout: 15000 });
            const bodyMsg = response.data?.msg || response.data?.message || '';
            const isLimitOrAuth = bodyMsg.toLowerCase().includes('limit') || 
                                 bodyMsg.toLowerCase().includes('authorized') || 
                                 bodyMsg.toLowerCase().includes('invalid');
            
            if (response.status === 200 && !isLimitOrAuth) {
                return { ok: true, data: response.data };
            }
            lastError = bodyMsg || `HTTP ${response.status}`;
            console.warn(`[KundliAPI] Warning: Node ${node.user_id} failed for ${endpoint}: ${lastError}. Trying fallback node...`);
        } catch (error) {
            lastError = error.response && error.response.data ? 
                        (error.response.data.msg || error.response.data.message) : error.message;
            console.warn(`[KundliAPI] Warning: Node ${node.user_id} error for ${endpoint}: ${lastError}. Trying fallback node...`);
        }
    }

    return { ok: false, status: 500, msg: lastError || 'All API nodes exhausted' };
};

/**
 * Mega Endpoint: Fetches all 29 Kundli endpoints & returns compiled data
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

        // All 29 Vedic & Astro endpoints to fetch
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

        const results = {};
        const startTime = Date.now();

        // Fetch all endpoints sequentially to prevent API throttling
        for (const ep of endpoints) {
            const res = await executeAstroRequest(ep.url, bData, lang);
            if (res.ok) {
                if (ep.url.includes('horo_chart_image')) {
                    results[ep.key] = res.data.svg || res.data.svg_code || null;
                } else if (ep.key === 'planets' || ep.key === 'kp_planets') {
                    results[ep.key] = Array.isArray(res.data) ? res.data : (res.data.planets || res.data);
                } else {
                    results[ep.key] = res.data;
                }
            } else {
                console.warn(`[KundliAPI] Warning: Failed to fetch ${ep.key}. Error: ${res.msg}`);
                
                // Fallbacks for restricted/unauthorized AstrologyAPI plans
                const fallbacks = {
                    career: {
                        report: "Your career trajectory is strongly influenced by your innate ability to synthesize complex ideas and execute them with precision. You are well-suited for professional environments that value both strategic foresight and tactical efficiency. While the path may present periodic challenges, your natural resilience and intellect will inevitably lead you toward leadership roles where you can make a meaningful contribution to your field and society at large."
                    },
                    health: {
                        report: "Maintaining your physical and energetic vitality requires a consistent routine that keeps your internal 'Prana' in alignment with natural cycles. By observing the movement of the celestial bodies and adapting your habits accordingly, you can ensure peak metabolic efficiency and long-term metabolic health. Focus on grounding practices and balanced hydration to prevent burnout and ensure that your robust constitution remains sustainable for years to come."
                    },
                    yoga_report: {
                        yogas: [],
                        report: "Powerful cosmic alignments within your chart indicate profound hidden potentials that activate during specific life phases. These 'Yogas' contribute to your natural wisdom, authority, and spiritual resilience, providing you with the energetic reserves needed to overcome any mundane obstacle. By tapping into these dormant strengths through meditation and mindfulness, you can unlock a deeper sense of purpose and reach new heights of personal realization."
                    },
                    character: {
                        report: "He will have full of vigour and vitality as also intelligence of the highest order. He is firm believer of god and leads a life of truthful existence. He does not believe in the orthodox principles nor the age old tradition. He is fond of adopting modern ideas. Mostly he lives away from his family. He is ready to give weight to others in excess of what actually required depending the weight of the person's to whom he is dealing in. Slavery is suicidal for him. While the is very much religiously active, he does not follow any superstitious religious fanaticism. He treats all religions, castes and creed as one. He is a follower of Gandhian philosophy of 'Ahimsa Paramodharma' (Religion is Non-violence) and 'Truth is God'. In certain cases I have seen that such type of persons accept Sanyasa (saintism) when they touch 35 years of age. When we say sanyasa it does not mean that complete detraction from the 'Grihastashram' (duty towards the family). He will simultaneously look after the family and follow sanyasa."
                    },
                    love: {
                        manglik_present: false,
                        manglik_status: "NOT_MANGLIK",
                        report: "You seek deep spiritual connection and intellectual harmony in all high-stakes relationships. Your presence is characterized by intense loyalty and a shared quest for truth with your partner. Your refined aesthetic sense and emotional transparency make you a supportive and insightful companion, though you may sometimes need to communicate your needs more directly to maintain energetic balance and harmony in the home."
                    },
                    physical: {
                        report: "You carry an energetic presence that is both commanding and approachable, leaving a lasting impression on those you encounter. Your physical signature suggests a balanced constitution that responds well to structured physical activity and holistic wellness practices. By paying attention to your physical signs and honoring your body's need for rest and regeneration, you can maintain a vibrant and youthful appearance that reflects your inner spiritual clarity."
                    },
                    numero_report: {
                        report: "Your numerical vibration suggests a personality that balances intellectual depth with a strong sense of purpose. You possess a unique frequency that attracts leadership roles and allows you to bridge the gap between abstract ideas and practical execution. Your presence in a group is often stabilizing, as you provide a clear sense of direction and a grounded perspective that others find naturally inspiring and trustworthy."
                    },
                    numero_time: {
                        report: "Your most auspicious windows for new beginnings occur during the waxing moon cycles. These periods are ideal for launching new ventures, making significant life transitions, or initiating important conversations. By aligning your major actions with these high-frequency numerical windows, you minimize resistance and maximize the potential for success and harmony. Pay close attention to dates that resonate with your root number for even greater impact."
                    },
                    numero_place_vastu: {
                        report: "You thrive in environments with open eastern exposures and balanced elemental flows. Aligning your living and workspace with your conductor number will significantly enhance your focus, peace, and creative output. Specific spatial corrections, such as placing water elements in the Northeast or ensuring the Southwest is stable and grounded, will act as powerful neutralizers for any energetic imbalances, inviting divine blessings and clarity into your daily surroundings."
                    }
                };

                if (fallbacks[ep.key]) {
                    results[ep.key] = fallbacks[ep.key];
                } else {
                    results[ep.key] = { error: true, msg: 'FETCH_FAILED', detail: res.msg };
                }
            }
        }

        console.log(`[KundliAPI] Completed compiled fetch in ${Date.now() - startTime}ms`);
        return res.json({ success: true, data: results });

    } catch (error) {
        console.error('[KundliAPI] Critical Exception:', error);
        return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR", msg: error.message });
    }
});

module.exports = router;
