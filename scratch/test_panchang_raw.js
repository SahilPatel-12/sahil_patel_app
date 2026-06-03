const axios = require('axios');

const nodes = [
    { user_id: '651550', api_key: 'ak-36483fc8a7f94df8504faacc4db3a46cafb353bd' },
    { user_id: '637158', api_key: 'ak-66b9096f4750db40bac3636c3ab52a00122319d0' }
];

const payload = {
    day: 3,
    month: 6,
    year: 2026,
    hour: 12,
    min: 0,
    lat: 28.6139,
    lon: 77.2090,
    tzone: 5.5
};

async function run() {
    for (const node of nodes) {
        const auth = `Basic ${Buffer.from(`${node.user_id}:${node.api_key}`).toString('base64')}`;
        try {
            const res = await axios.post('https://json.astrologyapi.com/v1/advanced_panchang', payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': auth,
                    'x-astrologyapi-key': node.api_key
                }
            });
            console.log("SUCCESS on node", node.user_id);
            console.log(JSON.stringify(res.data, null, 2));
            return;
        } catch (err) {
            console.error("FAIL on node", node.user_id, err.message);
        }
    }
}

run();
