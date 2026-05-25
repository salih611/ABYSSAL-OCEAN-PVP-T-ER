// /pages/api/players.js veya /api/players.js
const axios = require('axios');

const UPSTASH_URL = process.env.UPSTASH_URL || 'https://uncommon-monkey-135537.upstash.io';
const UPSTASH_TOKEN = process.env.UPSTASH_TOKEN || 'gQAAAAAAAhFxAAIgcDIyZDllZWY2MjZlZDU0MjAwOTYwYzhjYTkzYmI4MDY3ZQ';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        const response = await axios.get(`${UPSTASH_URL}/get/players`, {
            headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
        });
        
        let players = [];
        if (response.data.result) {
            players = JSON.parse(response.data.result);
        }
        
        res.status(200).json(players);
    } catch (error) {
        console.error('Redis okuma hatası:', error);
        res.status(500).json({ error: 'Veriler alınamadı', details: error.message });
    }
}
