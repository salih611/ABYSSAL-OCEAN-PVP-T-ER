// pages/api/players.js
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // YENİ UPSTASH BİLGİLERİ
    const UPSTASH_URL = 'https://adequate-loon-101577.upstash.io';
    const UPSTASH_TOKEN = 'gQAAAAAAAYzJAAIgcDJhOWJiYWFhM2M2MmE0NThkYTJiMjZjZmM3ZDcxZWMwNA';
    
    try {
        console.log('📡 Redis bağlanıyor...');
        
        const response = await fetch(`${UPSTASH_URL}/get/players`, {
            method: 'GET',
            headers: { 
                Authorization: `Bearer ${UPSTASH_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Redis hatası ${response.status}: ${errorText}`);
            return res.status(response.status).json({ 
                error: 'Redis bağlantı hatası', 
                status: response.status,
                details: errorText 
            });
        }
        
        const data = await response.json();
        
        let players = [];
        if (data.result) {
            try {
                players = JSON.parse(data.result);
            } catch(e) {
                console.error('JSON parse hatası:', e);
                players = [];
            }
        }
        
        console.log(`✅ ${players.length} oyuncu yüklendi`);
        res.status(200).json(players);
        
    } catch (error) {
        console.error('❌ Kritik hata:', error.message);
        res.status(500).json({ 
            error: 'Sunucu hatası', 
            message: error.message 
        });
    }
}
