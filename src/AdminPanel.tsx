import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Player {
  id: string;
  username: string;
  discordId: string;
  avatar: string;
  region: "TR" | "EU" | "NA";
  tiers: Record<string, string>;
  totalPoints: number;
  rank: number;
  tests: number;
  minecraftNick: string;
}

const UPSTASH_URL = 'https://adequate-loon-101577.upstash.io';
const UPSTASH_TOKEN = 'gQAAAAAAAYzJAAIgcDJhOWJiYWFhM2M2MmE0NThkYTJiMjZjZmM3ZDcxZWMwNA';

const ADMIN_PASSWORD = "Abyssalocean20266154";

const KITS = ["vanilla", "sword", "axe", "nethpot", "pot", "uhc", "mace", "smp"];
const KIT_ICONS: Record<string, string> = {
  vanilla: "✋", sword: "⚔️", axe: "🪓", nethpot: "💎",
  pot: "🧪", uhc: "🍎", mace: "🔨", smp: "🛡️"
};
const KIT_COLORS: Record<string, string> = {
  vanilla: "from-amber-400 to-yellow-600",
  sword: "from-blue-400 to-blue-600",
  axe: "from-purple-400 to-purple-600",
  nethpot: "from-pink-400 to-pink-600",
  pot: "from-rose-400 to-rose-600",
  uhc: "from-red-400 to-red-600",
  mace: "from-yellow-400 to-amber-600",
  smp: "from-green-400 to-green-600",
};
const TIERS = ["HT1", "LT1", "HT2", "LT2", "HT3", "LT3", "HT4", "LT4", "HT5", "LT5"];
const REGIONS: Array<"TR" | "EU" | "NA"> = ["TR", "EU", "NA"];

const TIER_POINTS: Record<string, number> = {
  "HT1": 60, "LT1": 44, "HT2": 28, "LT2": 16, "HT3": 10, "LT3": 6,
  "HT4": 4, "LT4": 3, "HT5": 2, "LT5": 1,
};

const TIER_COLORS: Record<string, string> = {
  HT1: "from-amber-400 to-yellow-600", LT1: "from-emerald-500 to-emerald-700",
  HT2: "from-slate-300 to-slate-500", LT2: "from-cyan-500 to-cyan-700",
  HT3: "from-orange-600 to-amber-700", LT3: "from-indigo-500 to-indigo-700",
  HT4: "from-blue-500 to-blue-700", LT4: "from-pink-500 to-pink-700",
  HT5: "from-purple-500 to-purple-700", LT5: "from-gray-500 to-gray-700",
};

// 🔥 TIER OKUMA - HER TÜRLÜ FORMATTAN OKU
const cleanTier = (tier: string | undefined | null): string | null => {
  if (!tier) return null;
  let cleaned = String(tier).replace(/Crystal\s+/gi, "").trim();
  cleaned = cleaned.replace(/^(Vanilla|Sword|Axe|Nethpot|NethOP|Pot|UHC|SMP|Mace)\s+/i, "").trim();
  const match = cleaned.match(/(HT|LT)\s*([1-5])/i);
  return match ? `${match[1].toUpperCase()}${match[2]}` : null;
};

const calculateTotalPoints = (tiers: Record<string, string>): number => {
  if (!tiers) return 0;
  let total = 0;
  for (const tier of Object.values(tiers)) {
    const cleaned = cleanTier(tier);
    total += cleaned ? (TIER_POINTS[cleaned] || 0) : 0;
  }
  return total;
};

export default function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRegion, setFilterRegion] = useState<string>("ALL");
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [statsModal, setStatsModal] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setAuthenticated(true);
      sessionStorage.setItem("admin_auth", "true");
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setTimeout(() => setPasswordError(false), 2000);
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem("admin_auth") === "true") setAuthenticated(true);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("admin_auth");
    setAuthenticated(false);
    setPasswordInput("");
  };

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${UPSTASH_URL}/get/players`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
      });
      const data = await response.json();
      if (data.result) {
        const parsed: Player[] = JSON.parse(data.result);
        setPlayers(parsed.map(p => ({
          ...p,
          tiers: p.tiers || {},
          tests: p.tests || 0,
          totalPoints: calculateTotalPoints(p.tiers || {})
        })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated) fetchPlayers();
  }, [authenticated]);

  const savePlayers = async (newPlayers: Player[]) => {
    setSaveStatus("saving");
    try {
      const updated = newPlayers.map(p => ({
        ...p,
        totalPoints: calculateTotalPoints(p.tiers)
      }));

      const byRegion: Record<string, Player[]> = { TR: [], EU: [], NA: [] };
      updated.forEach(p => byRegion[p.region]?.push(p));
      Object.keys(byRegion).forEach(region => {
        byRegion[region].sort((a, b) => b.totalPoints - a.totalPoints);
        byRegion[region].forEach((p, i) => { p.rank = i + 1; });
      });

      const final = [...byRegion.TR, ...byRegion.EU, ...byRegion.NA];

      const response = await fetch(`${UPSTASH_URL}/set/players`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(final)
      });

      if (response.ok) {
        setPlayers(final);
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 2000);
        return true;
      }
      throw new Error("Save failed");
    } catch (e) {
      console.error(e);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
      return false;
    }
  };

  const addPlayer = async (newPlayer: Omit<Player, "id" | "rank" | "totalPoints">) => {
    const player: Player = {
      ...newPlayer,
      id: Date.now().toString(),
      rank: 0,
      totalPoints: calculateTotalPoints(newPlayer.tiers),
      avatar: newPlayer.avatar || `https://mc-heads.net/avatar/${newPlayer.minecraftNick || "Steve"}/128`,
    };
    const ok = await savePlayers([...players, player]);
    if (ok) setShowAddModal(false);
  };

  const updatePlayer = async (updated: Player) => {
    const newList = players.map(p => p.id === updated.id ? updated : p);
    const ok = await savePlayers(newList);
    if (ok) setEditingPlayer(null);
  };

  const deletePlayer = async (id: string) => {
    const newList = players.filter(p => p.id !== id);
    await savePlayers(newList);
    setDeleteConfirm(null);
  };

  const filteredPlayers = useMemo(() => {
    let list = [...players];
    if (filterRegion !== "ALL") list = list.filter(p => p.region === filterRegion);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.username?.toLowerCase().includes(q) ||
        p.minecraftNick?.toLowerCase().includes(q) ||
        p.discordId?.includes(q)
      );
    }
    return list.sort((a, b) => b.totalPoints - a.totalPoints);
  }, [players, searchQuery, filterRegion]);

  const stats = useMemo(() => ({
    total: players.length,
    tr: players.filter(p => p.region === "TR").length,
    eu: players.filter(p => p.region === "EU").length,
    na: players.filter(p => p.region === "NA").length,
    totalTests: players.reduce((sum, p) => sum + (p.tests || 0), 0),
    avgPoints: players.length ? Math.round(players.reduce((s, p) => s + p.totalPoints, 0) / players.length) : 0
  }), [players]);

  // 🔥 KIT İSTATİSTİĞİ
  const getKitStats = (kit: string) => {
    const playersWithKit = players.filter(p => cleanTier(p.tiers?.[kit]));
    const tierBreakdown: Record<string, number> = {};
    TIERS.forEach(t => { tierBreakdown[t] = 0; });
    
    playersWithKit.forEach(p => {
      const tier = cleanTier(p.tiers[kit]);
      if (tier) tierBreakdown[tier]++;
    });

    const topPlayers = [...playersWithKit]
      .sort((a, b) => (TIER_POINTS[cleanTier(b.tiers[kit]) || ""] || 0) - (TIER_POINTS[cleanTier(a.tiers[kit]) || ""] || 0))
      .slice(0, 10);

    return {
      total: playersWithKit.length,
      percentage: players.length ? Math.round((playersWithKit.length / players.length) * 100) : 0,
      tierBreakdown,
      topPlayers,
      avgPoints: playersWithKit.length 
        ? Math.round(playersWithKit.reduce((s, p) => s + (TIER_POINTS[cleanTier(p.tiers[kit]) || ""] || 0), 0) / playersWithKit.length)
        : 0
    };
  };

  // 🔐 LOGIN
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="w-full max-w-md">
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl">
            <div className="text-center mb-8">
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}
                className="text-7xl mb-4">🛡️</motion.div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                ADMIN PANEL
              </h1>
              <p className="text-slate-400 text-sm mt-2 tracking-widest font-bold">ABYSSAL OCEAN</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2 block">
                  Şifre
                </label>
                <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••" autoFocus
                  className={`w-full px-4 py-3 rounded-xl bg-slate-900 border-2 text-white text-center font-mono focus:outline-none transition-all ${
                    passwordError ? "border-red-500 animate-shake" : "border-slate-700 focus:border-cyan-500"
                  }`} />
                {passwordError && <p className="text-red-400 text-xs mt-2 font-bold">❌ Yanlış şifre!</p>}
              </div>
              <button type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold hover:scale-[1.02] transition-all shadow-lg">
                🔓 Giriş Yap
              </button>
            </form>
            <div className="mt-6 pt-6 border-t border-slate-700 text-center">
              <a href="/" className="text-xs text-slate-400 hover:text-cyan-400 transition-colors">
                ← Ana Siteye Dön
              </a>
            </div>
          </div>
        </motion.div>
        <style>{`
          @keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
          .animate-shake { animation: shake 0.4s ease-in-out; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🛡️</div>
            <div>
              <h1 className="font-black text-lg bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                ADMIN PANEL
              </h1>
              <p className="text-[10px] text-slate-500 tracking-widest font-bold">ABYSSAL OCEAN</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {saveStatus !== "idle" && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${
                    saveStatus === "saving" ? "bg-yellow-500/20 text-yellow-400" :
                    saveStatus === "success" ? "bg-green-500/20 text-green-400" :
                    "bg-red-500/20 text-red-400"
                  }`}>
                  {saveStatus === "saving" && <div className="w-3 h-3 rounded-full border-2 border-yellow-400 border-r-transparent animate-spin"></div>}
                  {saveStatus === "saving" && "Kaydediliyor..."}
                  {saveStatus === "success" && "✅ Kaydedildi!"}
                  {saveStatus === "error" && "❌ Hata!"}
                </motion.div>
              )}
            </AnimatePresence>
            <a href="/" className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-all">
              🏠 Ana Site
            </a>
            <button onClick={handleLogout}
              className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold transition-all">
              🚪 Çıkış
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* STATS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          {[
            { label: "Toplam", value: stats.total, color: "from-cyan-500 to-blue-500", emoji: "👥" },
            { label: "TR", value: stats.tr, color: "from-red-500 to-red-600", emoji: "🇹🇷" },
            { label: "EU", value: stats.eu, color: "from-blue-500 to-blue-600", emoji: "🇪🇺" },
            { label: "NA", value: stats.na, color: "from-green-500 to-green-600", emoji: "🇺🇸" },
            { label: "Test", value: stats.totalTests, color: "from-purple-500 to-pink-500", emoji: "🎯" },
            { label: "Ort. Puan", value: stats.avgPoints, color: "from-amber-500 to-orange-500", emoji: "⭐" },
          ].map((s, i) => (
            <motion.div key={i} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.03, y: -3 }}
              className="bg-slate-800/80 backdrop-blur rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-bold uppercase">{s.label}</span>
                <span className="text-xl">{s.emoji}</span>
              </div>
              <div className={`text-2xl font-black bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>
                {s.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* 🔥 KIT İSTATİSTİKLERİ - TIKLA AÇIL */}
        <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-5 border border-slate-700/50 mb-6">
          <h3 className="text-sm font-black mb-4 flex items-center gap-2 text-slate-300 uppercase tracking-wider">
            <span>🎯</span> Kit İstatistikleri 
            <span className="text-xs font-normal text-slate-500 normal-case ml-2">(Tıklayarak detay görüntüle)</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {KITS.map((kit, i) => {
              const count = players.filter(p => cleanTier(p.tiers?.[kit])).length;
              const percentage = players.length ? Math.round((count / players.length) * 100) : 0;
              return (
                <motion.button key={kit}
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStatsModal(kit)}
                  className="bg-slate-900/80 hover:bg-slate-900 rounded-xl p-4 border border-slate-700 hover:border-cyan-500 transition-all text-left group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{KIT_ICONS[kit]}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded bg-gradient-to-r ${KIT_COLORS[kit]} text-white`}>
                      {percentage}%
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white">{count}</div>
                  <div className="text-xs text-slate-400 capitalize font-bold">{kit}</div>
                  <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ delay: 0.3 + i * 0.05, duration: 0.8 }}
                      className={`h-full bg-gradient-to-r ${KIT_COLORS[kit]}`}></motion.div>
                  </div>
                  <div className="mt-2 text-[10px] text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                    📊 Detayları gör →
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* CONTROLS */}
        <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-4 border border-slate-700/50 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <input type="text" placeholder="🔎 Ara: Discord, nick..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-500" />
            <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-500 cursor-pointer">
              <option value="ALL">🌍 Tüm Bölgeler</option>
              <option value="TR">🇹🇷 Türkiye</option>
              <option value="EU">🇪🇺 Avrupa</option>
              <option value="NA">🇺🇸 Amerika</option>
            </select>
            <button onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-sm hover:scale-105 transition-all shadow-lg">
              ➕ Yeni Oyuncu
            </button>
            <button onClick={fetchPlayers}
              className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-bold transition-all">
              🔄 Yenile
            </button>
          </div>
        </div>

        {/* PLAYERS TABLE */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 mx-auto rounded-full border-4 border-cyan-500 border-r-transparent animate-spin"></div>
            <p className="text-slate-400 mt-4 font-bold">Yükleniyor...</p>
          </div>
        ) : (
          <div className="bg-slate-800/80 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/80">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-black text-slate-400 uppercase">#</th>
                    <th className="text-left px-4 py-3 text-xs font-black text-slate-400 uppercase">Oyuncu</th>
                    <th className="text-center px-4 py-3 text-xs font-black text-slate-400 uppercase">Bölge</th>
                    <th className="text-center px-4 py-3 text-xs font-black text-slate-400 uppercase">Puan</th>
                    <th className="text-center px-4 py-3 text-xs font-black text-slate-400 uppercase">Test</th>
                    <th className="text-center px-4 py-3 text-xs font-black text-slate-400 uppercase">Tier</th>
                    <th className="text-right px-4 py-3 text-xs font-black text-slate-400 uppercase">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((player, i) => (
                    <motion.tr key={player.id} 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      transition={{ delay: Math.min(i * 0.02, 0.4) }}
                      className="border-t border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 font-black text-slate-400">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={player.avatar} alt="" className="w-10 h-10 rounded-xl"
                            onError={(e) => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/Steve/40`; }} />
                          <div>
                            <div className="font-bold text-sm">{player.minecraftNick || player.username}</div>
                            <div className="text-xs text-slate-400">@{player.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded text-xs font-black text-white ${
                          player.region === "TR" ? "bg-red-500" :
                          player.region === "EU" ? "bg-blue-500" : "bg-green-500"
                        }`}>{player.region}</span>
                      </td>
                      <td className="px-4 py-3 text-center font-black text-cyan-400">{player.totalPoints}</td>
                      <td className="px-4 py-3 text-center text-slate-300 font-bold">{player.tests}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs font-bold text-slate-400">
                          {Object.values(player.tiers || {}).filter(t => cleanTier(t)).length}/8
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingPlayer(player)}
                            className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs font-bold transition-all">
                            ✏️ Düzenle
                          </button>
                          <button onClick={() => setDeleteConfirm(player.id)}
                            className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold transition-all">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {filteredPlayers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center text-slate-400">
                        <div className="text-5xl mb-3 opacity-30">🤷</div>
                        <p className="font-bold">Oyuncu bulunamadı</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* 🔥 KIT İSTATİSTİK MODALI */}
      <AnimatePresence>
        {statsModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
            onClick={() => setStatsModal(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-slate-800 rounded-3xl max-w-3xl w-full border border-slate-700 shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              
              {/* HEADER */}
              <div className={`p-6 bg-gradient-to-r ${KIT_COLORS[statsModal]} rounded-t-3xl`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-6xl">{KIT_ICONS[statsModal]}</div>
                    <div>
                      <h2 className="text-3xl font-black text-white capitalize">{statsModal}</h2>
                      <p className="text-white/80 text-sm font-bold">Detaylı İstatistik Paneli</p>
                    </div>
                  </div>
                  <button onClick={() => setStatsModal(null)}
                    className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 transition-all flex items-center justify-center text-white text-xl">
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {(() => {
                  const ks = getKitStats(statsModal);
                  return (
                    <>
                      {/* GENEL */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 text-center">
                          <div className="text-xs text-slate-400 uppercase font-bold mb-1">Toplam Oyuncu</div>
                          <div className="text-3xl font-black text-cyan-400">{ks.total}</div>
                        </div>
                        <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 text-center">
                          <div className="text-xs text-slate-400 uppercase font-bold mb-1">Oran</div>
                          <div className="text-3xl font-black text-purple-400">%{ks.percentage}</div>
                        </div>
                        <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 text-center">
                          <div className="text-xs text-slate-400 uppercase font-bold mb-1">Ort. Puan</div>
                          <div className="text-3xl font-black text-amber-400">{ks.avgPoints}</div>
                        </div>
                      </div>

                      {/* TIER DAĞILIMI */}
                      <div>
                        <h3 className="text-sm font-black mb-3 text-slate-300 uppercase tracking-wider">📊 Tier Dağılımı</h3>
                        <div className="grid grid-cols-5 gap-2">
                          {TIERS.map((tier, i) => (
                            <motion.div key={tier} 
                              initial={{ opacity: 0, scale: 0.8 }} 
                              animate={{ opacity: 1, scale: 1 }} 
                              transition={{ delay: i * 0.03 }}
                              className={`p-3 rounded-xl bg-gradient-to-br ${TIER_COLORS[tier]} text-white text-center shadow-lg`}>
                              <div className="text-2xl font-black">{ks.tierBreakdown[tier]}</div>
                              <div className="text-xs font-bold mt-1">{tier}</div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* TOP 10 */}
                      {ks.topPlayers.length > 0 && (
                        <div>
                          <h3 className="text-sm font-black mb-3 text-slate-300 uppercase tracking-wider">🏆 Top 10 Oyuncu</h3>
                          <div className="space-y-2">
                            {ks.topPlayers.map((p, i) => {
                              const tier = cleanTier(p.tiers[statsModal]) || "—";
                              return (
                                <motion.div key={p.id}
                                  initial={{ opacity: 0, x: -20 }} 
                                  animate={{ opacity: 1, x: 0 }} 
                                  transition={{ delay: i * 0.05 }}
                                  className="flex items-center gap-3 bg-slate-900 rounded-xl p-3 border border-slate-700 hover:border-cyan-500 transition-all">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${
                                    i === 0 ? "bg-gradient-to-br from-amber-400 to-yellow-600 text-black" :
                                    i === 1 ? "bg-gradient-to-br from-slate-300 to-slate-500 text-black" :
                                    i === 2 ? "bg-gradient-to-br from-orange-600 to-amber-700 text-white" :
                                    "bg-slate-700 text-slate-400"
                                  }`}>{i + 1}</div>
                                  <img src={p.avatar} alt="" className="w-9 h-9 rounded-lg"
                                    onError={(e) => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/Steve/36`; }} />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm truncate">{p.minecraftNick || p.username}</div>
                                    <div className="text-xs text-slate-400 truncate">@{p.username}</div>
                                  </div>
                                  <span className={`px-2 py-1 rounded-lg text-xs font-black text-white bg-gradient-to-r ${TIER_COLORS[tier as keyof typeof TIER_COLORS] || "from-gray-600 to-gray-700"}`}>
                                    {tier}
                                  </span>
                                  <span className="text-xs font-bold text-cyan-400 min-w-[40px] text-right">
                                    {TIER_POINTS[tier] || 0}p
                                  </span>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDIT/ADD MODAL */}
      <AnimatePresence>
        {editingPlayer && (
          <PlayerModal player={editingPlayer} onClose={() => setEditingPlayer(null)} onSave={updatePlayer} isNew={false} />
        )}
        {showAddModal && (
          <PlayerModal player={null} onClose={() => setShowAddModal(false)} onSave={(p) => addPlayer(p as any)} isNew={true} />
        )}
      </AnimatePresence>

      {/* DELETE CONFIRM */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
              className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full border-2 border-red-500"
              onClick={e => e.stopPropagation()}>
              <div className="text-center">
                <div className="text-6xl mb-3">⚠️</div>
                <h3 className="text-xl font-black mb-2">Emin misin?</h3>
                <p className="text-slate-400 text-sm mb-6">Bu oyuncu kalıcı olarak silinecek!</p>
                <div className="flex gap-2">
                  <button onClick={() => setDeleteConfirm(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 font-bold text-sm">
                    İptal
                  </button>
                  <button onClick={() => deletePlayer(deleteConfirm)}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 font-bold text-sm">
                    🗑️ Sil
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 📝 PLAYER MODAL - TIER OKUMA DÜZELTİLDİ!
function PlayerModal({ player, onClose, onSave, isNew }: {
  player: Player | null; onClose: () => void; onSave: (p: any) => void; isNew: boolean;
}) {
  // 🔥 ÖNEMLİ: Tier'leri okuyup temizleyerek başlat
  const initialTiers: Record<string, string> = {};
  if (player?.tiers) {
    Object.entries(player.tiers).forEach(([kit, tier]) => {
      const cleaned = cleanTier(tier);
      if (cleaned) initialTiers[kit] = cleaned;
    });
  }

  const [form, setForm] = useState({
    username: player?.username || "",
    discordId: player?.discordId || "",
    minecraftNick: player?.minecraftNick || "",
    avatar: player?.avatar || "",
    region: player?.region || "TR" as "TR" | "EU" | "NA",
    tiers: initialTiers,
    tests: player?.tests || 0,
  });

  const handleSave = () => {
    if (!form.username || !form.minecraftNick) {
      alert("Discord username ve Minecraft nick zorunlu!");
      return;
    }
    const avatar = form.avatar || `https://mc-heads.net/avatar/${form.minecraftNick}/128`;
    if (isNew) onSave({ ...form, avatar });
    else onSave({ ...player!, ...form, avatar });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full border border-slate-700 my-8 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black flex items-center gap-2">
            {isNew ? "➕ Yeni Oyuncu" : "✏️ Düzenle"}
          </h2>
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-700 hover:bg-red-500 transition-all flex items-center justify-center">
            ✕
          </button>
        </div>

        {/* PREVIEW */}
        {!isNew && (
          <div className="mb-4 p-3 bg-slate-900 rounded-xl border border-slate-700 flex items-center gap-3">
            <img src={form.avatar || `https://mc-heads.net/avatar/${form.minecraftNick || "Steve"}/64`} alt=""
              className="w-12 h-12 rounded-lg" />
            <div className="flex-1">
              <div className="font-bold">{form.minecraftNick || form.username}</div>
              <div className="text-xs text-slate-400">@{form.username}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Toplam Puan</div>
              <div className="text-xl font-black text-cyan-400">{calculateTotalPoints(form.tiers)}</div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-bold mb-1 block">Discord Username *</label>
              <input type="text" value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-bold mb-1 block">Discord ID</label>
              <input type="text" value={form.discordId}
                onChange={(e) => setForm({ ...form, discordId: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-bold mb-1 block">Minecraft Nick *</label>
              <input type="text" value={form.minecraftNick}
                onChange={(e) => setForm({ ...form, minecraftNick: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-bold mb-1 block">Bölge</label>
              <select value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value as any })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-500 cursor-pointer">
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-bold mb-1 block">Test Sayısı</label>
              <input type="number" value={form.tests}
                onChange={(e) => setForm({ ...form, tests: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-bold mb-1 block">Avatar URL (opsiyonel)</label>
              <input type="text" value={form.avatar} placeholder="Boş = otomatik"
                onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-500" />
            </div>
          </div>

          {/* TIERS */}
          <div>
            <h3 className="text-sm font-black mb-3 text-cyan-400 flex items-center gap-2">🎯 Kit Tierleri</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {KITS.map(kit => {
                const currentTier = form.tiers[kit] || "";
                const tierKey = currentTier as keyof typeof TIER_COLORS;
                return (
                  <div key={kit} className="bg-slate-900 rounded-xl p-3 border border-slate-700">
                    <label className="text-xs font-bold capitalize mb-1.5 flex items-center gap-1.5">
                      <span>{KIT_ICONS[kit]}</span>
                      <span className="text-slate-400">{kit}</span>
                      {currentTier && (
                        <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded font-black text-white bg-gradient-to-r ${TIER_COLORS[tierKey] || "from-gray-600 to-gray-700"}`}>
                          {currentTier}
                        </span>
                      )}
                    </label>
                    <select value={currentTier}
                      onChange={(e) => {
                        const newTiers = { ...form.tiers };
                        if (e.target.value) newTiers[kit] = e.target.value;
                        else delete newTiers[kit];
                        setForm({ ...form, tiers: newTiers });
                      }}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs focus:outline-none focus:border-cyan-500 cursor-pointer">
                      <option value="">— Yok —</option>
                      {TIERS.map(t => <option key={t} value={t}>{t} ({TIER_POINTS[t]}p)</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/30 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Toplam Puan:</span>
              <span className="text-2xl font-black text-cyan-400">{calculateTotalPoints(form.tiers)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6 pt-6 border-t border-slate-700">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 font-bold text-sm">
            İptal
          </button>
          <button onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 font-bold text-sm shadow-lg hover:scale-[1.02] transition-all">
            💾 {isNew ? "Ekle" : "Kaydet"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
