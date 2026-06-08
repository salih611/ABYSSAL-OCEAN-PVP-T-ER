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

// Şifre: Abyssal.admin#2026!@X
const _k = [65,98,121,115,115,97,108,46,97,100,109,105,110,35,50,48,50,54,33,64,88];
const _p = () => _k.map(c => String.fromCharCode(c)).join("");

const KITS = ["vanilla", "sword", "axe", "nethpot", "pot", "uhc", "mace", "smp"];
const KIT_ICONS: Record<string, string> = {
  vanilla: "⚔️", sword: "🗡️", axe: "🪓", nethpot: "💎",
  pot: "🧪", uhc: "🍎", mace: "🔨", smp: "🛡️"
};
const KIT_NAMES: Record<string, string> = {
  vanilla: "Vanilla", sword: "Sword", axe: "Axe", nethpot: "NetherPot",
  pot: "Pot", uhc: "UHC", mace: "Mace", smp: "SMP"
};

const TIERS = ["HT1", "LT1", "HT2", "LT2", "HT3", "LT3", "HT4", "LT4", "HT5", "LT5"];
const REGIONS: Array<"TR" | "EU" | "NA"> = ["TR", "EU", "NA"];

const TIER_POINTS: Record<string, number> = {
  "HT1": 60, "LT1": 44, "HT2": 28, "LT2": 16, "HT3": 10, "LT3": 6,
  "HT4": 4, "LT4": 3, "HT5": 2, "LT5": 1,
};

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

const getTierColor = (tier: string): string => {
  const colors: Record<string, string> = {
    HT1: "from-amber-400 to-orange-500", LT1: "from-emerald-400 to-teal-500",
    HT2: "from-slate-400 to-gray-500", LT2: "from-cyan-400 to-blue-500",
    HT3: "from-orange-400 to-red-500", LT3: "from-indigo-400 to-purple-500",
    HT4: "from-blue-400 to-sky-500", LT4: "from-pink-400 to-rose-500",
    HT5: "from-purple-400 to-fuchsia-500", LT5: "from-gray-500 to-neutral-500",
  };
  return colors[tier] || "from-gray-500 to-gray-600";
};

// Güvenlik
const useSecurity = () => {
  useEffect(() => {
    const disableContext = (e: MouseEvent) => e.preventDefault();
    const disableKeys = (e: KeyboardEvent) => {
      if (e.key === "F12" || e.keyCode === 123) { e.preventDefault(); return; }
      if (e.ctrlKey && e.shiftKey && /^[IJCKijck]$/.test(e.key)) { e.preventDefault(); return; }
      if (e.ctrlKey && /^[USPusp]$/.test(e.key)) { e.preventDefault(); return; }
    };
    let devToolsOpen = false;
    const checkDevTools = () => {
      if (window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160) {
        if (!devToolsOpen) { devToolsOpen = true; sessionStorage.removeItem("ao_a"); window.location.href = "/admin"; }
      } else { devToolsOpen = false; }
    };
    document.addEventListener("contextmenu", disableContext);
    document.addEventListener("keydown", disableKeys);
    const interval = setInterval(checkDevTools, 1000);
    return () => {
      document.removeEventListener("contextmenu", disableContext);
      document.removeEventListener("keydown", disableKeys);
      clearInterval(interval);
    };
  }, []);
};

export default function AdminPanel() {
  useSecurity();

  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("ALL");
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedKit, setSelectedKit] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "players">("dashboard");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === _p()) {
      setAuthed(true);
      sessionStorage.setItem("ao_a", "1");
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setTimeout(() => setPasswordError(false), 1500);
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem("ao_a") === "1") setAuthed(true);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("ao_a");
    setAuthed(false);
    setPassword("");
  };

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${UPSTASH_URL}/get/players`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
      });
      const data = await res.json();
      if (data.result) {
        const parsed: Player[] = JSON.parse(data.result);
        setPlayers(parsed.map(p => ({
          ...p,
          tiers: p.tiers || {},
          tests: p.tests || 0,
          totalPoints: calculateTotalPoints(p.tiers || {})
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed) fetchPlayers();
  }, [authed]);

  const savePlayers = async (newList: Player[]) => {
    setSaveStatus("saving");
    try {
      const updated = newList.map(p => ({ ...p, totalPoints: calculateTotalPoints(p.tiers) }));
      const grouped = { TR: [] as Player[], EU: [] as Player[], NA: [] as Player[] };
      updated.forEach(p => grouped[p.region].push(p));
      Object.keys(grouped).forEach(region => {
        grouped[region].sort((a, b) => b.totalPoints - a.totalPoints);
        grouped[region].forEach((p, i) => { p.rank = i + 1; });
      });
      const final = [...grouped.TR, ...grouped.EU, ...grouped.NA];
      const res = await fetch(`${UPSTASH_URL}/set/players`, {
        method: "POST",
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(final)
      });
      if (res.ok) {
        setPlayers(final);
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 2000);
        return true;
      }
      throw new Error();
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
      return false;
    }
  };

  const addNewPlayer = async (playerData: any) => {
    const newPlayer: Player = {
      ...playerData,
      id: Date.now().toString(),
      rank: 0,
      totalPoints: calculateTotalPoints(playerData.tiers),
      avatar: playerData.avatar || `https://mc-heads.net/avatar/${playerData.minecraftNick || "Steve"}/128`
    };
    if (await savePlayers([...players, newPlayer])) setAddingPlayer(false);
  };

  const updateExistingPlayer = async (playerData: Player) => {
    if (await savePlayers(players.map(p => p.id === playerData.id ? playerData : p))) setEditingPlayer(null);
  };

  const deleteExistingPlayer = async (id: string) => {
    await savePlayers(players.filter(p => p.id !== id));
    setDeletingId(null);
  };

  const filteredPlayers = useMemo(() => {
    let list = [...players];
    if (regionFilter !== "ALL") list = list.filter(p => p.region === regionFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.username?.toLowerCase().includes(q) ||
        p.minecraftNick?.toLowerCase().includes(q) ||
        p.discordId?.includes(q)
      );
    }
    return list.sort((a, b) => b.totalPoints - a.totalPoints);
  }, [players, search, regionFilter]);

  // Gelişmiş istatistikler
  const statistics = useMemo(() => {
    const total = players.length;
    const byRegion = {
      TR: players.filter(p => p.region === "TR").length,
      EU: players.filter(p => p.region === "EU").length,
      NA: players.filter(p => p.region === "NA").length
    };
    const totalTests = players.reduce((sum, p) => sum + (p.tests || 0), 0);
    const totalPoints = players.reduce((sum, p) => sum + p.totalPoints, 0);
    const averagePoints = total ? Math.round(totalPoints / total) : 0;
    const maxPoints = total ? Math.max(...players.map(p => p.totalPoints)) : 0;
    const champion = players.find(p => p.totalPoints === maxPoints);
    const totalTiers = players.reduce((sum, p) => sum + Object.values(p.tiers || {}).filter(t => cleanTier(t)).length, 0);
    const averageTiers = total ? (totalTiers / total).toFixed(1) : "0";
    
    const tierDistribution: Record<string, number> = {};
    TIERS.forEach(t => tierDistribution[t] = 0);
    players.forEach(p => {
      Object.values(p.tiers || {}).forEach(t => {
        const cleaned = cleanTier(t);
        if (cleaned) tierDistribution[cleaned]++;
      });
    });
    
    const regionPoints = { TR: 0, EU: 0, NA: 0 };
    players.forEach(p => regionPoints[p.region] += p.totalPoints);
    
    const kitStats: Record<string, { count: number; points: number; topTier: string }> = {};
    KITS.forEach(kit => {
      const withKit = players.filter(p => cleanTier(p.tiers?.[kit]));
      const points = withKit.reduce((sum, p) => sum + (TIER_POINTS[cleanTier(p.tiers[kit]) || ""] || 0), 0);
      const topPlayer = withKit.sort((a, b) => 
        (TIER_POINTS[cleanTier(b.tiers[kit]) || ""] || 0) - 
        (TIER_POINTS[cleanTier(a.tiers[kit]) || ""] || 0)
      )[0];
      kitStats[kit] = {
        count: withKit.length,
        points: points,
        topTier: topPlayer ? cleanTier(topPlayer.tiers[kit]) || "—" : "—"
      };
    });
    
    const recentTop10 = [...players].sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 10);
    
    return {
      total, byRegion, totalTests, totalPoints, averagePoints, maxPoints, champion,
      totalTiers, averageTiers, tierDistribution, regionPoints, kitStats, recentTop10
    };
  }, [players]);

  const getKitDetails = (kitName: string) => {
    const withKit = players.filter(p => cleanTier(p.tiers?.[kitName]));
    const tierBreakdown: Record<string, number> = {};
    TIERS.forEach(t => tierBreakdown[t] = 0);
    withKit.forEach(p => {
      const tier = cleanTier(p.tiers[kitName]);
      if (tier) tierBreakdown[tier]++;
    });
    const ranked = [...withKit].sort((a, b) => 
      (TIER_POINTS[cleanTier(b.tiers[kitName]) || ""] || 0) - 
      (TIER_POINTS[cleanTier(a.tiers[kitName]) || ""] || 0)
    );
    const averagePoints = withKit.length ? Math.round(ranked.reduce((sum, p) => sum + (TIER_POINTS[cleanTier(p.tiers[kitName]) || ""] || 0), 0) / withKit.length) : 0;
    return { total: withKit.length, participation: players.length ? Math.round((withKit.length / players.length) * 100) : 0, tierBreakdown, top10: ranked.slice(0, 10), averagePoints, bestTier: ranked[0] ? cleanTier(ranked[0].tiers[kitName]) || "—" : "—" };
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-950 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring" }}
                className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-5xl shadow-lg shadow-purple-500/30"
              >
                🌊
              </motion.div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">Abyssal Ocean</h1>
              <p className="text-sm text-gray-400 mt-2">Admin Panel</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Admin Şifresi"
                autoFocus
                className={`w-full px-4 py-3 rounded-xl bg-black/50 border ${passwordError ? 'border-red-500' : 'border-white/20'} text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all`}
              />
              {passwordError && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm text-center">
                  ⚠️ Yanlış şifre
                </motion.p>
              )}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold transition-all shadow-lg shadow-purple-500/30"
              >
                Giriş Yap
              </button>
            </form>
            <a href="/" className="block text-center text-xs text-gray-500 hover:text-white mt-6 transition-colors">
              ← Ana Sayfa
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950/30 to-gray-950">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-purple-500/30">
              🌊
            </div>
            <div>
              <h1 className="text-xl font-bold">Abyssal Ocean</h1>
              <p className="text-[10px] text-gray-400">Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AnimatePresence>
              {saveStatus !== "idle" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`text-xs font-medium px-4 py-1.5 rounded-full ${
                    saveStatus === "saving" ? "bg-yellow-500/20 text-yellow-300" :
                    saveStatus === "success" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {saveStatus === "saving" ? "💾 Kaydediliyor..." : saveStatus === "success" ? "✓ Kaydedildi" : "⚠️ Hata"}
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={handleLogout}
              className="text-sm text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 bg-white/5 rounded-2xl p-1 w-fit border border-white/10">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "dashboard"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setActiveTab("players")}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "players"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            👥 Oyuncular
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Hero Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Toplam Oyuncu" value={statistics.total} icon="👥" sub={`TR ${statistics.byRegion.TR} · EU ${statistics.byRegion.EU} · NA ${statistics.byRegion.NA}`} gradient="from-blue-500 to-cyan-500" />
                <StatCard label="Toplam Test" value={statistics.totalTests} icon="🎯" sub={`Ort. ${(statistics.totalTests / statistics.total || 0).toFixed(1)}`} gradient="from-emerald-500 to-teal-500" />
                <StatCard label="Toplam Puan" value={statistics.totalPoints} icon="⭐" sub={`Ort. ${statistics.averagePoints}`} gradient="from-amber-500 to-orange-500" />
                <StatCard label="Kit Tamamlama" value={`${statistics.averageTiers}/8`} icon="🎒" sub={`Toplam ${statistics.totalTiers} tier`} gradient="from-purple-500 to-pink-500" />
              </div>

              {/* Champion Banner */}
              {statistics.champion && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent border border-white/10 p-5"
                >
                  <div className="absolute top-0 right-0 text-8xl opacity-10">👑</div>
                  <div className="flex items-center gap-5 flex-wrap">
                    <img src={statistics.champion.avatar} className="w-16 h-16 rounded-xl border-2 border-amber-500 shadow-lg" onError={(e) => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/Steve/64"; }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🏆</span>
                        <h3 className="text-lg font-bold">Lider Oyuncu</h3>
                      </div>
                      <p className="text-xl font-semibold">{statistics.champion.minecraftNick || statistics.champion.username}</p>
                      <p className="text-sm text-gray-400">@{statistics.champion.username} · {statistics.champion.region}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-amber-400">{statistics.champion.totalPoints}</div>
                      <p className="text-xs text-gray-500">Toplam Puan</p>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tier Distribution */}
                <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-5">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
                    Tier Dağılımı
                  </h3>
                  <div className="space-y-3">
                    {TIERS.map(tier => {
                      const count = statistics.tierDistribution[tier];
                      const maxCount = Math.max(...Object.values(statistics.tierDistribution), 1);
                      const percentage = (count / maxCount) * 100;
                      return (
                        <div key={tier}>
                          <div className="flex justify-between text-xs mb-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-white text-[10px] font-bold bg-gradient-to-r ${getTierColor(tier)}`}>{tier}</span>
                              <span className="text-gray-400">{count}</span>
                            </div>
                            <span className="text-gray-500">{Math.round(percentage)}%</span>
                          </div>
                          <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.5 }}
                              className={`h-full rounded-full bg-gradient-to-r ${getTierColor(tier)}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Region & Kit Summary */}
                <div className="space-y-6">
                  <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-5">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                      <div className="w-1 h-4 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></div>
                      Bölge Karşılaştırması
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(statistics.regionPoints).map(([region, points]) => (
                        <div key={region} className="text-center p-3 rounded-xl bg-black/30">
                          <div className="text-3xl mb-1">{region === "TR" ? "🇹🇷" : region === "EU" ? "🇪🇺" : "🇺🇸"}</div>
                          <div className="text-xl font-bold text-indigo-400">{points}</div>
                          <div className="text-[10px] text-gray-500">Toplam Puan</div>
                          <div className="text-xs text-gray-400 mt-1">{statistics.byRegion[region as keyof typeof statistics.byRegion]} oyuncu</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-5">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                      <div className="w-1 h-4 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full"></div>
                      Kit Özeti
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {KITS.map(kit => {
                        const stats = statistics.kitStats[kit];
                        const percentage = statistics.total ? (stats.count / statistics.total) * 100 : 0;
                        return (
                          <button
                            key={kit}
                            onClick={() => setSelectedKit(kit)}
                            className="flex items-center gap-2 p-2 rounded-xl bg-black/30 hover:bg-black/50 transition-all text-left"
                          >
                            <span className="text-xl">{KIT_ICONS[kit]}</span>
                            <div className="flex-1">
                              <div className="flex justify-between text-xs">
                                <span className="capitalize text-gray-300">{KIT_NAMES[kit]}</span>
                                <span className="text-gray-500">{stats.count}</span>
                              </div>
                              <div className="h-1.5 bg-black/40 rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${percentage}%` }}></div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Kit Grid */}
              <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-5">
                <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full"></div>
                  Kit Detayları
                </h3>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                  {KITS.map(kit => {
                    const stats = statistics.kitStats[kit];
                    const percentage = statistics.total ? (stats.count / statistics.total) * 100 : 0;
                    return (
                      <button
                        key={kit}
                        onClick={() => setSelectedKit(kit)}
                        className="group relative overflow-hidden rounded-xl bg-black/30 border border-white/10 p-3 hover:border-purple-500/50 transition-all text-center"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all" />
                        <div className="text-2xl mb-1">{KIT_ICONS[kit]}</div>
                        <div className="text-xs font-semibold capitalize text-gray-300">{KIT_NAMES[kit]}</div>
                        <div className="text-[10px] text-gray-500 mt-1">{stats.count}</div>
                        <div className="mt-2 h-1 bg-black/40 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: `${percentage}%` }}></div>
                        </div>
                        <div className="text-[9px] text-purple-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Detay →</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Top 10 Leaderboard */}
              <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-5">
                <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></div>
                  İlk 10 Oyuncu
                </h3>
                <div className="space-y-2">
                  {statistics.recentTop10.map((player, idx) => (
                    <div key={player.id} className="flex items-center gap-3 p-2 rounded-xl bg-black/30 hover:bg-black/50 transition-all">
                      <div className="w-8 text-center">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : <span className="text-sm text-gray-500">{idx + 1}</span>}
                      </div>
                      <img src={player.avatar} className="w-8 h-8 rounded-lg" onError={(e) => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/Steve/32"; }} />
                      <div className="flex-1">
                        <div className="text-sm font-semibold">{player.minecraftNick || player.username}</div>
                        <div className="text-[10px] text-gray-500">{player.region}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-indigo-400">{player.totalPoints}</div>
                        <div className="text-[10px] text-gray-500">{player.tests} test</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Players Tab */}
          {activeTab === "players" && (
            <motion.div
              key="players"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Controls */}
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="relative flex-1 min-w-[200px]">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Ara..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500 transition-all placeholder-gray-500"
                  />
                </div>
                <select
                  value={regionFilter}
                  onChange={e => setRegionFilter(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="ALL">🌍 Tüm Bölgeler</option>
                  <option value="TR">🇹🇷 TR</option>
                  <option value="EU">🇪🇺 EU</option>
                  <option value="NA">🇺🇸 NA</option>
                </select>
                <button
                  onClick={() => setAddingPlayer(true)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-sm font-semibold transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
                >
                  + Yeni Oyuncu
                </button>
                <button
                  onClick={fetchPlayers}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              <div className="text-xs text-gray-500 mb-3">📋 {filteredPlayers.length} oyuncu</div>

              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
                </div>
              ) : (
                <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-white/10 bg-black/30">
                        <tr className="text-left text-[11px] font-semibold text-gray-400 uppercase">
                          <th className="px-5 py-4 w-12">#</th>
                          <th className="px-5 py-4">Oyuncu</th>
                          <th className="px-5 py-4 text-center w-16">Bölge</th>
                          <th className="px-5 py-4 text-center w-20">Puan</th>
                          <th className="px-5 py-4 text-center w-16">Test</th>
                          <th className="px-5 py-4 text-center w-16">Kit</th>
                          <th className="px-5 py-4 text-right w-24">İşlem</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPlayers.map((player, idx) => (
                          <motion.tr
                            key={player.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: Math.min(idx * 0.01, 0.3) }}
                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                          >
                            <td className="px-5 py-3 text-sm text-gray-500 font-mono">{idx + 1}</td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <img src={player.avatar} className="w-9 h-9 rounded-xl object-cover border border-white/10" onError={(e) => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/Steve/36"; }} />
                                <div>
                                  <div className="text-sm font-semibold">{player.minecraftNick || player.username}</div>
                                  <div className="text-[10px] text-gray-500">@{player.username}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${
                                player.region === "TR" ? "bg-red-500/20 text-red-300" :
                                player.region === "EU" ? "bg-blue-500/20 text-blue-300" : "bg-green-500/20 text-green-300"
                              }`}>{player.region}</span>
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span className="text-base font-bold text-indigo-400">{player.totalPoints}</span>
                            </td>
                            <td className="px-5 py-3 text-center text-sm text-gray-400">{player.tests}</td>
                            <td className="px-5 py-3 text-center text-xs text-gray-400">
                              {Object.values(player.tiers || {}).filter(t => cleanTier(t)).length}/8
                            </td>
                            <td className="px-5 py-3 text-right">
                              <div className="flex justify-end gap-1">
                                <button onClick={() => setEditingPlayer(player)} className="p-1.5 rounded-lg hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 transition-all">✏️</button>
                                <button onClick={() => setDeletingId(player.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all">🗑️</button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                        {filteredPlayers.length === 0 && (
                          <tr>
                            <td colSpan={7} className="py-20 text-center text-gray-500">Oyuncu bulunamadı</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Kit Detail Modal */}
      <AnimatePresence>
        {selectedKit && (
          <KitDetailModal kit={selectedKit} onClose={() => setSelectedKit(null)} getKitDetails={getKitDetails} />
        )}
      </AnimatePresence>

      {/* Player Modal */}
      <AnimatePresence>
        {editingPlayer && <PlayerFormModal player={editingPlayer} onClose={() => setEditingPlayer(null)} onSave={updateExistingPlayer} isNew={false} />}
        {addingPlayer && <PlayerFormModal player={null} onClose={() => setAddingPlayer(false)} onSave={addNewPlayer} isNew={true} />}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deletingId && (
          <DeleteConfirmModal onConfirm={() => deleteExistingPlayer(deletingId)} onCancel={() => setDeletingId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, icon, sub, gradient }: { label: string; value: number; icon: string; sub: string; gradient: string }) {
  return (
    <motion.div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 hover:border-white/20 transition-all group">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          <p className="text-[10px] text-gray-500 mt-1">{sub}</p>
        </div>
        <div className="text-2xl opacity-50">{icon}</div>
      </div>
    </motion.div>
  );
}

// Kit Detail Modal
function KitDetailModal({ kit, onClose, getKitDetails }: { kit: string; onClose: () => void; getKitDetails: (kit: string) => any }) {
  const details = getKitDetails(kit);
  const TIERS = ["HT1", "LT1", "HT2", "LT2", "HT3", "LT3", "HT4", "LT4", "HT5", "LT5"];
  
  const getTierColor = (tier: string): string => {
    const colors: Record<string, string> = {
      HT1: "from-amber-400 to-orange-500", LT1: "from-emerald-400 to-teal-500",
      HT2: "from-slate-400 to-gray-500", LT2: "from-cyan-400 to-blue-500",
      HT3: "from-orange-400 to-red-500", LT3: "from-indigo-400 to-purple-500",
      HT4: "from-blue-400 to-sky-500", LT4: "from-pink-400 to-rose-500",
      HT5: "from-purple-400 to-fuchsia-500", LT5: "from-gray-500 to-neutral-500",
    };
    return colors[tier] || "from-gray-500 to-gray-600";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        className="bg-gray-900 rounded-2xl max-w-2xl w-full border border-white/20 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gray-900/90 backdrop-blur-md border-b border-white/10 p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{KIT_ICONS[kit]}</span>
            <h2 className="text-xl font-bold capitalize">{KIT_NAMES[kit]}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-all">✕</button>
        </div>
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-black/30 rounded-xl p-3 text-center">
              <div className="text-[10px] text-gray-400">Oyuncu</div>
              <div className="text-xl font-bold text-indigo-400">{details.total}</div>
            </div>
            <div className="bg-black/30 rounded-xl p-3 text-center">
              <div className="text-[10px] text-gray-400">Katılım</div>
              <div className="text-xl font-bold text-indigo-400">%{details.participation}</div>
            </div>
            <div className="bg-black/30 rounded-xl p-3 text-center">
              <div className="text-[10px] text-gray-400">Ort. Puan</div>
              <div className="text-xl font-bold text-indigo-400">{details.averagePoints}</div>
            </div>
            <div className="bg-black/30 rounded-xl p-3 text-center">
              <div className="text-[10px] text-gray-400">En İyi</div>
              <div className="text-xl font-bold text-indigo-400">{details.bestTier}</div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-400 mb-3">Tier Dağılımı</h4>
            <div className="space-y-2">
              {TIERS.map(tier => {
                const count = details.tierBreakdown[tier];
                const max = Math.max(...Object.values(details.tierBreakdown), 1);
                return (
                  <div key={tier} className="flex items-center gap-3">
                    <span className={`w-12 text-center text-[10px] font-bold py-0.5 rounded bg-gradient-to-r ${getTierColor(tier)}`}>{tier}</span>
                    <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full bg-gradient-to-r ${getTierColor(tier)}`} style={{ width: `${(count / max) * 100}%` }}></div>
                    </div>
                    <span className="text-xs text-gray-400 w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {details.top10.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 mb-3">İlk 10 Oyuncu</h4>
              <div className="space-y-2">
                {details.top10.map((player: Player, idx: number) => {
                  const tier = cleanTier(player.tiers[kit]) || "—";
                  return (
                    <div key={player.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                      <span className="text-sm text-gray-500 w-6">{idx + 1}</span>
                      <img src={player.avatar} className="w-8 h-8 rounded-lg" onError={(e) => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/Steve/32"; }} />
                      <div className="flex-1 text-sm font-semibold">{player.minecraftNick || player.username}</div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${getTierColor(tier)}`}>{tier}</span>
                      <span className="text-xs text-indigo-400">{TIER_POINTS[tier] || 0}p</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Player Form Modal
function PlayerFormModal({ player, onClose, onSave, isNew }: { player: Player | null; onClose: () => void; onSave: (p: any) => void; isNew: boolean }) {
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

  const totalPoints = useMemo(() => calculateTotalPoints(form.tiers), [form.tiers]);

  const handleSave = () => {
    if (!form.username || !form.minecraftNick) {
      alert("Discord kullanıcı adı ve Minecraft Nick zorunludur!");
      return;
    }
    const avatar = form.avatar || `https://mc-heads.net/avatar/${form.minecraftNick}/128`;
    if (isNew) onSave({ ...form, avatar });
    else onSave({ ...player!, ...form, avatar });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        className="bg-gray-900 rounded-2xl max-w-2xl w-full border border-white/20 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gray-900/90 backdrop-blur-md border-b border-white/10 p-5 flex justify-between items-center">
          <h2 className="text-xl font-bold">{isNew ? "Yeni Oyuncu" : "Oyuncu Düzenle"}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-all">✕</button>
        </div>

        <div className="p-5 space-y-5">
          {!isNew && (
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl">
              <img src={form.avatar || `https://mc-heads.net/avatar/${form.minecraftNick || "Steve"}/64`} className="w-14 h-14 rounded-xl border border-indigo-500/30" />
              <div className="flex-1">
                <div className="text-lg font-bold">{form.minecraftNick || form.username}</div>
                <div className="text-sm text-gray-400">@{form.username}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-indigo-400">{totalPoints}</div>
                <div className="text-xs text-gray-500">puan</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Discord Adı *</label>
              <input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Discord ID</label>
              <input type="text" value={form.discordId} onChange={e => setForm({ ...form, discordId: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Minecraft Nick *</label>
              <input type="text" value={form.minecraftNick} onChange={e => setForm({ ...form, minecraftNick: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Test Sayısı</label>
              <input type="number" value={form.tests} onChange={e => setForm({ ...form, tests: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Bölge</label>
              <select value={form.region} onChange={e => setForm({ ...form, region: e.target.value as any })} className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 focus:outline-none">
                {REGIONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Avatar URL</label>
              <input type="text" value={form.avatar} onChange={e => setForm({ ...form, avatar: e.target.value })} placeholder="Opsiyonel" className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-3">Kit Tierleri</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {KITS.map(kit => {
                const current = form.tiers[kit] || "";
                return (
                  <div key={kit} className="bg-black/30 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{KIT_ICONS[kit]}</span>
                      <span className="text-xs capitalize text-gray-300">{KIT_NAMES[kit]}</span>
                    </div>
                    <select value={current} onChange={e => {
                      const t = { ...form.tiers };
                      if (e.target.value) t[kit] = e.target.value; else delete t[kit];
                      setForm({ ...form, tiers: t });
                    }} className="w-full px-2 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs focus:outline-none focus:border-purple-500">
                      <option value="">—</option>
                      {TIERS.map(t => <option key={t}>{t} ({TIER_POINTS[t]})</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-900/90 backdrop-blur-md border-t border-white/10 p-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 font-semibold">İptal</button>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 font-semibold">{isNew ? "Ekle" : "Kaydet"}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Delete Confirm Modal
function DeleteConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-red-500/30 text-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-5xl mb-3">⚠️</div>
        <h3 className="text-lg font-bold mb-1">Emin misin?</h3>
        <p className="text-sm text-gray-400 mb-6">Bu işlem geri alınamaz.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 font-semibold">İptal</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 font-semibold">Sil</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
