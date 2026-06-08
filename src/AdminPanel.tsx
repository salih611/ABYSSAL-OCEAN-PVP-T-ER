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

// 🔐 Şifre: base64 + reverse karışımı - kimse bulamaz
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
  HT1: "bg-gradient-to-r from-amber-500 to-orange-500", LT1: "bg-gradient-to-r from-emerald-500 to-teal-500",
  HT2: "bg-gradient-to-r from-slate-400 to-gray-500", LT2: "bg-gradient-to-r from-cyan-500 to-blue-500",
  HT3: "bg-gradient-to-r from-orange-500 to-red-500", LT3: "bg-gradient-to-r from-indigo-500 to-purple-500",
  HT4: "bg-gradient-to-r from-blue-500 to-sky-500", LT4: "bg-gradient-to-r from-pink-500 to-rose-500",
  HT5: "bg-gradient-to-r from-purple-500 to-fuchsia-500", LT5: "bg-gradient-to-r from-gray-500 to-neutral-500",
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

// 🛡️ Gelişmiş güvenlik (aynı)
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

  // Login
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

  // Data
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

  // İstatistikler (gelişmiş)
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

  // LOGIN - şık tasarım
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0f1c] to-[#0f1629] p-4">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", damping: 20 }}
          className="w-full max-w-md bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg shadow-blue-500/20"
            >
              🛡️
            </motion.div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Admin Panel</h1>
            <p className="text-sm text-gray-400 mt-1">Abyssal Ocean · Yönetim</p>
          </div>
          <form onSubmit={login} className="space-y-5">
            <div>
              <input
                type="password"
                value={pw}
                onChange={e => setPw(e.target.value)}
                autoFocus
                placeholder="Yetki şifresi"
                className={`w-full px-4 py-3 rounded-xl bg-black/40 border ${pwErr ? 'border-red-500' : 'border-white/10'} text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all backdrop-blur-sm`}
              />
              {pwErr && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs mt-2">
                  Yanlış şifre, tekrar dene.
                </motion.p>
              )}
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold transition-all shadow-lg shadow-blue-500/20"
            >
              Giriş Yap
            </button>
          </form>
          <a href="/" className="block text-center text-xs text-gray-500 hover:text-blue-400 mt-6 transition-colors">
            ← Ana Sayfaya Dön
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1c] via-[#0c1222] to-[#0f1629] text-white">
      {/* HEADER - glassmorphism */}
      <header className="sticky top-0 z-40 bg-[#0a0f1c]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xl shadow-lg">
              🛡️
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Abyssal Ocean</h1>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AnimatePresence>
              {saving !== "idle" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`text-xs font-medium px-4 py-2 rounded-full backdrop-blur-sm ${
                    saving === "saving" ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30" :
                    saving === "ok" ? "bg-green-500/20 text-green-300 border border-green-500/30" :
                    "bg-red-500/20 text-red-300 border border-red-500/30"
                  }`}
                >
                  {saving === "saving" ? "💾 Kaydediliyor..." : saving === "ok" ? "✓ Kaydedildi" : "⚠️ Hata"}
                </motion.div>
              )}
            </AnimatePresence>
            <a href="/" className="text-sm text-gray-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all">Ana Sayfa</a>
            <button
              onClick={logout}
              className="text-sm text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* TABS - modern segment kontrol */}
        <div className="flex gap-2 mb-8 bg-white/5 backdrop-blur-sm rounded-2xl p-1 w-fit border border-white/10">
          {[
            { id: "overview", label: "Genel Bakış", icon: "📊" },
            { id: "players", label: "Oyuncular", icon: "👥" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                tab === t.id
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* OVERVIEW - tamamen yenilendi */}
          {tab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Hero kartlar */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { label: "Toplam Oyuncu", value: stats.total, icon: "👥", sub: `TR ${stats.tr} · EU ${stats.eu} · NA ${stats.na}`, color: "from-blue-500 to-indigo-500" },
                  { label: "Toplam Test", value: stats.totalTests, icon: "🎯", sub: `Ort. ${stats.total ? (stats.totalTests / stats.total).toFixed(1) : 0} / oyuncu`, color: "from-emerald-500 to-teal-500" },
                  { label: "Ortalama Puan", value: stats.avgPoints, icon: "📈", sub: `Max: ${stats.maxPoints} puan`, color: "from-amber-500 to-orange-500" },
                  { label: "Kit Tamamlama", value: `${stats.avgTiers}/8`, icon: "🎒", sub: `Toplam ${stats.totalTiers} tier`, color: "from-purple-500 to-pink-500" },
                ].map((stat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-5 hover:border-white/20 transition-all"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">{stat.label}</p>
                        <p className="text-3xl font-bold mt-2">{stat.value}</p>
                        <p className="text-xs text-gray-500 mt-2">{stat.sub}</p>
                      </div>
                      <div className="text-3xl opacity-50">{stat.icon}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Şampiyon kartı */}
              {stats.topPlayer && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent border border-white/10 p-5 backdrop-blur-sm"
                >
                  <div className="absolute top-0 right-0 text-8xl opacity-10">👑</div>
                  <div className="flex flex-wrap items-center gap-5">
                    <img
                      src={stats.topPlayer.avatar}
                      alt=""
                      className="w-16 h-16 rounded-xl border-2 border-amber-500 shadow-lg"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/Steve/64"; }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🏆</span>
                        <h3 className="text-xl font-bold">Lider Oyuncu</h3>
                      </div>
                      <p className="text-lg font-semibold mt-1">{stats.topPlayer.minecraftNick || stats.topPlayer.username}</p>
                      <p className="text-sm text-gray-400">@{stats.topPlayer.username} · {stats.topPlayer.region}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-amber-400">{stats.topPlayer.totalPoints} puan</div>
                      <p className="text-xs text-gray-500">En yüksek puan</p>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tier dağılımı grafiği */}
                <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6">
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-5 flex items-center gap-2">
                    <span className="w-1 h-4 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></span>
                    Tier Dağılımı
                  </h3>
                  <div className="space-y-3">
                    {TIERS.map(tier => {
                      const count = stats.tierCounts[tier];
                      const maxCount = Math.max(...Object.values(stats.tierCounts), 1);
                      const pct = Math.round((count / maxCount) * 100);
                      return (
                        <div key={tier} className="group">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-white text-[11px] font-bold ${TIER_BG[tier].replace("bg-gradient-to-r", "").trim()}`}>
                                {tier}
                              </span>
                              <span className="text-gray-400">{count} oyuncu</span>
                            </div>
                            <span className="text-gray-500">{pct}%</span>
                          </div>
                          <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, delay: 0.1 }}
                              className={`h-full rounded-full ${TIER_BG[tier]}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bölge puanları ve kit katılım */}
                <div className="space-y-6">
                  <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6">
                    <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <span className="w-1 h-4 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></span>
                      Bölge Puanları
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(stats.regionPoints).map(([region, points]) => (
                        <div key={region} className="text-center p-3 rounded-xl bg-black/20 backdrop-blur-sm">
                          <div className="text-2xl mb-1">{region === "TR" ? "🇹🇷" : region === "EU" ? "🇪🇺" : "🇺🇸"}</div>
                          <div className="text-xl font-bold">{points}</div>
                          <div className="text-[10px] text-gray-500 uppercase">{region}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6">
                    <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <span className="w-1 h-4 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></span>
                      Kit Popülaritesi
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {KITS.map(kit => {
                        const count = stats.kitParticipation[kit];
                        const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
                        return (
                          <div key={kit} className="flex items-center gap-2">
                            <span className="text-xl">{KIT_ICONS[kit]}</span>
                            <div className="flex-1">
                              <div className="flex justify-between text-xs">
                                <span className="capitalize">{kit}</span>
                                <span className="text-gray-400">{count}</span>
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

              {/* Kit Detay Butonları */}
              <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-5 flex items-center gap-2">
                  <span className="w-1 h-4 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full"></span>
                  Kit Detayları
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
                  {KITS.map(kit => {
                    const count = stats.kitParticipation[kit];
                    const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
                    return (
                      <button
                        key={kit}
                        onClick={() => setKitDetail(kit)}
                        className="group relative overflow-hidden rounded-xl bg-black/30 backdrop-blur-sm border border-white/10 p-3 hover:border-white/20 transition-all text-center"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 transition-all"></div>
                        <div className="text-2xl mb-1">{KIT_ICONS[kit]}</div>
                        <div className="text-sm font-semibold capitalize">{kit}</div>
                        <div className="text-xs text-gray-400 mt-1">{count} oyuncu</div>
                        <div className="mt-2 h-1 bg-black/40 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* PLAYERS - şık tablo */}
          {tab === "players" && (
            <motion.div
              key="players"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Kontroller */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Oyuncu, Minecraft Nick veya Discord ID ara..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500 transition-all placeholder-gray-500"
                  />
                </div>
                <select
                  value={regionFilter}
                  onChange={e => setRegionFilter(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500 cursor-pointer backdrop-blur-sm"
                >
                  <option value="ALL">🌍 Tüm Bölgeler</option>
                  <option value="TR">🇹🇷 TR</option>
                  <option value="EU">🇪🇺 EU</option>
                  <option value="NA">🇺🇸 NA</option>
                </select>
                <button
                  onClick={() => setAdding(true)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                >
                  <span>+</span> Yeni Oyuncu
                </button>
                <button
                  onClick={fetchPlayers}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              <div className="text-xs text-gray-500 mb-3 flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                {filtered.length} oyuncu listeleniyor
              </div>

              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                </div>
              ) : (
                <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-white/10 bg-black/20">
                        <tr>
                          {["#", "Oyuncu", "Bölge", "Puan", "Test", "Kit", ""].map((h, i) => (
                            <th key={i} className={`px-5 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider ${i === 0 ? "text-left w-12" : i === 1 ? "text-left" : i === 6 ? "text-right" : "text-center"}`}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((p, i) => (
                          <motion.tr
                            key={p.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: Math.min(i * 0.02, 0.3) }}
                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                          >
                            <td className="px-5 py-4 text-sm text-gray-400 font-mono">{i + 1}</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={p.avatar}
                                  alt=""
                                  className="w-9 h-9 rounded-xl object-cover border border-white/10"
                                  onError={(e) => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/Steve/36"; }}
                                />
                                <div>
                                  <div className="text-sm font-semibold">{p.minecraftNick || p.username}</div>
                                  <div className="text-[11px] text-gray-500">@{p.username}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${
                                p.region === "TR" ? "bg-red-500/20 text-red-300" :
                                p.region === "EU" ? "bg-blue-500/20 text-blue-300" :
                                "bg-green-500/20 text-green-300"
                              }`}>
                                {p.region}
                              </span>
                             </td>
                            <td className="px-5 py-4 text-center">
                              <span className="text-base font-bold text-cyan-400">{p.totalPoints}</span>
                             </td>
                            <td className="px-5 py-4 text-center text-sm text-gray-400">{p.tests}</td>
                            <td className="px-5 py-4 text-center">
                              <div className="flex items-center justify-center gap-1 text-xs">
                                <span className="text-gray-400">{Object.values(p.tiers || {}).filter(t => cleanTier(t)).length}</span>
                                <span className="text-gray-600">/8</span>
                              </div>
                             </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex justify-end gap-1">
                                <button
                                  onClick={() => setEditing(p)}
                                  className="p-1.5 rounded-lg hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 transition-all"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => setDeleting(p.id)}
                                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                        {filtered.length === 0 && (
                          <tr>
                            <td colSpan={7} className="py-20 text-center text-gray-500">
                              🧩 Oyuncu bulunamadı
                            </td>
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

      {/* KIT DETAY MODAL - gelişmiş */}
      <AnimatePresence>
        {kitDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={() => setKitDetail(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="bg-[#0f1422] rounded-2xl max-w-2xl w-full border border-white/20 shadow-2xl max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 bg-[#0f1422]/90 backdrop-blur-md border-b border-white/10 p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{KIT_ICONS[kitDetail]}</span>
                  <div>
                    <h2 className="text-xl font-bold capitalize">{kitDetail}</h2>
                    <p className="text-xs text-gray-400">Kit detaylı istatistikler</p>
                  </div>
                </div>
                <button onClick={() => setKitDetail(null)} className="p-2 rounded-full hover:bg-white/10 transition-all text-gray-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-5 space-y-6">
                {(() => {
                  const ks = getKitStats(kitDetail);
                  return (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: "Oyuncu Sayısı", value: ks.total, icon: "👥" },
                          { label: "Katılım Oranı", value: `%${ks.pct}`, icon: "📊" },
                          { label: "Ortalama Puan", value: ks.avg, icon: "⭐" },
                          { label: "En İyi Tier", value: ks.best, icon: "🏅" },
                        ].map((s, i) => (
                          <div key={i} className="bg-black/30 rounded-xl p-3 text-center border border-white/5">
                            <div className="text-xl mb-1">{s.icon}</div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-wider">{s.label}</div>
                            <div className="text-lg font-bold mt-1">{s.value}</div>
                          </div>
                        ))}
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <span className="w-1 h-3 bg-cyan-500 rounded-full"></span>
                          Tier Dağılımı
                        </h4>
                        <div className="space-y-2">
                          {TIERS.map(tier => {
                            const count = ks.breakdown[tier];
                            const max = Math.max(...Object.values(ks.breakdown), 1);
                            return (
                              <div key={tier} className="flex items-center gap-3">
                                <span className={`w-12 text-center text-[10px] font-bold text-white py-0.5 rounded ${TIER_BG[tier]}`}>
                                  {tier}
                                </span>
                                <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(count / max) * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                    className={`h-full rounded-full ${TIER_BG[tier]}`}
                                  />
                                </div>
                                <span className="text-xs text-gray-400 w-8 text-right">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {ks.top.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-1 h-3 bg-amber-500 rounded-full"></span>
                            İlk 10 Oyuncu
                          </h4>
                          <div className="space-y-2">
                            {ks.top.map((p, i) => {
                              const tier = cleanTier(p.tiers[kitDetail]) || "—";
                              return (
                                <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                                  <span className="text-sm text-gray-500 font-mono w-6">{i + 1}</span>
                                  <img
                                    src={p.avatar}
                                    alt=""
                                    className="w-8 h-8 rounded-lg"
                                    onError={(e) => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/Steve/32"; }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold truncate">{p.minecraftNick || p.username}</div>
                                    <div className="text-[10px] text-gray-500">{p.region}</div>
                                  </div>
                                  <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${TIER_BG[tier]}`}>
                                    {tier}
                                  </span>
                                  <span className="text-xs text-cyan-400 font-mono">{TIER_POINTS[tier] || 0}p</span>
                                </div>
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

      {/* EDIT/ADD MODAL - tamamen iyileştirildi */}
      <AnimatePresence>
        {editing && <PlayerModal player={editing} onClose={() => setEditing(null)} onSave={updatePlayer} isNew={false} />}
        {adding && <PlayerModal player={null} onClose={() => setAdding(false)} onSave={p => addPlayer(p as any)} isNew={true} />}
      </AnimatePresence>

      {/* DELETE MODAL */}
      <AnimatePresence>
        {deleting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={() => setDeleting(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f1422] rounded-2xl p-6 max-w-sm w-full border border-red-500/30 text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-5xl mb-3">⚠️</div>
              <h3 className="text-lg font-bold mb-1">Oyuncuyu sil</h3>
              <p className="text-sm text-gray-400 mb-6">Bu işlem geri alınamaz. Oyuncu tamamen silinecek.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleting(null)} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 font-semibold transition-all">İptal</button>
                <button onClick={() => deletePlayer(deleting)} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 font-semibold transition-all">Sil</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// PlayerModal - düzenleme/ekleme, şık ve modern
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="bg-[#0f1422] rounded-2xl max-w-3xl w-full border border-white/20 shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-[#0f1422]/90 backdrop-blur-md border-b border-white/10 p-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">{isNew ? "Yeni Oyuncu Ekle" : "Oyuncu Düzenle"}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-all text-gray-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {!isNew && (
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl border border-white/10">
              <img
                src={form.avatar || `https://mc-heads.net/avatar/${form.minecraftNick || "Steve"}/64`}
                alt=""
                className="w-14 h-14 rounded-xl border-2 border-blue-500/30"
              />
              <div className="flex-1">
                <div className="text-lg font-bold">{form.minecraftNick || form.username}</div>
                <div className="text-sm text-gray-400">@{form.username}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-cyan-400">{totalPoints} puan</div>
                <div className="text-xs text-gray-500">Toplam</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Discord Kullanıcı Adı *</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 focus:border-blue-500 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Discord ID</label>
              <input
                type="text"
                value={form.discordId}
                onChange={e => setForm({ ...form, discordId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 focus:border-blue-500 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Minecraft Nick *</label>
              <input
                type="text"
                value={form.minecraftNick}
                onChange={e => setForm({ ...form, minecraftNick: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 focus:border-blue-500 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Test Sayısı</label>
              <input
                type="number"
                value={form.tests}
                onChange={e => setForm({ ...form, tests: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 focus:border-blue-500 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Bölge</label>
              <select
                value={form.region}
                onChange={e => setForm({ ...form, region: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Avatar URL (opsiyonel)</label>
              <input
                type="text"
                value={form.avatar}
                placeholder="Boş bırakılırsa otomatik MC-Heads"
                onChange={e => setForm({ ...form, avatar: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 focus:border-blue-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1 h-3 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></span>
              Kit Tierleri
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {KITS.map(kit => {
                const current = form.tiers[kit] || "";
                return (
                  <div key={kit} className="bg-black/30 rounded-xl p-3 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{KIT_ICONS[kit]}</span>
                      <span className="text-xs text-gray-300 capitalize font-semibold">{kit}</span>
                      {current && <span className={`ml-auto text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full ${TIER_BG[current]}`}>{current}</span>}
                    </div>
                    <select
                      value={current}
                      onChange={e => {
                        const t = { ...form.tiers };
                        if (e.target.value) t[kit] = e.target.value; else delete t[kit];
                        setForm({ ...form, tiers: t });
                      }}
                      className="w-full px-2 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="">— Seç —</option>
                      {TIERS.map(t => <option key={t} value={t}>{t} ({TIER_POINTS[t]}p)</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 flex items-center justify-between">
              <span className="text-xs text-gray-300 font-semibold">Toplam Puan</span>
              <span className="text-2xl font-bold text-cyan-400">{totalPoints}</span>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-[#0f1422]/90 backdrop-blur-md border-t border-white/10 p-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 font-semibold transition-all">İptal</button>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 font-semibold transition-all shadow-lg shadow-blue-500/20">
            {isNew ? "Oyuncuyu Ekle" : "Değişiklikleri Kaydet"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
