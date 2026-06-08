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

// 🔐 ADMIN ŞİFRESİ
const ADMIN_PASSWORD = "Abyssalocean20266154";

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

const TIER_COLORS: Record<string, string> = {
  HT1: "from-amber-400 to-yellow-600", LT1: "from-emerald-500 to-emerald-700",
  HT2: "from-slate-300 to-slate-500", LT2: "from-cyan-500 to-cyan-700",
  HT3: "from-orange-600 to-amber-700", LT3: "from-indigo-500 to-indigo-700",
  HT4: "from-blue-500 to-blue-700", LT4: "from-pink-500 to-pink-700",
  HT5: "from-purple-500 to-purple-700", LT5: "from-gray-500 to-gray-700",
};

const calculateTotalPoints = (tiers: Record<string, string>): number => {
  if (!tiers) return 0;
  let total = 0;
  for (const tier of Object.values(tiers)) {
    total += TIER_POINTS[tier] || 0;
  }
  return total;
};

// 🛡️ GÜVENLİK HOOK'U
const useAdminSecurity = () => {
  useEffect(() => {
    // Sağ tık engelle
    const handleContextMenu = (e: MouseEvent) => { e.preventDefault(); return false; };
    
    // Klavye kısayolları
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12" || e.keyCode === 123) { e.preventDefault(); return false; }
      // Ctrl+Shift+I/J/C/K
      if (e.ctrlKey && e.shiftKey && ["I","i","J","j","C","c","K","k"].includes(e.key)) {
        e.preventDefault(); return false;
      }
      // Ctrl+U (source)
      if (e.ctrlKey && (e.key === "U" || e.key === "u")) { e.preventDefault(); return false; }
      // Ctrl+S (save)
      if (e.ctrlKey && (e.key === "S" || e.key === "s")) { e.preventDefault(); return false; }
      // Ctrl+P (print)
      if (e.ctrlKey && (e.key === "P" || e.key === "p")) { e.preventDefault(); return false; }
    };

    // DevTools detection
    let devtoolsOpen = false;
    const threshold = 160;
    const detectDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      if (widthThreshold || heightThreshold) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          sessionStorage.removeItem("admin_auth");
          document.body.innerHTML = `
            <div style="position:fixed;inset:0;background:#0a0e14;color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:999999;font-family:system-ui,sans-serif;text-align:center;padding:20px;">
              <div style="font-size:100px;margin-bottom:20px;">🛡️</div>
              <h1 style="font-size:36px;margin:0 0 10px 0;background:linear-gradient(90deg,#ef4444,#dc2626);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:900;">GÜVENLİK İHLALİ</h1>
              <p style="color:rgba(255,255,255,0.7);margin:10px 0;max-width:500px;font-size:16px;">🚫 Geliştirici araçları (DevTools) tespit edildi!</p>
              <p style="color:rgba(255,255,255,0.5);margin:5px 0;max-width:500px;">Admin oturumunuz kapatıldı. DevTools'u kapatın ve tekrar giriş yapın.</p>
              <button onclick="window.location.href='/admin'" style="margin-top:30px;padding:14px 32px;background:linear-gradient(90deg,#ef4444,#dc2626);border:none;border-radius:12px;color:white;font-weight:bold;font-size:16px;cursor:pointer;box-shadow:0 10px 30px rgba(239,68,68,0.3);">🔄 Tekrar Giriş Yap</button>
            </div>`;
        }
      } else { devtoolsOpen = false; }
    };

    // Console uyarısı
    console.clear();
    console.log("%c🛑 DUR!", "color: red; font-size: 80px; font-weight: bold; text-shadow: 3px 3px 6px rgba(0,0,0,0.5);");
    console.log("%c⚠️ ADMIN PANEL - GÜVENLİK UYARISI", "color: orange; font-size: 28px; font-weight: bold;");
    console.log("%cBu bir geliştirici alanıdır! Buraya yapıştırdığın herhangi bir kod sistemi tehlikeye atabilir!", "color: red; font-size: 18px;");
    console.log("%c🔐 Yetkisiz erişim tespit edildi - Log kaydı tutuluyor", "color: yellow; font-size: 14px;");

    // Drag engelle
    const handleDragStart = (e: DragEvent) => {
      if ((e.target as HTMLElement).tagName === "IMG") e.preventDefault();
    };

    // Text seçim engelle (kod kopyalama)
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("selectstart", handleSelectStart);
    const detectInterval = setInterval(detectDevTools, 1000);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("selectstart", handleSelectStart);
      clearInterval(detectInterval);
    };
  }, []);
};

export default function AdminPanel() {
  useAdminSecurity();

  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockedOut, setLockedOut] = useState(false);
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRegion, setFilterRegion] = useState<string>("ALL");
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState<"dashboard" | "players" | "stats" | "settings">("dashboard");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockedOut) return;
    
    if (passwordInput === ADMIN_PASSWORD) {
      setAuthenticated(true);
      sessionStorage.setItem("admin_auth", "true");
      sessionStorage.setItem("admin_login_time", Date.now().toString());
      setPasswordError(false);
      setLoginAttempts(0);
    } else {
      setPasswordError(true);
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      if (newAttempts >= 5) {
        setLockedOut(true);
        setTimeout(() => {
          setLockedOut(false);
          setLoginAttempts(0);
        }, 30000);
      }
      setTimeout(() => setPasswordError(false), 2000);
    }
  };

  useEffect(() => {
    const auth = sessionStorage.getItem("admin_auth");
    const loginTime = sessionStorage.getItem("admin_login_time");
    if (auth === "true" && loginTime) {
      // 1 saat oturum süresi
      if (Date.now() - parseInt(loginTime) < 3600000) {
        setAuthenticated(true);
      } else {
        sessionStorage.removeItem("admin_auth");
        sessionStorage.removeItem("admin_login_time");
      }
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("admin_auth");
    sessionStorage.removeItem("admin_login_time");
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
    avgPoints: players.length ? Math.round(players.reduce((s, p) => s + p.totalPoints, 0) / players.length) : 0,
    topPlayer: players.length ? [...players].sort((a,b) => b.totalPoints - a.totalPoints)[0] : null,
    ht1Count: players.reduce((sum, p) => sum + Object.values(p.tiers || {}).filter(t => t === "HT1").length, 0),
  }), [players]);

  // 🔐 LOGIN SCREEN
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" 
        style={{ background: "linear-gradient(135deg, #0a0e14 0%, #1a1f2e 100%)" }}>
        
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <motion.div key={i}
              initial={{ x: Math.random() * window.innerWidth, y: window.innerHeight + 100, opacity: 0 }}
              animate={{ y: -100, opacity: [0, 0.5, 0] }}
              transition={{ duration: 10 + Math.random() * 10, repeat: Infinity, delay: Math.random() * 5, ease: "linear" }}
              className="absolute w-2 h-2 rounded-full"
              style={{ background: i % 2 === 0 ? "#22d3ee" : "#a855f7", filter: "blur(1px)" }}
            />
          ))}
        </div>

        {/* Glow effects */}
        <div className="absolute top-20 left-20 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl"></div>

        <motion.div initial={{ scale: 0.8, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} 
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="relative w-full max-w-md mx-4 p-1 rounded-3xl"
          style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.5), rgba(168,85,247,0.5))" }}>
          <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
            <motion.div initial={{ y: -20 }} animate={{ y: [-20, 0, -20] }} transition={{ duration: 3, repeat: Infinity }}
              className="text-center mb-6">
              <div className="text-7xl mb-4 inline-block" style={{ filter: "drop-shadow(0 0 20px rgba(34,211,238,0.5))" }}>
                🛡️
              </div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-center mb-8">
              <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                ADMIN PANEL
              </h1>
              <p className="text-slate-400 text-sm tracking-widest font-bold">ABYSSAL OCEAN</p>
              <div className="flex items-center justify-center gap-1 mt-3">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                <span className="text-xs text-green-400 font-bold">SECURE CONNECTION</span>
              </div>
            </motion.div>

            <form onSubmit={handleLogin} className="space-y-4">
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
                <label className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-2 flex items-center gap-2">
                  <span>🔑</span> Yönetici Şifresi
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••••••"
                  autoFocus
                  disabled={lockedOut}
                  className={`w-full px-4 py-3.5 rounded-xl bg-slate-800/80 border-2 text-white text-center tracking-wider font-mono focus:outline-none transition-all ${
                    passwordError ? "border-red-500 animate-shake" : 
                    lockedOut ? "border-red-500 opacity-50" :
                    "border-slate-700 focus:border-cyan-500 focus:shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                  }`}
                />
                {passwordError && (
                  <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-xs mt-2 font-bold flex items-center gap-1">
                    ❌ Yanlış şifre! ({5 - loginAttempts} deneme kaldı)
                  </motion.p>
                )}
                {lockedOut && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-red-400 text-xs mt-2 font-bold text-center">
                    🔒 Çok fazla yanlış deneme! 30 saniye bekleyin...
                  </motion.p>
                )}
              </motion.div>

              <motion.button type="submit" disabled={lockedOut}
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
                whileHover={!lockedOut ? { scale: 1.02 } : {}} whileTap={!lockedOut ? { scale: 0.98 } : {}}
                className={`w-full py-3.5 rounded-xl font-black text-base transition-all shadow-lg flex items-center justify-center gap-2 ${
                  lockedOut ? "bg-slate-700 cursor-not-allowed text-slate-500" :
                  "bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white hover:shadow-[0_0_30px_rgba(34,211,238,0.5)]"
                }`}>
                {lockedOut ? "🔒 KİLİTLİ" : "🔓 GİRİŞ YAP"}
              </motion.button>
            </form>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              className="mt-6 pt-6 border-t border-slate-700/50 text-center space-y-2">
              <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500">
                <span className="flex items-center gap-1">🛡️ F12 Korumalı</span>
                <span>•</span>
                <span className="flex items-center gap-1">🔐 SSL Aktif</span>
                <span>•</span>
                <span className="flex items-center gap-1">⏱️ 1h Oturum</span>
              </div>
              <a href="/" className="inline-block text-xs text-slate-400 hover:text-cyan-400 transition-colors mt-2">
                ← Ana Siteye Dön
              </a>
            </motion.div>
          </div>
        </motion.div>

        <style>{`
          @keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }
          .animate-shake { animation: shake 0.4s ease-in-out; }
        `}</style>
      </div>
    );
  }

  // 🎛️ ADMIN PANEL UI
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊", color: "from-cyan-500 to-blue-500" },
    { id: "players", label: "Oyuncular", icon: "👥", color: "from-purple-500 to-pink-500" },
    { id: "stats", label: "İstatistikler", icon: "📈", color: "from-green-500 to-emerald-500" },
    { id: "settings", label: "Ayarlar", icon: "⚙️", color: "from-orange-500 to-red-500" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex">
      
      {/* MOBILE OVERLAY */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: sidebarOpen ? 280 : 80,
          x: mobileSidebarOpen ? 0 : (window.innerWidth < 1024 ? -280 : 0)
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed lg:sticky top-0 left-0 h-screen bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 z-50 flex flex-col overflow-hidden">
        
        {/* Logo */}
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {sidebarOpen ? (
              <motion.div key="full" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3">
                <div className="text-3xl">🛡️</div>
                <div>
                  <h1 className="font-black text-sm bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    ABYSSAL ADMIN
                  </h1>
                  <p className="text-[9px] text-slate-500 tracking-widest font-bold">CONTROL PANEL</p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="mini" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
                className="text-3xl mx-auto">🛡️</motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
          {menuItems.map((item, i) => (
            <motion.button key={item.id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setActivePage(item.id as any); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                activePage === item.id 
                  ? `bg-gradient-to-r ${item.color} text-white shadow-lg` 
                  : "hover:bg-slate-800 text-slate-400"
              }`}>
              <span className="text-2xl flex-shrink-0">{item.icon}</span>
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} 
                    exit={{ opacity: 0, width: 0 }}
                    className="font-bold text-sm whitespace-nowrap overflow-hidden">
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {activePage === item.id && sidebarOpen && (
                <motion.span layoutId="indicator" className="ml-auto">✨</motion.span>
              )}
            </motion.button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-700/50 space-y-2">
          <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            href="/" className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all">
            <span className="text-2xl">🏠</span>
            {sidebarOpen && <span className="font-bold text-sm">Ana Site</span>}
          </motion.a>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all">
            <span className="text-2xl">🚪</span>
            {sidebarOpen && <span className="font-bold text-sm">Çıkış</span>}
          </motion.button>
        </div>
      </motion.aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP BAR */}
        <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* HAMBURGER */}
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => {
                if (window.innerWidth < 1024) setMobileSidebarOpen(!mobileSidebarOpen);
                else setSidebarOpen(!sidebarOpen);
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all">
              <motion.div animate={{ rotate: (sidebarOpen || mobileSidebarOpen) ? 0 : 180 }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d={sidebarOpen ? "M11 19l-7-7 7-7m8 14l-7-7 7-7" : "M13 5l7 7-7 7M5 5l7 7-7 7"} />
                </svg>
              </motion.div>
            </motion.button>
            <div>
              <h2 className="font-black text-lg capitalize">{activePage}</h2>
              <p className="text-xs text-slate-400">Hoş geldin, Admin 👋</p>
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
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={fetchPlayers}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all" title="Yenile">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </motion.button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <AnimatePresence mode="wait">
            {/* DASHBOARD */}
            {activePage === "dashboard" && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Toplam Oyuncu", value: stats.total, color: "from-cyan-500 to-blue-500", emoji: "👥" },
                    { label: "Türkiye", value: stats.tr, color: "from-red-500 to-red-600", emoji: "🇹🇷" },
                    { label: "Avrupa", value: stats.eu, color: "from-blue-500 to-blue-600", emoji: "🇪🇺" },
                    { label: "Amerika", value: stats.na, color: "from-green-500 to-green-600", emoji: "🇺🇸" },
                  ].map((s, i) => (
                    <motion.div key={i} 
                      initial={{ opacity: 0, scale: 0.8, y: 30 }} 
                      animate={{ opacity: 1, scale: 1, y: 0 }} 
                      transition={{ delay: i * 0.1, type: "spring" }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="relative overflow-hidden bg-slate-800 rounded-2xl p-5 border border-slate-700 group cursor-pointer">
                      <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                      <div className="relative">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{s.label}</span>
                          <span className="text-3xl">{s.emoji}</span>
                        </div>
                        <div className={`text-4xl font-black bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>
                          {s.value}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                    className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Toplam Test</span>
                      <span className="text-3xl">🎯</span>
                    </div>
                    <div className="text-4xl font-black bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                      {stats.totalTests}
                    </div>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                    className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Ortalama Puan</span>
                      <span className="text-3xl">⭐</span>
                    </div>
                    <div className="text-4xl font-black bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                      {stats.avgPoints}
                    </div>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
                    className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">HT1 Sayısı</span>
                      <span className="text-3xl">👑</span>
                    </div>
                    <div className="text-4xl font-black bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent">
                      {stats.ht1Count}
                    </div>
                  </motion.div>
                </div>

                {stats.topPlayer && (
                  <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                    className="bg-gradient-to-br from-amber-500/10 to-yellow-600/10 rounded-2xl p-6 border border-amber-500/30">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-black flex items-center gap-2">🏆 Top Oyuncu</h3>
                      <span className="text-xs text-amber-400 font-bold">#1</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <img src={stats.topPlayer.avatar} alt="" className="w-20 h-20 rounded-2xl ring-4 ring-amber-500/30"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/Steve/80`; }} />
                      <div className="flex-1">
                        <h4 className="text-2xl font-black">{stats.topPlayer.minecraftNick || stats.topPlayer.username}</h4>
                        <p className="text-sm text-slate-400">@{stats.topPlayer.username}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 text-xs font-black">
                            {stats.topPlayer.totalPoints} PUAN
                          </span>
                          <span className="px-2 py-1 rounded bg-slate-700 text-xs font-bold">
                            {stats.topPlayer.region}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* PLAYERS */}
            {activePage === "players" && (
              <motion.div key="players" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 mb-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <input type="text" placeholder="🔎 Ara: Discord, nick..." value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-500 transition-all" />
                    <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-500 cursor-pointer">
                      <option value="ALL">🌍 Tüm Bölgeler</option>
                      <option value="TR">🇹🇷 Türkiye</option>
                      <option value="EU">🇪🇺 Avrupa</option>
                      <option value="NA">🇺🇸 Amerika</option>
                    </select>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setShowAddModal(true)}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-sm shadow-lg flex items-center gap-2">
                      ➕ Yeni Oyuncu
                    </motion.button>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-20">
                    <div className="w-16 h-16 mx-auto rounded-full border-4 border-cyan-500 border-r-transparent animate-spin"></div>
                    <p className="text-slate-400 mt-4 font-bold">Yükleniyor...</p>
                  </div>
                ) : (
                  <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-900/80">
                          <tr>
                            <th className="text-left px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">#</th>
                            <th className="text-left px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">Oyuncu</th>
                            <th className="text-center px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">Bölge</th>
                            <th className="text-center px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">Puan</th>
                            <th className="text-center px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">Test</th>
                            <th className="text-center px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">Tier</th>
                            <th className="text-right px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">İşlem</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPlayers.map((player, i) => (
                            <motion.tr key={player.id} 
                              initial={{ opacity: 0, x: -20 }} 
                              animate={{ opacity: 1, x: 0 }} 
                              transition={{ delay: Math.min(i * 0.03, 0.5) }}
                              className="border-t border-slate-700 hover:bg-slate-700/30 transition-colors">
                              <td className="px-4 py-3 font-black text-slate-400">{i + 1}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <img src={player.avatar} alt="" className="w-10 h-10 rounded-xl ring-2 ring-slate-700"
                                    onError={(e) => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/Steve/40`; }} />
                                  <div>
                                    <div className="font-bold text-sm">{player.minecraftNick || player.username}</div>
                                    <div className="text-xs text-slate-400">@{player.username}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black text-white shadow ${
                                  player.region === "TR" ? "bg-gradient-to-br from-red-500 to-red-600" :
                                  player.region === "EU" ? "bg-gradient-to-br from-blue-500 to-blue-600" : 
                                  "bg-gradient-to-br from-green-500 to-green-600"
                                }`}>{player.region}</span>
                              </td>
                              <td className="px-4 py-3 text-center font-black text-cyan-400">{player.totalPoints}</td>
                              <td className="px-4 py-3 text-center text-slate-300 font-bold">{player.tests}</td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-xs font-bold text-slate-400">{Object.keys(player.tiers || {}).length}/8</span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    onClick={() => setEditingPlayer(player)}
                                    className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs font-bold transition-all">
                                    ✏️ Düzenle
                                  </motion.button>
                                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    onClick={() => setDeleteConfirm(player.id)}
                                    className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold transition-all">
                                    🗑️
                                  </motion.button>
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
              </motion.div>
            )}

            {/* STATS */}
            {activePage === "stats" && (
              <motion.div key="stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="space-y-4">
                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                  <h3 className="text-lg font-black mb-4 flex items-center gap-2">📊 Detaylı İstatistikler</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {TIERS.map((tier, i) => {
                      const count = players.reduce((sum, p) => 
                        sum + Object.values(p.tiers || {}).filter(t => t === tier).length, 0);
                      return (
                        <motion.div key={tier} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className={`p-4 rounded-xl bg-gradient-to-br ${TIER_COLORS[tier]} text-white text-center shadow-lg`}>
                          <div className="text-2xl font-black">{count}</div>
                          <div className="text-xs font-bold mt-1">{tier}</div>
                          <div className="text-[10px] opacity-80">{TIER_POINTS[tier]}p</div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                  <h3 className="text-lg font-black mb-4 flex items-center gap-2">🎯 Kit Dağılımı</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {KITS.map((kit, i) => {
                      const count = players.filter(p => p.tiers?.[kit]).length;
                      const percentage = players.length ? Math.round((count / players.length) * 100) : 0;
                      return (
                        <motion.div key={kit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">{KIT_ICONS[kit]}</span>
                            <span className="text-xs font-bold text-slate-400">{percentage}%</span>
                          </div>
                          <div className="text-2xl font-black">{count}</div>
                          <div className="text-xs text-slate-400 capitalize">{kit}</div>
                          <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ delay: i * 0.1, duration: 1 }}
                              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"></motion.div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* SETTINGS */}
            {activePage === "settings" && (
              <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="space-y-4">
                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                  <h3 className="text-lg font-black mb-4 flex items-center gap-2">🔐 Güvenlik Bilgileri</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl">
                      <span className="text-sm text-slate-400">F12 Koruması</span>
                      <span className="text-green-400 font-bold text-sm">✅ Aktif</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl">
                      <span className="text-sm text-slate-400">Sağ Tık Koruması</span>
                      <span className="text-green-400 font-bold text-sm">✅ Aktif</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl">
                      <span className="text-sm text-slate-400">DevTools Detector</span>
                      <span className="text-green-400 font-bold text-sm">✅ Aktif</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl">
                      <span className="text-sm text-slate-400">Oturum Süresi</span>
                      <span className="text-cyan-400 font-bold text-sm">⏱️ 1 Saat</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl">
                      <span className="text-sm text-slate-400">Max Login Deneme</span>
                      <span className="text-cyan-400 font-bold text-sm">🔢 5 Deneme</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-2xl p-6 border border-red-500/30">
                  <h3 className="text-lg font-black mb-4 flex items-center gap-2 text-red-400">⚠️ Tehlikeli Bölge</h3>
                  <p className="text-sm text-slate-400 mb-4">Bu işlemler geri alınamaz. Dikkatli ol!</p>
                  <button onClick={handleLogout}
                    className="px-5 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500 hover:text-white text-red-400 font-bold text-sm transition-all">
                    🚪 Oturumu Kapat
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

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
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full border-2 border-red-500 shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <div className="text-center">
                <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                  className="text-6xl mb-3">⚠️</motion.div>
                <h3 className="text-xl font-black mb-2">Emin misin?</h3>
                <p className="text-slate-400 text-sm mb-6">Bu oyuncu <span className="text-red-400 font-bold">kalıcı olarak</span> silinecek!</p>
                <div className="flex gap-2">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 font-bold text-sm">
                    İptal
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => deletePlayer(deleteConfirm)}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 font-bold text-sm shadow-lg">
                    🗑️ Sil
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        * { user-select: none; -webkit-user-select: none; }
        input, textarea, select { user-select: text !important; -webkit-user-select: text !important; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: rgba(15,23,42,0.5); }
        ::-webkit-scrollbar-thumb { background: rgba(34,211,238,0.3); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(34,211,238,0.5); }
      `}</style>
    </div>
  );
}

// 📝 PLAYER MODAL
function PlayerModal({ player, onClose, onSave, isNew }: {
  player: Player | null; onClose: () => void; onSave: (p: any) => void; isNew: boolean;
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
    if (isNew) onSave({ ...form, avatar });
    else onSave({ ...player!, ...form, avatar });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full border border-slate-700 max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black flex items-center gap-2">
            {isNew ? <>➕ Yeni Oyuncu</> : <>✏️ Düzenle</>}
          </h2>
          <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
            onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-700 hover:bg-red-500 transition-all flex items-center justify-center">
            ✕
          </motion.button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: "Discord Username", key: "username", required: true },
              { label: "Discord ID", key: "discordId" },
              { label: "Minecraft Nick", key: "minecraftNick", required: true },
              { label: "Test Sayısı", key: "tests", type: "number" },
              { label: "Avatar URL (boş = otomatik)", key: "avatar", full: true },
            ].map((field, i) => (
              <motion.div key={field.key} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className={field.full ? "md:col-span-2" : ""}>
                <label className="text-xs text-slate-400 font-bold mb-1 block">
                  {field.label} {field.required && <span className="text-red-400">*</span>}
                </label>
                <input type={field.type || "text"} value={(form as any)[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: field.type === "number" ? parseInt(e.target.value) || 0 : e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-500 transition-all" />
              </motion.div>
            ))}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
              <label className="text-xs text-slate-400 font-bold mb-1 block">Bölge</label>
              <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value as any })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-500 cursor-pointer">
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </motion.div>
          </div>

          <div>
            <h3 className="text-sm font-black mb-3 text-cyan-400 flex items-center gap-2">🎯 Kit Tierleri</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {KITS.map((kit, i) => (
                <motion.div key={kit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.03 }}
                  className="bg-slate-900 rounded-xl p-3 border border-slate-700">
                  <label className="text-xs text-slate-400 font-bold capitalize mb-1.5 flex items-center gap-1.5">
                    <span>{KIT_ICONS[kit]}</span> {kit}
                  </label>
                  <select value={form.tiers[kit] || ""}
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
                </motion.div>
              ))}
            </div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="mt-3 p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/30 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Toplam Puan:</span>
              <span className="text-2xl font-black text-cyan-400">{calculateTotalPoints(form.tiers)}</span>
            </motion.div>
          </div>
        </div>

        <div className="flex gap-2 mt-6 pt-6 border-t border-slate-700">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 font-bold text-sm">
            İptal
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 font-bold text-sm shadow-lg">
            💾 {isNew ? "Ekle" : "Kaydet"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
