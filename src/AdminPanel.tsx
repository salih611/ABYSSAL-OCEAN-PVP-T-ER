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

// 🔐 ADMIN ŞİFRESİ - BURAYI DEĞİŞTİR!
const ADMIN_PASSWORD = "abyssal2025admin";

const KITS = ["vanilla", "sword", "axe", "nethpot", "pot", "uhc", "mace", "smp"];
const TIERS = ["HT1", "LT1", "HT2", "LT2", "HT3", "LT3", "HT4", "LT4", "HT5", "LT5"];
const REGIONS: Array<"TR" | "EU" | "NA"> = ["TR", "EU", "NA"];

const TIER_POINTS: Record<string, number> = {
  "HT1": 60, "LT1": 44, "HT2": 28, "LT2": 16, "HT3": 10, "LT3": 6,
  "HT4": 4, "LT4": 3, "HT5": 2, "LT5": 1,
};

const calculateTotalPoints = (tiers: Record<string, string>): number => {
  if (!tiers) return 0;
  let total = 0;
  for (const tier of Object.values(tiers)) {
    total += TIER_POINTS[tier] || 0;
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

  // 🔐 LOGIN
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
    if (sessionStorage.getItem("admin_auth") === "true") {
      setAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("admin_auth");
    setAuthenticated(false);
    setPasswordInput("");
  };

  // 📥 FETCH PLAYERS
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

  // 💾 SAVE TO UPSTASH
  const savePlayers = async (newPlayers: Player[]) => {
    setSaveStatus("saving");
    try {
      // Recalculate points & ranks
      const updated = newPlayers.map(p => ({
        ...p,
        totalPoints: calculateTotalPoints(p.tiers)
      }));

      // Rank by region
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

  // ➕ ADD PLAYER
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

  // ✏️ UPDATE PLAYER
  const updatePlayer = async (updated: Player) => {
    const newList = players.map(p => p.id === updated.id ? updated : p);
    const ok = await savePlayers(newList);
    if (ok) setEditingPlayer(null);
  };

  // 🗑️ DELETE PLAYER
  const deletePlayer = async (id: string) => {
    const newList = players.filter(p => p.id !== id);
    await savePlayers(newList);
    setDeleteConfirm(null);
  };

  // 🔎 FILTERED
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

  // 📊 STATS
  const stats = useMemo(() => ({
    total: players.length,
    tr: players.filter(p => p.region === "TR").length,
    eu: players.filter(p => p.region === "EU").length,
    na: players.filter(p => p.region === "NA").length,
    totalTests: players.reduce((sum, p) => sum + (p.tests || 0), 0),
    avgPoints: players.length ? Math.round(players.reduce((s, p) => s + p.totalPoints, 0) / players.length) : 0
  }), [players]);

  // 🔐 LOGIN SCREEN
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-700 shadow-2xl">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🔐</div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              ADMIN PANEL
            </h1>
            <p className="text-slate-400 text-sm mt-2">Abyssal Ocean Tier List</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2 block">
                Yönetici Şifresi
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••••"
                autoFocus
                className={`w-full px-4 py-3 rounded-xl bg-slate-900 border-2 text-white focus:outline-none transition-all ${
                  passwordError ? "border-red-500 animate-shake" : "border-slate-700 focus:border-cyan-500"
                }`}
              />
              {passwordError && (
                <p className="text-red-400 text-xs mt-2 font-bold">❌ Yanlış şifre!</p>
              )}
            </div>
            <button type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold hover:scale-105 transition-all shadow-lg">
              🔓 Giriş Yap
            </button>
          </form>
          <div className="mt-6 pt-6 border-t border-slate-700 text-center">
            <a href="/" className="text-xs text-slate-400 hover:text-cyan-400 transition-colors">
              ← Ana Siteye Dön
            </a>
          </div>
        </motion.div>
        <style>{`
          @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }
          .animate-shake { animation: shake 0.3s ease-in-out; }
        `}</style>
      </div>
    );
  }

  // 🎛️ ADMIN PANEL UI
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-slate-800/90 backdrop-blur-xl border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🛡️</div>
            <div>
              <h1 className="font-black text-lg bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                ADMIN PANEL
              </h1>
              <p className="text-[10px] text-slate-400 tracking-widest">ABYSSAL OCEAN</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saveStatus === "saving" && (
              <span className="text-xs text-yellow-400 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2 border-yellow-400 border-r-transparent animate-spin"></div>
                Kaydediliyor...
              </span>
            )}
            {saveStatus === "success" && <span className="text-xs text-green-400">✅ Kaydedildi!</span>}
            {saveStatus === "error" && <span className="text-xs text-red-400">❌ Hata!</span>}
            <a href="/" className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-bold transition-all">
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
        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          {[
            { label: "Toplam Oyuncu", value: stats.total, color: "from-cyan-500 to-blue-500", emoji: "👥" },
            { label: "Türkiye", value: stats.tr, color: "from-red-500 to-red-600", emoji: "🇹🇷" },
            { label: "Avrupa", value: stats.eu, color: "from-blue-500 to-blue-600", emoji: "🇪🇺" },
            { label: "Amerika", value: stats.na, color: "from-green-500 to-green-600", emoji: "🇺🇸" },
            { label: "Toplam Test", value: stats.totalTests, color: "from-purple-500 to-pink-500", emoji: "🎯" },
            { label: "Ort. Puan", value: stats.avgPoints, color: "from-amber-500 to-orange-500", emoji: "⭐" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-bold">{s.label}</span>
                <span className="text-xl">{s.emoji}</span>
              </div>
              <div className={`text-2xl font-black bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>
                {s.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* CONTROLS */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <input type="text" placeholder="🔎 Ara: Discord, nick..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-500" />
            <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}
              className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-500">
              <option value="ALL">🌍 Tüm Bölgeler</option>
              <option value="TR">🇹🇷 Türkiye</option>
              <option value="EU">🇪🇺 Avrupa</option>
              <option value="NA">🇺🇸 Amerika</option>
            </select>
            <button onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-sm hover:scale-105 transition-all shadow-lg">
              ➕ Yeni Oyuncu
            </button>
            <button onClick={fetchPlayers}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-bold transition-all">
              🔄 Yenile
            </button>
          </div>
        </div>

        {/* PLAYERS TABLE */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 mx-auto rounded-full border-4 border-cyan-500 border-r-transparent animate-spin"></div>
            <p className="text-slate-400 mt-4">Yükleniyor...</p>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase">#</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase">Oyuncu</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase">Bölge</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase">Puan</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase">Test</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase">Tierler</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((player, i) => (
                    <tr key={player.id} className="border-t border-slate-700 hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-400">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={player.avatar} alt="" className="w-10 h-10 rounded-lg"
                            onError={(e) => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/Steve/40`; }} />
                          <div>
                            <div className="font-bold text-sm">{player.minecraftNick || player.username}</div>
                            <div className="text-xs text-slate-400">@{player.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-black text-white ${
                          player.region === "TR" ? "bg-red-500" :
                          player.region === "EU" ? "bg-blue-500" : "bg-green-500"
                        }`}>{player.region}</span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-cyan-400">{player.totalPoints}</td>
                      <td className="px-4 py-3 text-center text-slate-300">{player.tests}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs text-slate-400">{Object.keys(player.tiers || {}).length}/8</span>
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
                    </tr>
                  ))}
                  {filteredPlayers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        🤷 Oyuncu bulunamadı
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {editingPlayer && (
          <PlayerModal
            player={editingPlayer}
            onClose={() => setEditingPlayer(null)}
            onSave={updatePlayer}
            isNew={false}
          />
        )}
        {showAddModal && (
          <PlayerModal
            player={null}
            onClose={() => setShowAddModal(false)}
            onSave={(p) => addPlayer(p as any)}
            isNew={true}
          />
        )}
      </AnimatePresence>

      {/* DELETE CONFIRM */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-red-500"
              onClick={e => e.stopPropagation()}>
              <div className="text-center">
                <div className="text-5xl mb-3">⚠️</div>
                <h3 className="text-xl font-black mb-2">Emin misin?</h3>
                <p className="text-slate-400 text-sm mb-6">Bu oyuncu kalıcı olarak silinecek!</p>
                <div className="flex gap-2">
                  <button onClick={() => setDeleteConfirm(null)}
                    className="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 font-bold text-sm">
                    İptal
                  </button>
                  <button onClick={() => deletePlayer(deleteConfirm)}
                    className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 font-bold text-sm">
                    🗑️ Sil
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 📝 PLAYER MODAL (EDIT/ADD)
function PlayerModal({ player, onClose, onSave, isNew }: {
  player: Player | null;
  onClose: () => void;
  onSave: (p: any) => void;
  isNew: boolean;
}) {
  const [form, setForm] = useState({
    username: player?.username || "",
    discordId: player?.discordId || "",
    minecraftNick: player?.minecraftNick || "",
    avatar: player?.avatar || "",
    region: player?.region || "TR" as "TR" | "EU" | "NA",
    tiers: { ...(player?.tiers || {}) } as Record<string, string>,
    tests: player?.tests || 0,
  });

  const handleSave = () => {
    if (!form.username || !form.minecraftNick) {
      alert("Discord username ve Minecraft nick zorunlu!");
      return;
    }
    const avatar = form.avatar || `https://mc-heads.net/avatar/${form.minecraftNick}/128`;
    if (isNew) {
      onSave({ ...form, avatar });
    } else {
      onSave({ ...player!, ...form, avatar });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full border border-slate-700 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black">{isNew ? "➕ Yeni Oyuncu" : "✏️ Düzenle"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="space-y-4">
          {/* BASIC INFO */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-bold mb-1 block">Discord Username</label>
              <input type="text" value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-bold mb-1 block">Discord ID</label>
              <input type="text" value={form.discordId}
                onChange={(e) => setForm({ ...form, discordId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-bold mb-1 block">Minecraft Nick</label>
              <input type="text" value={form.minecraftNick}
                onChange={(e) => setForm({ ...form, minecraftNick: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-bold mb-1 block">Bölge</label>
              <select value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-500">
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-bold mb-1 block">Test Sayısı</label>
              <input type="number" value={form.tests}
                onChange={(e) => setForm({ ...form, tests: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-bold mb-1 block">Avatar URL (opsiyonel)</label>
              <input type="text" value={form.avatar} placeholder="Boş = otomatik"
                onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-500" />
            </div>
          </div>

          {/* TIERS */}
          <div>
            <h3 className="text-sm font-bold mb-3 text-cyan-400">🎯 Kit Tierleri</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {KITS.map(kit => (
                <div key={kit} className="bg-slate-900 rounded-lg p-2 border border-slate-700">
                  <label className="text-xs text-slate-400 font-bold capitalize mb-1 block">{kit}</label>
                  <select value={form.tiers[kit] || ""}
                    onChange={(e) => {
                      const newTiers = { ...form.tiers };
                      if (e.target.value) newTiers[kit] = e.target.value;
                      else delete newTiers[kit];
                      setForm({ ...form, tiers: newTiers });
                    }}
                    className="w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs focus:outline-none focus:border-cyan-500">
                    <option value="">— Yok —</option>
                    {TIERS.map(t => (
                      <option key={t} value={t}>{t} ({TIER_POINTS[t]}p)</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-slate-400">
              Toplam Puan: <span className="text-cyan-400 font-black">{calculateTotalPoints(form.tiers)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6 pt-6 border-t border-slate-700">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 font-bold text-sm">
            İptal
          </button>
          <button onClick={handleSave}
            className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 font-bold text-sm hover:scale-105 transition-all shadow-lg">
            💾 {isNew ? "Ekle" : "Kaydet"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
