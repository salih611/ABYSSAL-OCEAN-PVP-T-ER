import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const UPSTASH_URL = 'https://adequate-loon-101577.upstash.io';
const UPSTASH_TOKEN = 'gQAAAAAAAYzJAAIgcDJhOWJiYWFhM2M2MmE0NThkYTJiMjZjZmM3ZDcxZWMwNA';

// 🔐 ADMİN ŞİFRESİ - DEĞİŞTİR!
const ADMIN_PASSWORD = "yunun123";

const KITS = ["vanilla", "sword", "axe", "nethpot", "pot", "uhc", "smp", "mace"];
const TIERS = ["HT1", "LT1", "HT2", "LT2", "HT3", "LT3", "HT4", "LT4", "HT5", "LT5"];
const REGIONS = [
  { key: "TR", flag: "🇹🇷", name: "Türkiye" },
  { key: "EU", flag: "🇪🇺", name: "Avrupa" },
  { key: "NA", flag: "🇺🇸", name: "Amerika" }
];

const cleanTier = (tier: string | undefined | null): string | null => {
  if (!tier) return null;
  let cleaned = String(tier).replace(/Crystal\s+/gi, "").trim();
  cleaned = cleaned.replace(/^(Vanilla|Sword|Axe|Nethpot|NethOP|Pot|UHC|SMP|Mace)\s+/i, "").trim();
  const match = cleaned.match(/(HT|LT)\s*([1-5])/i);
  return match ? `${match[1].toUpperCase()}${match[2]}` : null;
};

export default function AdminPanel() {
  const navigate = useNavigate();
  const [isAuthed, setIsAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"players" | "stats" | "add">("players");
  const [newPlayer, setNewPlayer] = useState({
    username: "", minecraftNick: "", region: "TR", tiers: {} as Record<string, string>
  });

  useEffect(() => {
    const savedAuth = localStorage.getItem("admin_auth");
    if (savedAuth === ADMIN_PASSWORD) setIsAuthed(true);
  }, []);

  useEffect(() => {
    if (isAuthed) fetchPlayers();
  }, [isAuthed]);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${UPSTASH_URL}/get/players`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
      });
      const data = await res.json();
      if (data.result) setPlayers(JSON.parse(data.result));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const savePlayers = async (updatedPlayers: any[]) => {
    setLoading(true);
    try {
      await fetch(`${UPSTASH_URL}/set/players`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedPlayers)
      });
      setPlayers(updatedPlayers);
      alert("✅ Başarıyla kaydedildi!");
    } catch (e) {
      alert("❌ Kayıt hatası!");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthed(true);
      localStorage.setItem("admin_auth", ADMIN_PASSWORD);
    } else {
      alert("❌ Yanlış şifre!");
    }
  };

  const handleLogout = () => {
    setIsAuthed(false);
    localStorage.removeItem("admin_auth");
    navigate("/");
  };

  const deletePlayer = async (id: string) => {
    if (!confirm("Bu oyuncuyu silmek istediğinden emin misin?")) return;
    const updated = players.filter(p => p.id !== id);
    await savePlayers(updated);
  };

  const saveEditedPlayer = async () => {
    const updated = players.map(p => p.id === editingPlayer.id ? editingPlayer : p);
    await savePlayers(updated);
    setEditingPlayer(null);
  };

  const addNewPlayer = async () => {
    if (!newPlayer.minecraftNick || !newPlayer.username) {
      alert("⚠️ Minecraft nick ve Discord username zorunlu!");
      return;
    }
    const player = {
      id: `manual_${Date.now()}`,
      username: newPlayer.username,
      discordId: `manual_${Date.now()}`,
      avatar: `https://mc-heads.net/avatar/${newPlayer.minecraftNick}/64`,
      region: newPlayer.region,
      tiers: newPlayer.tiers,
      totalPoints: 0,
      rank: 0,
      tests: 0,
      minecraftNick: newPlayer.minecraftNick
    };
    await savePlayers([...players, player]);
    setNewPlayer({ username: "", minecraftNick: "", region: "TR", tiers: {} });
    alert("✅ Oyuncu eklendi!");
  };

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-md bg-gradient-to-br from-[#11161f] to-[#0a0e14] rounded-3xl border border-white/10 p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 text-4xl">
              🛡️
            </div>
            <h1 className="text-2xl font-black text-white mb-2">Admin Panel</h1>
            <p className="text-white/50 text-sm">Yönetici girişi gerekli</p>
          </div>
          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Şifre..."
              className="w-full px-4 py-3 bg-[#1a1f2e] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
            />
            <button onClick={handleLogin} className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold hover:scale-105 transition-all">
              Giriş Yap
            </button>
            <button onClick={() => navigate("/")} className="w-full px-4 py-3 bg-white/5 rounded-xl text-white/60 hover:bg-white/10 transition-all">
              Ana Sayfaya Dön
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const filteredPlayers = players.filter(p => 
    !searchQuery || 
    p.minecraftNick?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0e14] text-white">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0f141b]/80 border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">🛡️</div>
            <div>
              <h1 className="font-black">Admin Panel</h1>
              <p className="text-xs text-cyan-400">Abyssal Ocean</p>
            </div>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-sm font-medium">
            🚪 Çıkış
          </button>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { key: "players", label: `👥 Oyuncular (${players.length})` },
            { key: "add", label: "➕ Ekle" },
            { key: "stats", label: "📊 İstatistikler" }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg"
                  : "bg-[#1a1f2e] text-white/60 hover:bg-[#222838]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-4 pb-8">
        {activeTab === "players" && (
          <div>
            <input
              type="text"
              placeholder="🔍 Oyuncu ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 mb-4 bg-[#1a1f2e] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
            />
            <div className="space-y-2">
              {filteredPlayers.length === 0 ? (
                <div className="text-center py-12 text-white/40">Oyuncu bulunamadı</div>
              ) : (
                filteredPlayers.map(player => (
                  <div key={player.id} className="bg-[#11161f] border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                    <img src={player.avatar} alt="" className="w-12 h-12 rounded-xl" onError={(e) => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/Steve/64`; }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{player.minecraftNick || player.username}</div>
                      <div className="text-xs text-white/40">@{player.username} • {Object.keys(player.tiers || {}).length} kit • {player.region}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingPlayer({...player})} className="px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-sm font-medium">
                        ✏️ Düzenle
                      </button>
                      <button onClick={() => deletePlayer(player.id)} className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium">
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "add" && (
          <div className="bg-[#11161f] border border-white/5 rounded-2xl p-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-4">➕ Manuel Oyuncu Ekle</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1 block">Minecraft Nick *</label>
                <input
                  type="text"
                  value={newPlayer.minecraftNick}
                  onChange={(e) => setNewPlayer({ ...newPlayer, minecraftNick: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1a1f2e] border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Discord Username *</label>
                <input
                  type="text"
                  value={newPlayer.username}
                  onChange={(e) => setNewPlayer({ ...newPlayer, username: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1a1f2e] border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Bölge</label>
                <select
                  value={newPlayer.region}
                  onChange={(e) => setNewPlayer({ ...newPlayer, region: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1a1f2e] border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500/50"
                >
                  {REGIONS.map(r => <option key={r.key} value={r.key}>{r.flag} {r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-white/60 mb-2 block">Kit Tier'ları</label>
                <div className="grid grid-cols-2 gap-2">
                  {KITS.map(kit => (
                    <div key={kit} className="flex items-center gap-2">
                      <span className="w-20 text-sm capitalize">{kit}</span>
                      <select
                        value={newPlayer.tiers[kit] || ""}
                        onChange={(e) => setNewPlayer({ ...newPlayer, tiers: { ...newPlayer.tiers, [kit]: e.target.value } })}
                        className="flex-1 px-2 py-1 bg-[#1a1f2e] border border-white/10 rounded text-sm"
                      >
                        <option value="">— Yok —</option>
                        {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={addNewPlayer} disabled={loading} className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50">
                ➕ Oyuncuyu Ekle
              </button>
            </div>
          </div>
        )}

        {activeTab === "stats" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-2xl p-6">
              <div className="text-4xl mb-2">👥</div>
              <div className="text-3xl font-black">{players.length}</div>
              <div className="text-sm text-white/60">Toplam Oyuncu</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6">
              <div className="text-4xl mb-2">🎯</div>
              <div className="text-3xl font-black">{players.reduce((acc, p) => acc + (p.tests || 0), 0)}</div>
              <div className="text-sm text-white/60">Toplam Test</div>
            </div>
            <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-6">
              <div className="text-4xl mb-2">🇹🇷</div>
              <div className="text-3xl font-black">{players.filter(p => p.region === "TR").length}</div>
              <div className="text-sm text-white/60">TR Oyuncular</div>
            </div>
          </div>
        )}
      </main>

      {editingPlayer && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setEditingPlayer(null)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#11161f] rounded-3xl border border-white/10 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">✏️ {editingPlayer.minecraftNick}</h2>
            
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-white/60">Minecraft Nick</label>
                <input
                  type="text"
                  value={editingPlayer.minecraftNick || ""}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, minecraftNick: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1a1f2e] border border-white/10 rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs text-white/60">Bölge</label>
                <select
                  value={editingPlayer.region || "TR"}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, region: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1a1f2e] border border-white/10 rounded-lg"
                >
                  {REGIONS.map(r => <option key={r.key} value={r.key}>{r.flag} {r.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="text-xs text-white/60 uppercase">Tier'lar</div>
              {KITS.map(kit => (
                <div key={kit} className="flex items-center gap-2">
                  <span className="w-20 text-sm capitalize">{kit}</span>
                  <select
                    value={cleanTier(editingPlayer.tiers?.[kit]) || ""}
                    onChange={(e) => setEditingPlayer({
                      ...editingPlayer,
                      tiers: { ...editingPlayer.tiers, [kit]: e.target.value }
                    })}
                    className="flex-1 px-2 py-1 bg-[#1a1f2e] border border-white/10 rounded text-sm"
                  >
                    <option value="">— Yok —</option>
                    {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={saveEditedPlayer} disabled={loading} className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50">
                💾 Kaydet
              </button>
              <button onClick={() => setEditingPlayer(null)} className="px-4 py-3 bg-white/5 rounded-xl hover:bg-white/10">
                İptal
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
