/**
 * Standalone Vedic Panchang API for Express (Node.js)
 * 
 * This file is completely self-contained. It scrapes the daily Panchang details
 * from AstroSage and returns a structured JSON payload to your mobile application.
 * 
 * Prerequisites:
 * npm install express axios cheerio
 * 
 * How to integrate:
 * 1. Save this file as `panchangApi.js` on your other laptop.
 * 2. Mount it in your Express app:
 *    const panchangRouter = require('./panchangApi');
 *    app.use('/api', panchangRouter);
 * 3. Call it from your Android App:
 *    GET http://localhost:4000/api/astrology/panchang
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

class PanchangScraper {
    static async fetchPanchangFromAstroSage() {
        const url = 'https://panchang.astrosage.com/panchang/aajkapanchang?language=en';
        
        const { data: html } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
            },
            timeout: 20000,
        });

        const $ = cheerio.load(html);
        
        const result = {
            reference_date: new Date().toISOString().split('T')[0],
            title: '',
            location: '',
            panchang_for_today: {},
            sun_moon_calculations: {},
            hindu_month_year: {},
            inauspicious_timings: {},
            auspicious_timings: {},
        };

        // Extract title and location
        const titleText = $('title').text().trim();
        result.title = titleText.split('Panchangam for')[0].trim() || 'Today Panchang';
        result.location = titleText.split('Panchangam for')[1]?.trim() || 'New Delhi, India';

        const parseSection = (sectionTitle, targetObj) => {
            $(`h4:contains("${sectionTitle}")`).next('.row').find('.pan-row').each((_, el) => {
                const label = $(el).find('div').first().text().trim();
                let value = $(el).find('div').last().text().trim();
                value = value.replace(/\s+/g, ' ').trim();
                if (label && value) {
                    targetObj[label] = value;
                }
            });
        };

        parseSection('Panchang For Today', result.panchang_for_today);
        parseSection('Sun And Moon Calculations', result.sun_moon_calculations);
        parseSection('Hindu Month And Year', result.hindu_month_year);
        parseSection('Inauspicious Timings', result.inauspicious_timings);
        parseSection('Auspicious Timings', result.auspicious_timings);

        return result;
    }
}

// Route Handler
router.get('/astrology/panchang', async (req, res) => {
    try {
        console.log(`[PanchangAPI] Scraping daily Panchang...`);
        const data = await PanchangScraper.fetchPanchangFromAstroSage();
        return res.json({ success: true, data });
    } catch (error) {
        console.error('[PanchangAPI] Error:', error.message);
        return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
    }
});

module.exports = router;
