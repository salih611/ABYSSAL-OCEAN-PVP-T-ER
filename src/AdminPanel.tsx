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
  vanilla: "✋", sword: "⚔️", axe: "🪓", nethpot: "💎",
  pot: "🧪", uhc: "🍎", mace: "🔨", smp: "🛡️"
};
const TIERS = ["HT1", "LT1", "HT2", "LT2", "HT3", "LT3", "HT4", "LT4", "HT5", "LT5"];
const REGIONS: Array<"TR" | "EU" | "NA"> = ["TR", "EU", "NA"];

const TIER_POINTS: Record<string, number> = {
  "HT1": 60, "LT1": 44, "HT2": 28, "LT2": 16, "HT3": 10, "LT3": 6,
  "HT4": 4, "LT4": 3, "HT5": 2, "LT5": 1,
};

const TIER_BG: Record<string, string> = {
  HT1: "bg-gradient-to-r from-amber-500 to-orange-500", 
  LT1: "bg-gradient-to-r from-emerald-500 to-teal-500",
  HT2: "bg-gradient-to-r from-slate-400 to-gray-500", 
  LT2: "bg-gradient-to-r from-cyan-500 to-blue-500",
  HT3: "bg-gradient-to-r from-orange-500 to-red-500", 
  LT3: "bg-gradient-to-r from-indigo-500 to-purple-500",
  HT4: "bg-gradient-to-r from-blue-500 to-sky-500", 
  LT4: "bg-gradient-to-r from-pink-500 to-rose-500",
  HT5: "bg-gradient-to-r from-purple-500 to-fuchsia-500", 
  LT5: "bg-gradient-to-r from-gray-500 to-neutral-500",
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

// Güvenlik
const useSecurity = () => {
  useEffect(() => {
    const a = (e: MouseEvent) => { e.preventDefault(); };
    const b = (e: KeyboardEvent) => {
      if (e.key === "F12" || e.keyCode === 123) { e.preventDefault(); return; }
      if (e.ctrlKey && e.shiftKey && /^[IJCKijck]$/.test(e.key)) { e.preventDefault(); return; }
      if (e.ctrlKey && /^[USPusp]$/.test(e.key)) { e.preventDefault(); return; }
    };
    let d = false;
    const c = () => {
      if (window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160) {
        if (!d) { d = true; sessionStorage.removeItem("ao_a"); window.location.href = "/admin"; }
      } else { d = false; }
    };
    document.addEventListener("contextmenu", a);
    document.addEventListener("keydown", b);
    const i = setInterval(c, 1000);
    return () => { document.removeEventListener("contextmenu", a); document.removeEventListener("keydown", b); clearInterval(i); };
  }, []);
};

export default function AdminPanel() {
  useSecurity();

  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwErr, setPwErr] = useState(false);
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("ALL");
  const [editing, setEditing] = useState<Player | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [kitDetail, setKitDetail] = useState<string | null>(null);
  const [tab, setTab] = useState<"players" | "overview">("overview");

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === _p()) {
      setAuthed(true);
      sessionStorage.setItem("ao_a", "1");
      setPwErr(false);
    } else {
      setPwErr(true);
      setTimeout(() => setPwErr(false), 1500);
    }
  };

  useEffect(() => { if (sessionStorage.getItem("ao_a") === "1") setAuthed(true); }, []);

  const logout = () => { sessionStorage.removeItem("ao_a"); setAuthed(false); setPw(""); };

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${UPSTASH_URL}/get/players`, { headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` } });
      const d = await r.json();
      if (d.result) {
        const p: Player[] = JSON.parse(d.result);
        setPlayers(p.map(x => ({ ...x, tiers: x.tiers || {}, tests: x.tests || 0, totalPoints: calculateTotalPoints(x.tiers || {}) })));
      }
    } catch { /* */ } finally { setLoading(false); }
  };

  useEffect(() => { if (authed) fetchPlayers(); }, [authed]);

  const save = async (list: Player[]) => {
    setSaving("saving");
    try {
      const updated = list.map(p => ({ ...p, totalPoints: calculateTotalPoints(p.tiers) }));
      const byR: Record<string, Player[]> = { TR: [], EU: [], NA: [] };
      updated.forEach(p => byR[p.region]?.push(p));
      Object.keys(byR).forEach(r => {
        byR[r].sort((a, b) => b.totalPoints - a.totalPoints);
        byR[r].forEach((p, i) => { p.rank = i + 1; });
      });
      const final = [...byR.TR, ...byR.EU, ...byR.NA];
      const res = await fetch(`${UPSTASH_URL}/set/players`, {
        method: "POST",
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(final)
      });
      if (res.ok) { setPlayers(final); setSaving("ok"); setTimeout(() => setSaving("idle"), 2000); return true; }
      throw new Error();
    } catch { setSaving("err"); setTimeout(() => setSaving("idle"), 3000); return false; }
  };

  const addPlayer = async (p: any) => {
    const player: Player = { ...p, id: Date.now().toString(), rank: 0, totalPoints: calculateTotalPoints(p.tiers), avatar: p.avatar || `https://mc-heads.net/avatar/${p.minecraftNick || "Steve"}/128` };
    if (await save([...players, player])) setAdding(false);
  };

  const updatePlayer = async (p: Player) => {
    if (await save(players.map(x => x.id === p.id ? p : x))) setEditing(null);
  };

  const deletePlayer = async (id: string) => {
    await save(players.filter(p => p.id !== id));
    setDeleting(null);
  };

  const filtered = useMemo(() => {
    let list = [...players];
    if (regionFilter !== "ALL") list = list.filter(p => p.region === regionFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.username?.toLowerCase().includes(q) || p.minecraftNick?.toLowerCase().includes(q) || p.discordId?.includes(q));
    }
    return list.sort((a, b) => b.totalPoints - a.totalPoints);
  }, [players, search, regionFilter]);

  const stats = useMemo(() => {
    const total = players.length;
    const tr = players.filter(p => p.region === "TR").length;
    const eu = players.filter(p => p.region === "EU").length;
    const na = players.filter(p => p.region === "NA").length;
    const totalTests = players.reduce((s, p) => s + (p.tests || 0), 0);
    const avgPoints = total ? Math.round(players.reduce((s, p) => s + p.totalPoints, 0) / total) : 0;
    const maxPoints = total ? Math.max(...players.map(p => p.totalPoints)) : 0;
    const topPlayer = players.find(p => p.totalPoints === maxPoints) || null;
    const totalTiers = players.reduce((s, p) => s + Object.values(p.tiers || {}).filter(t => cleanTier(t)).length, 0);
    const avgTiers = total ? (totalTiers / total).toFixed(1) : "0";

    const tierCounts: Record<string, number> = {};
    TIERS.forEach(t => { tierCounts[t] = 0; });
    players.forEach(p => Object.values(p.tiers || {}).forEach(t => { const c = cleanTier(t); if (c) tierCounts[c]++; }));

    const regionPoints: Record<string, number> = { TR: 0, EU: 0, NA: 0 };
    players.forEach(p => { regionPoints[p.region] += p.totalPoints; });

    const kitParticipation: Record<string, number> = {};
    KITS.forEach(k => { kitParticipation[k] = players.filter(p => cleanTier(p.tiers?.[k])).length; });

    return { total, tr, eu, na, totalTests, avgPoints, maxPoints, topPlayer, totalTiers, avgTiers, tierCounts, regionPoints, kitParticipation };
  }, [players]);

  const getKitStats = (kit: string) => {
    const withKit = players.filter(p => cleanTier(p.tiers?.[kit]));
    const breakdown: Record<string, number> = {};
    TIERS.forEach(t => { breakdown[t] = 0; });
    withKit.forEach(p => { const t = cleanTier(p.tiers[kit]); if (t) breakdown[t]++; });
    const top = [...withKit].sort((a, b) => (TIER_POINTS[cleanTier(b.tiers[kit]) || ""] || 0) - (TIER_POINTS[cleanTier(a.tiers[kit]) || ""] || 0)).slice(0, 10);
    const avg = withKit.length ? Math.round(withKit.reduce((s, p) => s + (TIER_POINTS[cleanTier(p.tiers[kit]) || ""] || 0), 0) / withKit.length) : 0;
    const best = withKit.length ? cleanTier(top[0]?.tiers[kit]) || "—" : "—";
    return { total: withKit.length, pct: players.length ? Math.round((withKit.length / players.length) * 100) : 0, breakdown, top, avg, best };
  };

  // LOGIN
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotateX: -15 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          transition={{ type: "spring", damping: 15 }}
          className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: "spring" }}
              className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-5xl mx-auto mb-4 shadow-lg shadow-purple-500/30"
            >
              🌊
            </motion.div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">Abyssal Ocean</h1>
            <p className="text-sm text-gray-300 mt-2">Admin Panel · Yönetim</p>
          </div>
          <form onSubmit={login} className="space-y-5">
            <div>
              <input
                type="password"
                value={pw}
                onChange={e => setPw(e.target.value)}
                autoFocus
                placeholder="Admin Şifresi"
                className={`w-full px-4 py-3 rounded-xl bg-black/50 border ${pwErr ? 'border-red-500' : 'border-white/20'} text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all backdrop-blur-sm`}
              />
              {pwErr && (
                <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-xs mt-2 flex items-center gap-1">
                  <span>⚠️</span> Yanlış şifre, tekrar dene.
                </motion.p>
              )}
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition-all shadow-lg shadow-purple-500/30"
            >
              Giriş Yap
            </button>
          </form>
          <a href="/" className="block text-center text-xs text-gray-400 hover:text-white mt-6 transition-colors">
            ← Ana Sayfaya Dön
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-purple-500/30">
              🌊
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">Abyssal Ocean</h1>
              <p className="text-[10px] text-gray-400">Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AnimatePresence>
              {saving !== "idle" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`text-xs font-medium px-4 py-1.5 rounded-full backdrop-blur-sm ${
                    saving === "saving" ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30" :
                    saving === "ok" ? "bg-green-500/20 text-green-300 border border-green-500/30" :
                    "bg-red-500/20 text-red-300 border border-red-500/30"
                  }`}
                >
                  {saving === "saving" ? "💾 Kaydediliyor..." : saving === "ok" ? "✓ Kaydedildi" : "⚠️ Hata"}
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={logout}
              className="text-sm text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white/5 backdrop-blur-sm rounded-2xl p-1 w-fit border border-white/10">
          {[
            { id: "overview", label: "Genel Bakış", icon: "📊" },
            { id: "players", label: "Oyuncular", icon: "👥" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                tab === t.id
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {tab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Toplam Oyuncu", value: stats.total, icon: "👥", sub: `🇹🇷 ${stats.tr} · 🇪🇺 ${stats.eu} · 🇺🇸 ${stats.na}`, gradient: "from-blue-500 to-cyan-500" },
                  { label: "Toplam Test", value: stats.totalTests, icon: "🎯", sub: `Ort. ${stats.total ? (stats.totalTests / stats.total).toFixed(1) : 0}`, gradient: "from-emerald-500 to-teal-500" },
                  { label: "Ortalama Puan", value: stats.avgPoints, icon: "📈", sub: `Max: ${stats.maxPoints}`, gradient: "from-amber-500 to-orange-500" },
                  { label: "Kit Tamamlama", value: `${stats.avgTiers}/8`, icon: "🎒", sub: `Toplam ${stats.totalTiers} tier`, gradient: "from-purple-500 to-pink-500" },
                ].map((stat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 hover:border-white/20 transition-all group"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">{stat.label}</p>
                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                        <p className="text-[10px] text-gray-500 mt-1">{stat.sub}</p>
                      </div>
                      <div className="text-2xl opacity-50">{stat.icon}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Champion Card */}
              {stats.topPlayer && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent border border-white/10 p-5 backdrop-blur-sm"
                >
                  <div className="absolute top-0 right-0 text-8xl opacity-10">🏆</div>
                  <div className="flex items-center gap-5 flex-wrap">
                    <img
                      src={stats.topPlayer.avatar}
                      className="w-16 h-16 rounded-xl border-2 border-amber-500 shadow-lg"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/Steve/64"; }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">👑</span>
                        <h3 className="text-lg font-bold">Lider Oyuncu</h3>
                      </div>
                      <p className="text-xl font-semibold">{stats.topPlayer.minecraftNick || stats.topPlayer.username}</p>
                      <p className="text-sm text-gray-400">@{stats.topPlayer.username} · {stats.topPlayer.region}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-amber-400">{stats.topPlayer.totalPoints}</div>
                      <p className="text-xs text-gray-500">Toplam Puan</p>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tier Distribution */}
                <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-5">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                    Tier Dağılımı
                  </h3>
                  <div className="space-y-3">
                    {TIERS.map(tier => {
                      const count = stats.tierCounts[tier];
                      const maxCount = Math.max(...Object.values(stats.tierCounts), 1);
                      const pct = (count / maxCount) * 100;
                      return (
                        <div key={tier}>
                          <div className="flex justify-between text-xs mb-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-white text-[10px] font-bold ${TIER_BG[tier]}`}>{tier}</span>
                              <span className="text-gray-400">{count}</span>
                            </div>
                            <span className="text-gray-500">{Math.round(pct)}%</span>
                          </div>
                          <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.5 }}
                              className={`h-full rounded-full ${TIER_BG[tier]}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Region & Kit Stats */}
                <div className="space-y-6">
                  <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-5">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                      <div className="w-1 h-4 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></div>
                      Bölge Puanları
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(stats.regionPoints).map(([region, points]) => (
                        <div key={region} className="text-center p-3 rounded-xl bg-black/30">
                          <div className="text-3xl mb-1">{region === "TR" ? "🇹🇷" : region === "EU" ? "🇪🇺" : "🇺🇸"}</div>
                          <div className="text-xl font-bold text-cyan-400">{points}</div>
                          <div className="text-[10px] text-gray-500">{region}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-5">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                      <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                      Kit Popülaritesi
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {KITS.map(kit => {
                        const count = stats.kitParticipation[kit];
                        const pct = stats.total ? (count / stats.total) * 100 : 0;
                        return (
                          <div key={kit} className="flex items-center gap-2">
                            <span className="text-xl">{KIT_ICONS[kit]}</span>
                            <div className="flex-1">
                              <div className="flex justify-between text-xs">
                                <span className="capitalize text-gray-300">{kit}</span>
                                <span className="text-gray-500">{count}</span>
                              </div>
                              <div className="h-1.5 bg-black/30 rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${pct}%` }}></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Kit Buttons */}
              <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-5">
                <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full"></div>
                  Kit Detayları
                </h3>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                  {KITS.map(kit => {
                    const count = stats.kitParticipation[kit];
                    const pct = stats.total ? (count / stats.total) * 100 : 0;
                    return (
                      <button
                        key={kit}
                        onClick={() => setKitDetail(kit)}
                        className="group relative overflow-hidden rounded-xl bg-black/30 border border-white/10 p-3 hover:border-purple-500/50 transition-all text-center"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all" />
                        <div className="text-2xl mb-1">{KIT_ICONS[kit]}</div>
                        <div className="text-xs font-semibold capitalize text-gray-300">{kit}</div>
                        <div className="text-[10px] text-gray-500 mt-1">{count}</div>
                        <div className="mt-2 h-1 bg-black/40 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Players Tab */}
          {tab === "players" && (
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
                  <option value="ALL">🌍 Tümü</option>
                  <option value="TR">🇹🇷 TR</option>
                  <option value="EU">🇪🇺 EU</option>
                  <option value="NA">🇺🇸 NA</option>
                </select>
                <button
                  onClick={() => setAdding(true)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm font-semibold transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
                >
                  + Yeni
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

              <div className="text-xs text-gray-500 mb-3">📋 {filtered.length} oyuncu</div>

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
                          <th className="px-5 py-4 text-right w-20"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((p, i) => (
                          <motion.tr
                            key={p.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: Math.min(i * 0.01, 0.3) }}
                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                          >
                            <td className="px-5 py-3 text-sm text-gray-500 font-mono">{i + 1}</td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={p.avatar}
                                  className="w-9 h-9 rounded-xl object-cover border border-white/10"
                                  onError={(e) => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/Steve/36"; }}
                                />
                                <div>
                                  <div className="text-sm font-semibold">{p.minecraftNick || p.username}</div>
                                  <div className="text-[10px] text-gray-500">@{p.username}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${
                                p.region === "TR" ? "bg-red-500/20 text-red-300" :
                                p.region === "EU" ? "bg-blue-500/20 text-blue-300" : "bg-green-500/20 text-green-300"
                              }`}>{p.region}</span>
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span className="text-base font-bold text-cyan-400">{p.totalPoints}</span>
                            </td>
                            <td className="px-5 py-3 text-center text-sm text-gray-400">{p.tests}</td>
                            <td className="px-5 py-3 text-center text-xs text-gray-400">
                              {Object.values(p.tiers || {}).filter(t => cleanTier(t)).length}/8
                            </td>
                            <td className="px-5 py-3 text-right">
                              <div className="flex justify-end gap-1">
                                <button onClick={() => setEditing(p)} className="p-1.5 rounded-lg hover:bg-blue-500/20 text-gray-400 hover:text-blue-400">
                                  ✏️
                                </button>
                                <button onClick={() => setDeleting(p.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400">
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                        {filtered.length === 0 && (
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
        {kitDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setKitDetail(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="bg-slate-900 rounded-2xl max-w-2xl w-full border border-white/20 max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-slate-900/90 backdrop-blur-md border-b border-white/10 p-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{KIT_ICONS[kitDetail]}</span>
                  <h2 className="text-xl font-bold capitalize">{kitDetail}</h2>
                </div>
                <button onClick={() => setKitDetail(null)} className="p-2 rounded-full hover:bg-white/10">✕</button>
              </div>
              <div className="p-5">
                {(() => {
                  const ks = getKitStats(kitDetail);
                  return (
                    <div className="space-y-5">
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { label: "Oyuncu", value: ks.total },
                          { label: "Oran", value: `%${ks.pct}` },
                          { label: "Ort. Puan", value: ks.avg },
                          { label: "En İyi", value: ks.best },
                        ].map(s => (
                          <div key={s.label} className="bg-black/30 rounded-xl p-3 text-center">
                            <div className="text-[10px] text-gray-400">{s.label}</div>
                            <div className="text-xl font-bold text-cyan-400">{s.value}</div>
                          </div>
                        ))}
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 mb-3">Tier Dağılımı</h4>
                        <div className="space-y-2">
                          {TIERS.map(tier => {
                            const count = ks.breakdown[tier];
                            const max = Math.max(...Object.values(ks.breakdown), 1);
                            return (
                              <div key={tier} className="flex items-center gap-3">
                                <span className={`w-12 text-center text-[10px] font-bold py-0.5 rounded ${TIER_BG[tier]}`}>{tier}</span>
                                <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${TIER_BG[tier]}`} style={{ width: `${(count / max) * 100}%` }}></div>
                                </div>
                                <span className="text-xs text-gray-400 w-8">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {ks.top.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-400 mb-3">İlk 10</h4>
                          <div className="space-y-2">
                            {ks.top.map((p, i) => {
                              const tier = cleanTier(p.tiers[kitDetail]) || "—";
                              return (
                                <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
                                  <span className="text-sm text-gray-500 w-6">{i + 1}</span>
                                  <img src={p.avatar} className="w-8 h-8 rounded-lg" onError={(e) => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/Steve/32"; }} />
                                  <div className="flex-1 text-sm font-semibold">{p.minecraftNick || p.username}</div>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIER_BG[tier]}`}>{tier}</span>
                                  <span className="text-xs text-cyan-400">{TIER_POINTS[tier] || 0}p</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit/Add Modal */}
      <AnimatePresence>
        {editing && <PlayerModal player={editing} onClose={() => setEditing(null)} onSave={updatePlayer} isNew={false} />}
        {adding && <PlayerModal player={null} onClose={() => setAdding(false)} onSave={p => addPlayer(p as any)} isNew={true} />}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setDeleting(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 rounded-2xl p-6 max-w-sm w-full border border-red-500/30 text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-5xl mb-3">⚠️</div>
              <h3 className="text-lg font-bold mb-1">Emin misin?</h3>
              <p className="text-sm text-gray-400 mb-6">Bu işlem geri alınamaz.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleting(null)} className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 font-semibold">İptal</button>
                <button onClick={() => deletePlayer(deleting)} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 font-semibold">Sil</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Player Modal Component
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

  const totalPoints = useMemo(() => calculateTotalPoints(form.tiers), [form.tiers]);

  const handleSave = () => {
    if (!form.username || !form.minecraftNick) {
      alert("Discord kullanıcı adı ve Minecraft Nick zorunlu!");
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
        className="bg-slate-900 rounded-2xl max-w-2xl w-full border border-white/20 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-900/90 backdrop-blur-md border-b border-white/10 p-5 flex justify-between items-center">
          <h2 className="text-xl font-bold">{isNew ? "Yeni Oyuncu" : "Oyuncu Düzenle"}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10">✕</button>
        </div>

        <div className="p-5 space-y-5">
          {!isNew && (
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl">
              <img src={form.avatar || `https://mc-heads.net/avatar/${form.minecraftNick || "Steve"}/64`} className="w-14 h-14 rounded-xl border border-blue-500/30" />
              <div className="flex-1">
                <div className="text-lg font-bold">{form.minecraftNick || form.username}</div>
                <div className="text-sm text-gray-400">@{form.username}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-cyan-400">{totalPoints}</div>
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
              <select value={form.region} onChange={e => setForm({ ...form, region: e.target.value as any })} className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/10">
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
                      <span className="text-xs capitalize text-gray-300">{kit}</span>
                    </div>
                    <select value={current} onChange={e => {
                      const t = { ...form.tiers };
                      if (e.target.value) t[kit] = e.target.value; else delete t[kit];
                      setForm({ ...form, tiers: t });
                    }} className="w-full px-2 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs">
                      <option value="">—</option>
                      {TIERS.map(t => <option key={t}>{t} ({TIER_POINTS[t]})</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-slate-900/90 backdrop-blur-md border-t border-white/10 p-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 font-semibold">İptal</button>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-semibold">{isNew ? "Ekle" : "Kaydet"}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
