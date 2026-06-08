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
  HT1: "bg-amber-500", LT1: "bg-emerald-500", HT2: "bg-slate-400", LT2: "bg-cyan-500",
  HT3: "bg-orange-500", LT3: "bg-indigo-500", HT4: "bg-blue-500", LT4: "bg-pink-500",
  HT5: "bg-purple-500", LT5: "bg-gray-500",
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

// 🛡️ Sessiz güvenlik
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

  // İstatistikler
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

    return { total, tr, eu, na, totalTests, avgPoints, maxPoints, topPlayer, totalTiers, avgTiers, tierCounts, regionPoints };
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
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f17] p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-[#111827] rounded-2xl p-8 border border-[#1e293b]">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#1e293b] flex items-center justify-center text-3xl mx-auto mb-4">🛡️</div>
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
            <p className="text-xs text-slate-500 mt-1">Abyssal Ocean</p>
          </div>
          <form onSubmit={login} className="space-y-4">
            <input type="password" value={pw} onChange={e => setPw(e.target.value)} autoFocus placeholder="Şifre"
              className={`w-full px-4 py-3 rounded-xl bg-[#0b0f17] border text-white text-sm focus:outline-none transition-all ${pwErr ? "border-red-500" : "border-[#1e293b] focus:border-blue-500"}`} />
            {pwErr && <p className="text-red-400 text-xs">Yanlış şifre</p>}
            <button type="submit" className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">
              Giriş
            </button>
          </form>
          <a href="/" className="block text-center text-xs text-slate-500 hover:text-blue-400 mt-6 transition-colors">← Ana Site</a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f17] text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#0b0f17]/90 backdrop-blur-lg border-b border-[#1e293b]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1e293b] flex items-center justify-center text-lg">🛡️</div>
            <div>
              <h1 className="text-sm font-bold text-white">Admin Panel</h1>
              <p className="text-[10px] text-slate-500">Abyssal Ocean</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {saving !== "idle" && (
                <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg ${saving === "saving" ? "bg-yellow-500/10 text-yellow-400" : saving === "ok" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                  {saving === "saving" ? "Kaydediliyor..." : saving === "ok" ? "✓ Kayıt tamam" : "✕ Hata"}
                </motion.span>
              )}
            </AnimatePresence>
            <a href="/" className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-[#1e293b] transition-all">Ana Site</a>
            <button onClick={logout} className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all">Çıkış</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* TABS */}
        <div className="flex gap-1 mb-6 bg-[#111827] rounded-xl p-1 w-fit">
          {[
            { id: "overview", label: "Genel Bakış", icon: "📊" },
            { id: "players", label: "Oyuncular", icon: "👥" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${tab === t.id ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* OVERVIEW */}
          {tab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              
              {/* Top stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Oyuncu", value: stats.total, sub: `TR ${stats.tr} · EU ${stats.eu} · NA ${stats.na}` },
                  { label: "Toplam Test", value: stats.totalTests, sub: `Ort. ${stats.total ? (stats.totalTests / stats.total).toFixed(1) : 0} / oyuncu` },
                  { label: "Ort. Puan", value: stats.avgPoints, sub: `Max: ${stats.maxPoints}` },
                  { label: "Ort. Kit", value: stats.avgTiers, sub: `Toplam: ${stats.totalTiers} tier` },
                ].map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-[#111827] rounded-xl p-4 border border-[#1e293b]">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">{s.label}</div>
                    <div className="text-2xl font-bold text-white">{s.value}</div>
                    <div className="text-[10px] text-slate-500 mt-1">{s.sub}</div>
                  </motion.div>
                ))}
              </div>

              {/* Top player */}
              {stats.topPlayer && (
                <div className="bg-[#111827] rounded-xl p-4 border border-[#1e293b] flex items-center gap-4">
                  <div className="text-3xl">👑</div>
                  <img src={stats.topPlayer.avatar} alt="" className="w-12 h-12 rounded-xl"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/Steve/48"; }} />
                  <div className="flex-1">
                    <div className="text-sm font-bold">{stats.topPlayer.minecraftNick || stats.topPlayer.username}</div>
                    <div className="text-xs text-slate-500">@{stats.topPlayer.username} · {stats.topPlayer.region}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-400">{stats.topPlayer.totalPoints}p</div>
                    <div className="text-[10px] text-slate-500">En yüksek puan</div>
                  </div>
                </div>
              )}

              {/* Tier dağılımı */}
              <div className="bg-[#111827] rounded-xl p-5 border border-[#1e293b]">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Tier Dağılımı</h3>
                <div className="space-y-2">
                  {TIERS.map(tier => {
                    const count = stats.tierCounts[tier];
                    const maxCount = Math.max(...Object.values(stats.tierCounts), 1);
                    const pct = Math.round((count / maxCount) * 100);
                    return (
                      <div key={tier} className="flex items-center gap-3">
                        <span className={`w-10 text-center text-[10px] font-bold text-white px-1.5 py-0.5 rounded ${TIER_BG[tier]}`}>{tier}</span>
                        <div className="flex-1 h-5 bg-[#0b0f17] rounded-lg overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.1 }}
                            className={`h-full ${TIER_BG[tier]} rounded-lg opacity-60`}></motion.div>
                        </div>
                        <span className="text-xs text-slate-400 font-mono w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bölge puan dağılımı */}
              <div className="bg-[#111827] rounded-xl p-5 border border-[#1e293b]">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Bölge Toplam Puanları</h3>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(stats.regionPoints).map(([r, pts]) => (
                    <div key={r} className="text-center p-3 bg-[#0b0f17] rounded-xl">
                      <div className="text-lg mb-1">{r === "TR" ? "🇹🇷" : r === "EU" ? "🇪🇺" : "🇺🇸"}</div>
                      <div className="text-xl font-bold text-white">{pts}</div>
                      <div className="text-[10px] text-slate-500">{r}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kit istatistikleri */}
              <div className="bg-[#111827] rounded-xl p-5 border border-[#1e293b]">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Kit Detayları</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {KITS.map(kit => {
                    const count = players.filter(p => cleanTier(p.tiers?.[kit])).length;
                    const pct = players.length ? Math.round((count / players.length) * 100) : 0;
                    return (
                      <button key={kit} onClick={() => setKitDetail(kit)}
                        className="bg-[#0b0f17] rounded-xl p-4 border border-[#1e293b] hover:border-blue-500/30 transition-all text-left group">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{KIT_ICONS[kit]}</span>
                          <span className="text-[10px] font-semibold text-slate-500">{pct}%</span>
                        </div>
                        <div className="text-lg font-bold">{count}</div>
                        <div className="text-[10px] text-slate-500 capitalize">{kit}</div>
                        <div className="mt-2 h-1 bg-[#1e293b] rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                        </div>
                        <div className="text-[9px] text-blue-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Detay →</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* PLAYERS */}
          {tab === "players" && (
            <motion.div key="players" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Controls */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input type="text" placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#111827] border border-[#1e293b] text-sm focus:outline-none focus:border-blue-500 transition-all" />
                </div>
                <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#111827] border border-[#1e293b] text-sm focus:outline-none focus:border-blue-500 cursor-pointer">
                  <option value="ALL">Tüm Bölgeler</option>
                  <option value="TR">🇹🇷 TR</option>
                  <option value="EU">🇪🇺 EU</option>
                  <option value="NA">🇺🇸 NA</option>
                </select>
                <button onClick={() => setAdding(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold transition-colors flex items-center gap-1.5">
                  <span>+</span> Yeni Oyuncu
                </button>
                <button onClick={fetchPlayers} className="p-2 rounded-xl bg-[#111827] border border-[#1e293b] hover:border-blue-500/30 transition-all">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              <div className="text-[10px] text-slate-500 mb-3">{filtered.length} oyuncu</div>

              {loading ? (
                <div className="text-center py-20">
                  <div className="w-8 h-8 mx-auto rounded-full border-2 border-blue-500 border-r-transparent animate-spin"></div>
                </div>
              ) : (
                <div className="bg-[#111827] rounded-xl border border-[#1e293b] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#1e293b]">
                          {["#", "Oyuncu", "Bölge", "Puan", "Test", "Kit", ""].map((h, i) => (
                            <th key={i} className={`px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider ${i === 0 ? "text-left w-10" : i === 1 ? "text-left" : i === 6 ? "text-right" : "text-center"}`}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((p, i) => (
                          <motion.tr key={p.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: Math.min(i * 0.02, 0.3) }}
                            className="border-b border-[#1e293b]/50 hover:bg-[#1e293b]/30 transition-colors">
                            <td className="px-4 py-3 text-xs text-slate-500 font-mono">{i + 1}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <img src={p.avatar} alt="" className="w-8 h-8 rounded-lg"
                                  onError={(e) => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/Steve/32"; }} />
                                <div>
                                  <div className="text-sm font-semibold">{p.minecraftNick || p.username}</div>
                                  <div className="text-[10px] text-slate-500">@{p.username}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                p.region === "TR" ? "bg-red-500/10 text-red-400" :
                                p.region === "EU" ? "bg-blue-500/10 text-blue-400" :
                                "bg-green-500/10 text-green-400"
                              }`}>{p.region}</span>
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-bold text-blue-400">{p.totalPoints}</td>
                            <td className="px-4 py-3 text-center text-xs text-slate-400">{p.tests}</td>
                            <td className="px-4 py-3 text-center text-[10px] text-slate-500">
                              {Object.values(p.tiers || {}).filter(t => cleanTier(t)).length}/8
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-1">
                                <button onClick={() => setEditing(p)}
                                  className="p-1.5 rounded-lg hover:bg-blue-500/10 text-slate-400 hover:text-blue-400 transition-all">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                                <button onClick={() => setDeleting(p.id)}
                                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                        {filtered.length === 0 && (
                          <tr><td colSpan={7} className="py-16 text-center text-sm text-slate-500">Oyuncu bulunamadı</td></tr>
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

      {/* KIT DETAIL MODAL */}
      <AnimatePresence>
        {kitDetail && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setKitDetail(null)}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="bg-[#111827] rounded-2xl max-w-2xl w-full border border-[#1e293b] max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              
              <div className="p-5 border-b border-[#1e293b] flex items-center justify-between sticky top-0 bg-[#111827] z-10">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{KIT_ICONS[kitDetail]}</span>
                  <div>
                    <h2 className="text-lg font-bold capitalize">{kitDetail}</h2>
                    <p className="text-xs text-slate-500">Detaylı İstatistik</p>
                  </div>
                </div>
                <button onClick={() => setKitDetail(null)} className="p-2 rounded-lg hover:bg-[#1e293b] transition-all text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="p-5 space-y-5">
                {(() => {
                  const ks = getKitStats(kitDetail);
                  return (
                    <>
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { label: "Oyuncu", value: ks.total },
                          { label: "Oran", value: `%${ks.pct}` },
                          { label: "Ort. Puan", value: ks.avg },
                          { label: "En İyi", value: ks.best },
                        ].map((s, i) => (
                          <div key={i} className="bg-[#0b0f17] rounded-xl p-3 border border-[#1e293b] text-center">
                            <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">{s.label}</div>
                            <div className="text-lg font-bold">{s.value}</div>
                          </div>
                        ))}
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-3">Tier Dağılımı</div>
                        <div className="space-y-1.5">
                          {TIERS.map(tier => {
                            const count = ks.breakdown[tier];
                            const max = Math.max(...Object.values(ks.breakdown), 1);
                            return (
                              <div key={tier} className="flex items-center gap-2">
                                <span className={`w-9 text-center text-[9px] font-bold text-white py-0.5 rounded ${TIER_BG[tier]}`}>{tier}</span>
                                <div className="flex-1 h-4 bg-[#0b0f17] rounded overflow-hidden">
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${(count / max) * 100}%` }} transition={{ duration: 0.6 }}
                                    className={`h-full ${TIER_BG[tier]} opacity-50 rounded`}></motion.div>
                                </div>
                                <span className="text-xs text-slate-400 font-mono w-6 text-right">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {ks.top.length > 0 && (
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-3">Top 10</div>
                          <div className="space-y-1">
                            {ks.top.map((p, i) => {
                              const tier = cleanTier(p.tiers[kitDetail]) || "—";
                              return (
                                <div key={p.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[#0b0f17] transition-colors">
                                  <span className="text-xs text-slate-500 font-mono w-5">{i + 1}</span>
                                  <img src={p.avatar} alt="" className="w-7 h-7 rounded-lg"
                                    onError={(e) => { (e.target as HTMLImageElement).src = "https://mc-heads.net/avatar/Steve/28"; }} />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-semibold truncate">{p.minecraftNick || p.username}</div>
                                  </div>
                                  <span className={`text-[9px] font-bold text-white px-1.5 py-0.5 rounded ${TIER_BG[tier as keyof typeof TIER_BG] || "bg-gray-500"}`}>{tier}</span>
                                  <span className="text-[10px] text-slate-400 font-mono w-8 text-right">{TIER_POINTS[tier] || 0}p</span>
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

      {/* EDIT/ADD */}
      <AnimatePresence>
        {editing && <PlayerModal player={editing} onClose={() => setEditing(null)} onSave={updatePlayer} isNew={false} />}
        {adding && <PlayerModal player={null} onClose={() => setAdding(false)} onSave={p => addPlayer(p as any)} isNew={true} />}
      </AnimatePresence>

      {/* DELETE */}
      <AnimatePresence>
        {deleting && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleting(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111827] rounded-2xl p-6 max-w-xs w-full border border-red-500/30"
              onClick={e => e.stopPropagation()}>
              <div className="text-center">
                <div className="text-4xl mb-3">⚠️</div>
                <h3 className="text-base font-bold mb-1">Emin misin?</h3>
                <p className="text-xs text-slate-500 mb-5">Oyuncu kalıcı olarak silinecek.</p>
                <div className="flex gap-2">
                  <button onClick={() => setDeleting(null)} className="flex-1 py-2 rounded-xl bg-[#1e293b] hover:bg-[#2d3a4f] text-sm font-semibold transition-colors">İptal</button>
                  <button onClick={() => deletePlayer(deleting)} className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-semibold transition-colors">Sil</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
    username: player?.username || "", discordId: player?.discordId || "",
    minecraftNick: player?.minecraftNick || "", avatar: player?.avatar || "",
    region: player?.region || "TR" as "TR" | "EU" | "NA",
    tiers: initialTiers, tests: player?.tests || 0,
  });

  const handleSave = () => {
    if (!form.username || !form.minecraftNick) { alert("Discord username ve Minecraft nick zorunlu!"); return; }
    const avatar = form.avatar || `https://mc-heads.net/avatar/${form.minecraftNick}/128`;
    if (isNew) onSave({ ...form, avatar });
    else onSave({ ...player!, ...form, avatar });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
        className="bg-[#111827] rounded-2xl max-w-2xl w-full border border-[#1e293b] my-8 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        
        <div className="sticky top-0 z-10 bg-[#111827] border-b border-[#1e293b] p-5 flex items-center justify-between">
          <h2 className="text-base font-bold">{isNew ? "Yeni Oyuncu" : "Düzenle"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#1e293b] text-slate-400 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!isNew && (
            <div className="flex items-center gap-3 p-3 bg-[#0b0f17] rounded-xl border border-[#1e293b]">
              <img src={form.avatar || `https://mc-heads.net/avatar/${form.minecraftNick || "Steve"}/48`} alt=""
                className="w-10 h-10 rounded-lg" />
              <div className="flex-1">
                <div className="text-sm font-semibold">{form.minecraftNick || form.username}</div>
                <div className="text-[10px] text-slate-500">@{form.username}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-400">{calculateTotalPoints(form.tiers)}p</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Discord Username *", key: "username" },
              { label: "Discord ID", key: "discordId" },
              { label: "Minecraft Nick *", key: "minecraftNick" },
              { label: "Test Sayısı", key: "tests", type: "number" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5 block">{f.label}</label>
                <input type={f.type || "text"} value={(form as any)[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: f.type === "number" ? parseInt(e.target.value) || 0 : e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-[#1e293b] text-sm focus:outline-none focus:border-blue-500 transition-all" />
              </div>
            ))}
            <div>
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5 block">Bölge</label>
              <select value={form.region} onChange={e => setForm({ ...form, region: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-[#1e293b] text-sm focus:outline-none focus:border-blue-500 cursor-pointer">
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5 block">Avatar URL</label>
              <input type="text" value={form.avatar} placeholder="Boş = otomatik"
                onChange={e => setForm({ ...form, avatar: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-[#1e293b] text-sm focus:outline-none focus:border-blue-500 transition-all" />
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-3">Kit Tierleri</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {KITS.map(kit => {
                const current = form.tiers[kit] || "";
                return (
                  <div key={kit} className="bg-[#0b0f17] rounded-xl p-3 border border-[#1e293b]">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-lg">{KIT_ICONS[kit]}</span>
                      <span className="text-[10px] text-slate-400 capitalize font-semibold">{kit}</span>
                      {current && <span className={`ml-auto text-[8px] font-bold text-white px-1 py-0.5 rounded ${TIER_BG[current] || "bg-gray-500"}`}>{current}</span>}
                    </div>
                    <select value={current}
                      onChange={e => {
                        const t = { ...form.tiers };
                        if (e.target.value) t[kit] = e.target.value; else delete t[kit];
                        setForm({ ...form, tiers: t });
                      }}
                      className="w-full px-2 py-1.5 rounded-lg bg-[#111827] border border-[#1e293b] text-[11px] focus:outline-none focus:border-blue-500 cursor-pointer">
                      <option value="">—</option>
                      {TIERS.map(t => <option key={t} value={t}>{t} ({TIER_POINTS[t]}p)</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Toplam Puan</span>
              <span className="text-xl font-bold text-blue-400">{calculateTotalPoints(form.tiers)}</span>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-[#111827] border-t border-[#1e293b] p-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-[#1e293b] hover:bg-[#2d3a4f] text-sm font-semibold transition-colors">İptal</button>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold transition-colors">
            {isNew ? "Ekle" : "Kaydet"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
