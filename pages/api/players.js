// pages/api/players.js
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const UPSTASH_URL = 'https://real-urchin-90350.upstash.io';
    const UPSTASH_TOKEN = 'ggAAAAAAAWDuAAIgcDHgONANYCCw_HIarBfhvrDX0CHEIsrIIMeaKvpSXNtKgg';
    
    try {
        const response = await fetch(`${UPSTASH_URL}/get/players`, {
            headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
        });
        const data = await response.json();
        
        let players = [];
        if (data.result) {
            players = JSON.parse(data.result);
        }
        
        res.status(200).json(players);
    } catch (error) {
        console.error('Redis hatası:', error);
        res.status(500).json({ error: 'Veriler alınamadı', message: error.message });
    }
}
