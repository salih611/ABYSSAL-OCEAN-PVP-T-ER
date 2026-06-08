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
const KIT_COLORS: Record<string, { from: string; to: string; glow: string }> = {
  vanilla: { from: "#fbbf24", to: "#d97706", glow: "rgba(251,191,36,0.4)" },
  sword: { from: "#60a5fa", to: "#2563eb", glow: "rgba(96,165,250,0.4)" },
  axe: { from: "#a78bfa", to: "#7c3aed", glow: "rgba(167,139,250,0.4)" },
  nethpot: { from: "#f472b6", to: "#db2777", glow: "rgba(244,114,182,0.4)" },
  pot: { from: "#fb7185", to: "#e11d48", glow: "rgba(251,113,133,0.4)" },
  uhc: { from: "#f87171", to: "#dc2626", glow: "rgba(248,113,113,0.4)" },
  mace: { from: "#facc15", to: "#ca8a04", glow: "rgba(250,204,21,0.4)" },
  smp: { from: "#4ade80", to: "#16a34a", glow: "rgba(74,222,128,0.4)" },
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

// 🛡️ GİZLİ GÜVENLİK (siteye yazı yazmaz)
const useStealthSecurity = () => {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => { e.preventDefault(); return false; };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F12" || e.keyCode === 123) { e.preventDefault(); return false; }
      if (e.ctrlKey && e.shiftKey && ["I","i","J","j","C","c","K","k"].includes(e.key)) {
        e.preventDefault(); return false;
      }
      if (e.ctrlKey && ["U","u","S","s","P","p"].includes(e.key)) { e.preventDefault(); return false; }
    };

    let devtoolsOpen = false;
    const threshold = 160;
    const detectDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      if (widthThreshold || heightThreshold) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          sessionStorage.removeItem("admin_auth");
          window.location.href = "/admin";
        }
      } else { devtoolsOpen = false; }
    };

    const handleDragStart = (e: DragEvent) => {
      if ((e.target as HTMLElement).tagName === "IMG") e.preventDefault();
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("dragstart", handleDragStart);
    const detectInterval = setInterval(detectDevTools, 1000);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("dragstart", handleDragStart);
      clearInterval(detectInterval);
    };
  }, []);
};

export default function AdminPanel() {
  useStealthSecurity();

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
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { if (authenticated) fetchPlayers(); }, [authenticated]);

  const savePlayers = async (newPlayers: Player[]) => {
    setSaveStatus("saving");
    try {
      const updated = newPlayers.map(p => ({ ...p, totalPoints: calculateTotalPoints(p.tiers) }));
      const byRegion: Record<string, Player[]> = { TR: [], EU: [], NA: [] };
      updated.forEach(p => byRegion[p.region]?.push(p));
      Object.keys(byRegion).forEach(region => {
        byRegion[region].sort((a, b) => b.totalPoints - a.totalPoints);
        byRegion[region].forEach((p, i) => { p.rank = i + 1; });
      });
      const final = [...byRegion.TR, ...byRegion.EU, ...byRegion.NA];
      const response = await fetch(`${UPSTASH_URL}/set/players`, {
        method: "POST",
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, "Content-Type": "application/json" },
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
      ...newPlayer, id: Date.now().toString(), rank: 0,
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
      tierBreakdown, topPlayers,
      avgPoints: playersWithKit.length 
        ? Math.round(playersWithKit.reduce((s, p) => s + (TIER_POINTS[cleanTier(p.tiers[kit]) || ""] || 0), 0) / playersWithKit.length)
        : 0
    };
  };

  // 🔐 LOGIN SCREEN
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" 
        style={{ background: "radial-gradient(ellipse at top, #1e1b4b 0%, #0f172a 50%, #020617 100%)" }}>
        
        {/* Grid background */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `linear-gradient(rgba(59,130,246,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-cyan-500/20 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/20 blur-[120px] animate-pulse" style={{ animationDelay: "1s" }}></div>

        <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className="relative w-full max-w-md mx-4">
          
          {/* Gradient border */}
          <div className="absolute -inset-0.5 rounded-3xl opacity-75 blur-sm" style={{
            background: "linear-gradient(135deg, #06b6d4, #8b5cf6, #ec4899)"
          }}></div>

          <div className="relative bg-slate-950/90 backdrop-blur-2xl rounded-3xl p-10 shadow-2xl border border-white/5">
            <div className="text-center mb-8">
              <motion.div 
                animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }} 
                transition={{ duration: 4, repeat: Infinity }}
                className="inline-block text-7xl mb-4" 
                style={{ filter: "drop-shadow(0 0 30px rgba(6,182,212,0.5))" }}>
                🛡️
              </motion.div>
              <h1 className="text-4xl font-black mb-2" style={{
                background: "linear-gradient(135deg, #06b6d4, #8b5cf6, #ec4899)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>ADMIN</h1>
              <p className="text-slate-500 text-xs tracking-[0.3em] font-bold uppercase">Abyssal Ocean</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••" autoFocus
                  className={`w-full px-5 py-4 rounded-2xl bg-white/5 border-2 text-white text-center tracking-[0.3em] font-mono text-lg focus:outline-none transition-all backdrop-blur ${
                    passwordError ? "border-red-500 animate-shake" : "border-white/10 focus:border-cyan-500/50 focus:bg-white/10"
                  }`} />
              </div>
              <button type="submit"
                className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all hover:scale-[1.02] shadow-2xl relative overflow-hidden group"
                style={{ background: "linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)" }}>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span>Giriş Yap</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #06b6d4 100%)" }}></div>
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <a href="/" className="text-xs text-slate-500 hover:text-cyan-400 transition-colors inline-flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Ana Site
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
    <div className="min-h-screen relative" style={{
      background: "radial-gradient(ellipse at top, #1e1b4b 0%, #0f172a 40%, #020617 100%)"
    }}>
      {/* Background grid */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }}></div>

      {/* HEADER */}
      <header className="sticky top-0 z-40 backdrop-blur-2xl border-b border-white/5" style={{
        background: "linear-gradient(180deg, rgba(2,6,23,0.9) 0%, rgba(2,6,23,0.7) 100%)"
      }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 blur-md opacity-60" style={{
                background: "linear-gradient(135deg, #06b6d4, #8b5cf6)"
              }}></div>
              <div className="relative w-11 h-11 rounded-xl flex items-center justify-center text-2xl" style={{
                background: "linear-gradient(135deg, #06b6d4, #8b5cf6)"
              }}>🛡️</div>
            </div>
            <div>
              <h1 className="font-black text-xl" style={{
                background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>ADMIN PANEL</h1>
              <p className="text-[10px] text-slate-500 tracking-[0.2em] font-bold uppercase">Abyssal Ocean</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AnimatePresence>
              {saveStatus !== "idle" && (
                <motion.div initial={{ opacity: 0, x: 20, scale: 0.8 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 20, scale: 0.8 }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 backdrop-blur ${
                    saveStatus === "saving" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30" :
                    saveStatus === "success" ? "bg-green-500/10 text-green-400 border border-green-500/30" :
                    "bg-red-500/10 text-red-400 border border-red-500/30"
                  }`}>
                  {saveStatus === "saving" && <div className="w-3 h-3 rounded-full border-2 border-yellow-400 border-r-transparent animate-spin"></div>}
                  {saveStatus === "saving" && "Kaydediliyor..."}
                  {saveStatus === "success" && "✓ Kaydedildi"}
                  {saveStatus === "error" && "✕ Hata"}
                </motion.div>
              )}
            </AnimatePresence>
            <a href="/" className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold transition-all backdrop-blur text-slate-300">
              Ana Site
            </a>
            <button onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold transition-all">
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 py-8">
        {/* STATS HERO */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          {[
            { label: "Toplam", value: stats.total, gradient: "from-cyan-500 to-blue-500", icon: "👥" },
            { label: "Türkiye", value: stats.tr, gradient: "from-red-500 to-rose-600", icon: "🇹🇷" },
            { label: "Avrupa", value: stats.eu, gradient: "from-blue-500 to-indigo-600", icon: "🇪🇺" },
            { label: "Amerika", value: stats.na, gradient: "from-green-500 to-emerald-600", icon: "🇺🇸" },
            { label: "Test", value: stats.totalTests, gradient: "from-purple-500 to-pink-500", icon: "🎯" },
            { label: "Ort. Puan", value: stats.avgPoints, gradient: "from-amber-500 to-orange-500", icon: "⭐" },
          ].map((s, i) => (
            <motion.div key={i} 
              initial={{ opacity: 0, y: 30 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.05, type: "spring", stiffness: 200 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="relative group">
              <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-br ${s.gradient} opacity-0 group-hover:opacity-30 blur-xl transition-opacity`}></div>
              <div className="relative bg-white/[0.03] backdrop-blur-xl rounded-2xl p-5 border border-white/5 hover:border-white/20 transition-all overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br ${s.gradient} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`}></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{s.label}</span>
                    <span className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">{s.icon}</span>
                  </div>
                  <div className={`text-3xl font-black bg-gradient-to-br ${s.gradient} bg-clip-text text-transparent`}>
                    {s.value}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* KIT STATS */}
        <div className="relative bg-white/[0.02] backdrop-blur-xl rounded-3xl p-6 border border-white/5 mb-8 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                Kit İstatistikleri
              </h3>
              <p className="text-xs text-slate-500 mt-1">Detayları görüntülemek için tıkla</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {KITS.map((kit, i) => {
              const count = players.filter(p => cleanTier(p.tiers?.[kit])).length;
              const percentage = players.length ? Math.round((count / players.length) * 100) : 0;
              const colors = KIT_COLORS[kit];
              return (
                <motion.button key={kit}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -5, scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setStatsModal(kit)}
                  className="relative group text-left">
                  <div className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 blur-lg transition-opacity" style={{
                    background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`
                  }}></div>
                  <div className="relative bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 border border-white/5 hover:border-white/20 transition-all overflow-hidden h-full">
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 blur-2xl group-hover:opacity-30 transition-opacity" style={{
                      background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`
                    }}></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-3xl">{KIT_ICONS[kit]}</span>
                        <span className="text-[10px] font-black px-2 py-1 rounded-lg text-white" style={{
                          background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`
                        }}>%{percentage}</span>
                      </div>
                      <div className="text-3xl font-black text-white mb-1">{count}</div>
                      <div className="text-xs text-slate-400 capitalize font-bold mb-3">{kit}</div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ delay: 0.3 + i * 0.05, duration: 0.8 }}
                          className="h-full rounded-full" style={{
                            background: `linear-gradient(90deg, ${colors.from}, ${colors.to})`,
                            boxShadow: `0 0 10px ${colors.glow}`
                          }}></motion.div>
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* CONTROLS */}
        <div className="relative bg-white/[0.02] backdrop-blur-xl rounded-2xl p-4 border border-white/5 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Discord, nick veya ID ara..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all" />
            </div>
            <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-sm focus:outline-none focus:border-cyan-500/50 cursor-pointer">
              <option value="ALL">🌍 Tüm Bölgeler</option>
              <option value="TR">🇹🇷 Türkiye</option>
              <option value="EU">🇪🇺 Avrupa</option>
              <option value="NA">🇺🇸 Amerika</option>
            </select>
            <button onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 rounded-xl text-white font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Yeni Oyuncu
            </button>
            <button onClick={fetchPlayers}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* PLAYERS TABLE */}
        {loading ? (
          <div className="text-center py-24">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-white/5"></div>
              <div className="absolute inset-0 rounded-full border-4 border-cyan-500 border-r-transparent border-b-transparent animate-spin"></div>
            </div>
            <p className="text-slate-400 mt-4 font-bold text-sm">Yükleniyor...</p>
          </div>
        ) : (
          <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="text-left px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">#</th>
                    <th className="text-left px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Oyuncu</th>
                    <th className="text-center px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bölge</th>
                    <th className="text-center px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Puan</th>
                    <th className="text-center px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Test</th>
                    <th className="text-center px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tier</th>
                    <th className="text-right px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((player, i) => (
                    <motion.tr key={player.id} 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: Math.min(i * 0.02, 0.3) }}
                      className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                      <td className="px-4 py-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                          i === 0 ? "bg-gradient-to-br from-amber-400 to-yellow-600 text-black shadow-lg shadow-amber-500/30" :
                          i === 1 ? "bg-gradient-to-br from-slate-300 to-slate-500 text-black" :
                          i === 2 ? "bg-gradient-to-br from-orange-600 to-amber-700 text-white" :
                          "text-slate-500"
                        }`}>{i + 1}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={player.avatar} alt="" className="w-10 h-10 rounded-xl ring-2 ring-white/5 group-hover:ring-cyan-500/30 transition-all"
                            onError={(e) => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/Steve/40`; }} />
                          <div>
                            <div className="font-bold text-sm text-white">{player.minecraftNick || player.username}</div>
                            <div className="text-xs text-slate-500">@{player.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black text-white shadow ${
                          player.region === "TR" ? "bg-gradient-to-br from-red-500 to-rose-600" :
                          player.region === "EU" ? "bg-gradient-to-br from-blue-500 to-indigo-600" : 
                          "bg-gradient-to-br from-green-500 to-emerald-600"
                        }`}>{player.region}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-black text-cyan-400 text-lg">{player.totalPoints}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-400 font-bold text-sm">{player.tests}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs font-bold text-slate-500">
                          {Object.values(player.tiers || {}).filter(t => cleanTier(t)).length}<span className="opacity-50">/8</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingPlayer(player)}
                            className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 transition-all hover:scale-110">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => setDeleteConfirm(player.id)}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all hover:scale-110">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {filteredPlayers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-20 text-center">
                        <div className="text-6xl mb-3 opacity-20">🔍</div>
                        <p className="font-bold text-slate-400">Oyuncu bulunamadı</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* KIT STATS MODAL */}
      <AnimatePresence>
        {statsModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={() => setStatsModal(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-slate-950 rounded-3xl max-w-3xl w-full border border-white/10 shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              
              <div className="relative p-8 overflow-hidden rounded-t-3xl" style={{
                background: `linear-gradient(135deg, ${KIT_COLORS[statsModal].from}, ${KIT_COLORS[statsModal].to})`
              }}>
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-30 blur-3xl" style={{
                  background: KIT_COLORS[statsModal].from
                }}></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="text-7xl drop-shadow-2xl">{KIT_ICONS[statsModal]}</div>
                    <div>
                      <h2 className="text-4xl font-black text-white capitalize drop-shadow-lg">{statsModal}</h2>
                      <p className="text-white/80 text-sm font-bold mt-1">Detaylı İstatistik Paneli</p>
                    </div>
                  </div>
                  <button onClick={() => setStatsModal(null)}
                    className="w-10 h-10 rounded-xl bg-black/20 hover:bg-black/40 backdrop-blur border border-white/20 transition-all flex items-center justify-center text-white">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-6">
                {(() => {
                  const ks = getKitStats(statsModal);
                  return (
                    <>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: "Oyuncu", value: ks.total, color: "cyan" },
                          { label: "Oran", value: `%${ks.percentage}`, color: "purple" },
                          { label: "Ort. Puan", value: ks.avgPoints, color: "amber" },
                        ].map((s, i) => (
                          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                            className="bg-white/5 rounded-2xl p-5 border border-white/5 text-center backdrop-blur">
                            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-2">{s.label}</div>
                            <div className={`text-4xl font-black ${
                              s.color === "cyan" ? "text-cyan-400" : s.color === "purple" ? "text-purple-400" : "text-amber-400"
                            }`}>{s.value}</div>
                          </motion.div>
                        ))}
                      </div>

                      <div>
                        <h3 className="text-xs font-black mb-3 text-slate-300 uppercase tracking-widest flex items-center gap-2">
                          <span>📊</span> Tier Dağılımı
                        </h3>
                        <div className="grid grid-cols-5 gap-2">
                          {TIERS.map((tier, i) => (
                            <motion.div key={tier} 
                              initial={{ opacity: 0, scale: 0.8 }} 
                              animate={{ opacity: 1, scale: 1 }} 
                              transition={{ delay: i * 0.03 }}
                              className={`p-3 rounded-xl bg-gradient-to-br ${TIER_COLORS[tier]} text-white text-center shadow-lg`}>
                              <div className="text-2xl font-black">{ks.tierBreakdown[tier]}</div>
                              <div className="text-[10px] font-bold mt-1 opacity-90">{tier}</div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {ks.topPlayers.length > 0 && (
                        <div>
                          <h3 className="text-xs font-black mb-3 text-slate-300 uppercase tracking-widest flex items-center gap-2">
                            <span>🏆</span> Top 10 Oyuncu
                          </h3>
                          <div className="space-y-2">
                            {ks.topPlayers.map((p, i) => {
                              const tier = cleanTier(p.tiers[statsModal]) || "—";
                              return (
                                <motion.div key={p.id}
                                  initial={{ opacity: 0, x: -20 }} 
                                  animate={{ opacity: 1, x: 0 }} 
                                  transition={{ delay: i * 0.05 }}
                                  className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-xl p-3 border border-white/5 transition-all">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${
                                    i === 0 ? "bg-gradient-to-br from-amber-400 to-yellow-600 text-black" :
                                    i === 1 ? "bg-gradient-to-br from-slate-300 to-slate-500 text-black" :
                                    i === 2 ? "bg-gradient-to-br from-orange-600 to-amber-700 text-white" :
                                    "bg-white/10 text-slate-400"
                                  }`}>{i + 1}</div>
                                  <img src={p.avatar} alt="" className="w-10 h-10 rounded-lg"
                                    onError={(e) => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/Steve/40`; }} />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm truncate">{p.minecraftNick || p.username}</div>
                                    <div className="text-xs text-slate-500 truncate">@{p.username}</div>
                                  </div>
                                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black text-white bg-gradient-to-r ${TIER_COLORS[tier as keyof typeof TIER_COLORS] || "from-gray-600 to-gray-700"}`}>
                                    {tier}
                                  </span>
                                  <span className="text-sm font-black text-cyan-400 min-w-[45px] text-right">
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
        {editingPlayer && (<PlayerModal player={editingPlayer} onClose={() => setEditingPlayer(null)} onSave={updatePlayer} isNew={false} />)}
        {showAddModal && (<PlayerModal player={null} onClose={() => setShowAddModal(false)} onSave={(p) => addPlayer(p as any)} isNew={true} />)}
      </AnimatePresence>

      {/* DELETE CONFIRM */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={() => setDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-slate-950 rounded-3xl p-8 max-w-sm w-full border border-red-500/30 shadow-2xl shadow-red-500/20"
              onClick={e => e.stopPropagation()}>
              <div className="absolute -inset-0.5 rounded-3xl opacity-50 blur-xl" style={{
                background: "linear-gradient(135deg, #ef4444, #dc2626)"
              }}></div>
              <div className="relative text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-2xl font-black mb-2">Emin misin?</h3>
                <p className="text-slate-400 text-sm mb-6">Bu oyuncu kalıcı olarak silinecek!</p>
                <div className="flex gap-2">
                  <button onClick={() => setDeleteConfirm(null)}
                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-sm transition-all">
                    İptal
                  </button>
                  <button onClick={() => deletePlayer(deleteConfirm)}
                    className="flex-1 py-3 rounded-xl text-white font-bold text-sm shadow-lg hover:scale-105 transition-all"
                    style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
                    Sil
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: rgba(15,23,42,0.3); }
        ::-webkit-scrollbar-thumb { background: linear-gradient(180deg, rgba(6,182,212,0.5), rgba(139,92,246,0.5)); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, rgba(6,182,212,0.7), rgba(139,92,246,0.7)); }
      `}</style>
    </div>
  );
}

// 📝 PLAYER MODAL
function PlayerModal({ player, onClose, onSave, isNew }: {
  player: Player | null; onClose: () => void; onSave: (p: any) => void; isNew: boolean;
}) {
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative bg-slate-950 rounded-3xl max-w-2xl w-full border border-white/10 my-8 max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}>
        
        <div className="absolute -inset-0.5 rounded-3xl opacity-30 blur-xl" style={{
          background: "linear-gradient(135deg, #06b6d4, #8b5cf6)"
        }}></div>

        <div className="relative">
          {/* HEADER */}
          <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-xl border-b border-white/5 p-6 rounded-t-3xl flex items-center justify-between">
            <h2 className="text-2xl font-black flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                background: "linear-gradient(135deg, #06b6d4, #8b5cf6)"
              }}>{isNew ? "+" : "✎"}</span>
              {isNew ? "Yeni Oyuncu" : "Düzenle"}
            </h2>
            <button onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/5 hover:border-red-500/30 transition-all flex items-center justify-center text-slate-400 hover:text-red-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* PREVIEW */}
            {!isNew && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/5 to-purple-500/5 border border-white/5 flex items-center gap-4">
                <img src={form.avatar || `https://mc-heads.net/avatar/${form.minecraftNick || "Steve"}/64`} alt=""
                  className="w-14 h-14 rounded-xl ring-2 ring-cyan-500/30" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-lg truncate">{form.minecraftNick || form.username}</div>
                  <div className="text-xs text-slate-500">@{form.username}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Toplam</div>
                  <div className="text-2xl font-black text-cyan-400">{calculateTotalPoints(form.tiers)}p</div>
                </div>
              </div>
            )}

            {/* FIELDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: "Discord Username", key: "username", required: true, placeholder: "kullaniciadi" },
                { label: "Discord ID", key: "discordId", placeholder: "123456789" },
                { label: "Minecraft Nick", key: "minecraftNick", required: true, placeholder: "Steve" },
                { label: "Test Sayısı", key: "tests", type: "number" },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 block">
                    {field.label} {field.required && <span className="text-red-400">*</span>}
                  </label>
                  <input type={field.type || "text"} value={(form as any)[field.key]} placeholder={field.placeholder}
                    onChange={(e) => setForm({ ...form, [field.key]: field.type === "number" ? parseInt(e.target.value) || 0 : e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all" />
                </div>
              ))}
              <div>
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 block">Bölge</label>
                <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value as any })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-sm focus:outline-none focus:border-cyan-500/50 cursor-pointer">
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 block">Avatar URL (opsiyonel)</label>
                <input type="text" value={form.avatar} placeholder="Boş bırakırsan otomatik"
                  onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-sm focus:outline-none focus:border-cyan-500/50 transition-all" />
              </div>
            </div>

            {/* TIERS */}
            <div>
              <h3 className="text-xs font-black mb-3 text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <span>🎯</span> Kit Tierleri
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {KITS.map(kit => {
                  const currentTier = form.tiers[kit] || "";
                  const tierKey = currentTier as keyof typeof TIER_COLORS;
                  return (
                    <div key={kit} className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-white/20 transition-all">
                      <label className="text-xs font-bold capitalize mb-2 flex items-center gap-1.5">
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
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-white/5 text-xs focus:outline-none focus:border-cyan-500/50 cursor-pointer">
                        <option value="">— Yok —</option>
                        {TIERS.map(t => <option key={t} value={t}>{t} ({TIER_POINTS[t]}p)</option>)}
                      </select>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 flex items-center justify-between">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Toplam Puan</span>
                <span className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  {calculateTotalPoints(form.tiers)}
                </span>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="sticky bottom-0 bg-slate-950/95 backdrop-blur-xl border-t border-white/5 p-6 rounded-b-3xl flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-sm transition-all">
              İptal
            </button>
            <button onClick={handleSave}
              className="flex-1 py-3 rounded-xl text-white font-bold text-sm shadow-lg hover:scale-[1.02] transition-all"
              style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)" }}>
              {isNew ? "Ekle" : "Kaydet"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
