import { useState, useEffect, useMemo, useRef } from "react";
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

type KitKey = "overall" | "vanilla" | "sword" | "axe" | "nethpot" | "pot" | "uhc" | "mace" | "smp";
type PageType = "home" | "rankings";
type SortType = "rank" | "points" | "name" | "tests";
type ThemeType = "dark" | "light";

const UPSTASH_URL = import.meta.env.VITE_UPSTASH_URL || 'https://adequate-loon-101577.upstash.io';
const UPSTASH_TOKEN = import.meta.env.VITE_UPSTASH_TOKEN || 'gQAAAAAAAYzJAAIgcDJhOWJiYWFhM2M2MmE0NThkYTJiMjZjZmM3ZDcxZWMwNA';

const KITS: Record<string, { ad: string; icon: JSX.Element; color: string; description: string }> = {
  vanilla: { 
    ad: "Vanilla", 
    icon: <img src="https://www.tierslist.net/tier_icons/vanilla.svg" width="30" height="30" alt="Vanilla" className="w-7 h-7" />, 
    color: "#fbbf24",
    description: "⚔️ Saf yetenek ve refleks! Vanilla PvP'nin zirvesi."
  },
  sword: { 
    ad: "Sword", 
    icon: <img src="https://www.tierslist.net/tier_icons/sword.svg" width="30" height="30" alt="Sword" className="w-7 h-7" />, 
    color: "#60a5fa",
    description: "🗡️ Kılıç ustalığı! Hızlı vuruşlar, mükemmel combo."
  },
  axe: { 
    ad: "Axe", 
    icon: <img src="https://www.tierslist.net/tier_icons/axe.svg" width="30" height="30" alt="Axe" className="w-7 h-7" />, 
    color: "#a78bfa",
    description: "🪓 Ağır darbe ustası! Yüksek hasar, kalkan kırma."
  },
  nethpot: { 
    ad: "NethOP", 
    icon: <img src="https://www.tierslist.net/tier_icons/nethop.svg" width="30" height="30" alt="NethOP" className="w-7 h-7" />, 
    color: "#ec4899",
    description: "🌌 Netherite zırh ve OP itemler! En güçlü ekipmanlar."
  },
  pot: { 
    ad: "Pot", 
    icon: <img src="https://www.tierslist.net/tier_icons/pot.svg" width="30" height="30" alt="Pot" className="w-7 h-7" />, 
    color: "#f43f5e",
    description: "🧪 Pot PvP ustası! Hız, güç ve anlık kararlar."
  },
  uhc: { 
    ad: "UHC", 
    icon: <img src="https://www.tierslist.net/tier_icons/uhc.svg" width="30" height="30" alt="UHC" className="w-7 h-7" />, 
    color: "#ef4444",
    description: "🍎 Hardcore PvP! Can yenilenmez, her vuruş önemli."
  },
  smp: { 
    ad: "SMP", 
    icon: <img src="https://www.tierslist.net/tier_icons/smp.svg" width="30" height="30" alt="SMP" className="w-7 h-7" />, 
    color: "#22c55e",
    description: "🌿 Survival PvP! Her şey serbest, strateji senin elinde."
  },
  mace: { 
    ad: "Mace", 
    icon: <img src="https://www.tierslist.net/tier_icons/mace.svg" width="30" height="30" alt="Mace" className="w-7 h-7" />, 
    color: "#eab308",
    description: "🔨 Ağır çekiç ustası! Ezici güç, yüksek hasar."
  },
};

const TIER_POINTS: Record<string, number> = {
  "HT1": 100, "HT2": 85, "HT3": 70, "HT4": 60, "HT5": 50,
  "LT1": 40, "LT2": 30, "LT3": 20, "LT4": 10, "LT5": 5,
  "Crystal HT1": 100, "Crystal HT2": 85, "Crystal HT3": 70, "Crystal HT4": 60, "Crystal HT5": 50,
  "Crystal LT1": 40, "Crystal LT2": 30, "Crystal LT3": 20, "Crystal LT4": 10, "Crystal LT5": 5
};

const TIER_COLORS: Record<string, string> = {
  HT1: "from-amber-400 to-yellow-600",
  HT2: "from-slate-300 to-slate-500",
  HT3: "from-orange-600 to-amber-700",
  HT4: "from-blue-500 to-blue-700",
  HT5: "from-purple-500 to-purple-700",
  LT1: "from-emerald-500 to-emerald-700",
  LT2: "from-cyan-500 to-cyan-700",
  LT3: "from-indigo-500 to-indigo-700",
  LT4: "from-pink-500 to-pink-700",
  LT5: "from-gray-500 to-gray-700",
  "Crystal HT1": "from-amber-400 to-yellow-600",
  "Crystal HT2": "from-slate-300 to-slate-500",
  "Crystal HT3": "from-orange-600 to-amber-700",
  "Crystal HT4": "from-blue-500 to-blue-700",
  "Crystal HT5": "from-purple-500 to-purple-700",
  "Crystal LT1": "from-emerald-500 to-emerald-700",
  "Crystal LT2": "from-cyan-500 to-cyan-700",
  "Crystal LT3": "from-indigo-500 to-indigo-700",
  "Crystal LT4": "from-pink-500 to-pink-700",
  "Crystal LT5": "from-gray-500 to-gray-700",
};

const KIT_ORDER: KitKey[] = ["overall", "vanilla", "sword", "axe", "nethpot", "pot", "uhc", "mace", "smp"];

const getTitle = (points: number): string => {
  if (points >= 300) return "🏆 Efsanevi Savaşçı";
  if (points >= 200) return "⚡ Usta Savaşçı";
  if (points >= 150) return "🌟 Tecrübeli Savaşçı";
  if (points >= 100) return "📈 Uzman Savaşçı";
  if (points >= 50) return "🌱 Acemi Savaşçı";
  return "🆕 Çaylak";
};

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 127.14 96.36" fill="currentColor">
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
  </svg>
);

const SunIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MoonIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

// Su baloncukları efekti
const Bubbles = () => {
  const bubbles = useMemo(() => Array.from({ length: 25 }, (_, i) => ({
    id: i,
    size: Math.random() * 30 + 8,
    left: Math.random() * 100,
    duration: Math.random() * 12 + 6,
    delay: Math.random() * 8,
    opacity: Math.random() * 0.25 + 0.05
  })), []);
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {bubbles.map(bubble => (
        <div
          key={bubble.id}
          className="absolute bottom-0 rounded-full bg-gradient-to-t from-cyan-400/20 to-blue-400/10"
          style={{
            width: bubble.size,
            height: bubble.size,
            left: `${bubble.left}%`,
            animation: `bubbleFloat ${bubble.duration}s linear infinite`,
            animationDelay: `${bubble.delay}s`,
            opacity: bubble.opacity,
          }}
        />
      ))}
      <style>{`
        @keyframes bubbleFloat {
          0% { transform: translateY(0) scale(0.3); opacity: 0; }
          20% { opacity: 0.3; }
          80% { opacity: 0.15; }
          100% { transform: translateY(-100vh) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

// Skeleton loading bileşeni
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4"><div className="w-10 h-10 bg-white/10 rounded-xl"></div></td>
    <td className="px-6 py-4"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-white/10 rounded-xl"></div><div><div className="w-32 h-4 bg-white/10 rounded mb-2"></div><div className="w-24 h-3 bg-white/10 rounded"></div></div></div></td>
    <td className="px-6 py-4"><div className="flex justify-end gap-1"><div className="w-9 h-9 bg-white/10 rounded-lg"></div><div className="w-9 h-9 bg-white/10 rounded-lg"></div><div className="w-9 h-9 bg-white/10 rounded-lg"></div></div></td>
  </tr>
);

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>("home");
  const [selectedKit, setSelectedKit] = useState<KitKey>("overall");
  const [searchQuery, setSearchQuery] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState<SortType>("rank");
  const [currentPageRank, setCurrentPageRank] = useState(1);
  const [theme, setTheme] = useState<ThemeType>("dark");
  const playersPerPage = 20;

  const fetchPlayers = async () => {
    try {
      const response = await fetch(`${UPSTASH_URL}/get/players`, {
        headers: {
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      let players: Player[] = [];
      if (data.result) {
        players = JSON.parse(data.result);
      }
      setPlayers(players);
      console.log('✅ Veriler çekildi:', players.length, 'oyuncu');
    } catch (e) {
      console.log('❌ Bağlantı hatası:', e);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 30000);
    return () => clearInterval(interval);
  }, []);

  const trPlayers = useMemo(() => {
    return players.filter(p => p.region === "TR");
  }, [players]);

  const filteredPlayers = useMemo(() => {
    let filtered = trPlayers;
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.minecraftNick?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    switch (sortType) {
      case "points":
        filtered.sort((a, b) => b.totalPoints - a.totalPoints);
        break;
      case "name":
        filtered.sort((a, b) => a.username.localeCompare(b.username));
        break;
      case "tests":
        filtered.sort((a, b) => b.tests - a.tests);
        break;
      default:
        filtered.sort((a, b) => a.rank - b.rank);
    }
    
    return filtered;
  }, [trPlayers, searchQuery, sortType]);

  const kitPlayers = useMemo(() => {
    if (selectedKit === "overall") return filteredPlayers;
    return [...filteredPlayers]
      .filter(p => p.tiers[selectedKit])
      .sort((a, b) => {
        const pa = TIER_POINTS[a.tiers[selectedKit]] || 0;
        const pb = TIER_POINTS[b.tiers[selectedKit]] || 0;
        return pb - pa;
      });
  }, [filteredPlayers, selectedKit]);

  const totalPages = Math.ceil(kitPlayers.length / playersPerPage);
  const currentPlayers = kitPlayers.slice(
    (currentPageRank - 1) * playersPerPage,
    currentPageRank * playersPerPage
  );

  const playersByTier = useMemo(() => {
    if (selectedKit === "overall") return null;
    const groups: Record<number, Player[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    
    kitPlayers.forEach(player => {
      const tier = player.tiers[selectedKit];
      if (!tier) return;
      
      let groupNum = 0;
      const tierUpper = tier.toUpperCase();
      
      if (tierUpper.includes("HT1") || tierUpper.includes("LT1") || tierUpper === "CRYSTAL HT1" || tierUpper === "CRYSTAL LT1") groupNum = 1;
      else if (tierUpper.includes("HT2") || tierUpper.includes("LT2") || tierUpper === "CRYSTAL HT2" || tierUpper === "CRYSTAL LT2") groupNum = 2;
      else if (tierUpper.includes("HT3") || tierUpper.includes("LT3") || tierUpper === "CRYSTAL HT3" || tierUpper === "CRYSTAL LT3") groupNum = 3;
      else if (tierUpper.includes("HT4") || tierUpper.includes("LT4") || tierUpper === "CRYSTAL HT4" || tierUpper === "CRYSTAL LT4") groupNum = 4;
      else if (tierUpper.includes("HT5") || tierUpper.includes("LT5") || tierUpper === "CRYSTAL HT5" || tierUpper === "CRYSTAL LT5") groupNum = 5;
      
      if (groupNum >= 1 && groupNum <= 5) {
        groups[groupNum].push(player);
      }
    });
    
    for (let i = 1; i <= 5; i++) {
      groups[i].sort((a, b) => {
        const pa = TIER_POINTS[a.tiers[selectedKit]] || 0;
        const pb = TIER_POINTS[b.tiers[selectedKit]] || 0;
        return pb - pa;
      });
    }
    
    return groups;
  }, [kitPlayers, selectedKit]);

  const recentPlayers = useMemo(() => {
    return [...players].sort((a, b) => b.tests - a.tests).slice(0, 5);
  }, [players]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Tema class'ları - GELİŞTİRİLMİŞ
  const themeClasses = theme === "dark" 
    ? "bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 text-white"
    : "bg-gradient-to-br from-sky-100 via-blue-100 to-cyan-100 text-gray-800";

  const headerTheme = theme === "dark"
    ? "bg-slate-900/80 backdrop-blur-xl border-white/10"
    : "bg-white/80 backdrop-blur-xl border-gray-200";

  const cardTheme = theme === "dark"
    ? "bg-slate-800/50 backdrop-blur-sm border-white/10"
    : "bg-white/70 backdrop-blur-sm border-gray-200 shadow-lg";

  const buttonTheme = theme === "dark"
    ? "bg-slate-800 text-white/60 hover:bg-slate-700 hover:text-white"
    : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900";

  const activeButtonTheme = theme === "dark"
    ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-400/50"
    : "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-400/50";

  const inputTheme = theme === "dark"
    ? "bg-slate-800 border-white/10 placeholder-white/30 focus:ring-2 focus:ring-cyan-500/50"
    : "bg-white border-gray-300 placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50";

  // Scroll reveal efekti için ref
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, { threshold: 0.1, rootMargin: "50px" });

    elementsRef.current.forEach(el => {
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [currentPage]);

  if (loading) {
    return (
      <div className={`min-h-screen ${themeClasses} flex items-center justify-center relative`}>
        <Bubbles />
        <div className="text-center z-10">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <div className="absolute inset-2 rounded-full bg-cyan-500/10 animate-pulse"></div>
          </div>
          <p className="text-cyan-400 font-medium tracking-wide">Okyanusun Derinliklerine Dalıyoruz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses} transition-all duration-500 relative`}>
      <Bubbles />
      
      <header className={`relative z-50 sticky top-0 backdrop-blur-xl ${headerTheme} border-b transition-all duration-300`}>
        <div className="max-w-[1400px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentPage("home")}>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl blur-md opacity-50 group-hover:opacity-100 transition-all"></div>
                  <img src="/logo.png" alt="Abyssal Ocean" className="relative h-12 w-12 rounded-xl object-cover" />
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight leading-none">
                    <span className="bg-gradient-to-r from-cyan-400 via-blue-300 to-cyan-500 bg-clip-text text-transparent">ABYSSAL OCEAN</span>
                  </h1>
                  <p className="text-[11px] text-white/40 font-semibold tracking-widest mt-0.5">TIER LIST</p>
                </div>
              </div>
              <nav className="hidden lg:flex items-center gap-1">
                <button onClick={() => setCurrentPage("home")} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all relative overflow-hidden group ${currentPage === "home" ? activeButtonTheme : buttonTheme}`}>
                  <span className="relative z-10">🏠 Home</span>
                  {currentPage !== "home" && <span className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform"></span>}
                </button>
                <button onClick={() => setCurrentPage("rankings")} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all relative overflow-hidden group ${currentPage === "rankings" ? activeButtonTheme : buttonTheme}`}>
                  <span className="relative z-10">🏆 Rankings</span>
                  {currentPage !== "rankings" && <span className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform"></span>}
                </button>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              {currentPage === "rankings" && (
                <div className="relative hidden md:block">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input type="text" placeholder="Oyuncu veya Nick ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-[260px] pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none transition-all ${inputTheme}`} />
                </div>
              )}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-slate-800 border border-white/10 hover:border-cyan-500/50 transition-all hover:scale-110"
              >
                {theme === "dark" ? (
                  <SunIcon className="w-5 h-5 text-yellow-400" />
                ) : (
                  <MoonIcon className="w-5 h-5 text-gray-700" />
                )}
              </button>
              <a href="https://discord.gg/cKFwKcfcWn" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-[#5865F2] hover:bg-[#4752c4] rounded-xl transition-all font-medium text-sm hover:scale-105">
                <DiscordIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Discord</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {currentPage === "home" && (
            <main className="relative z-10 max-w-[1400px] mx-auto px-4 py-12">
              <div className="text-center mb-20">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-semibold mb-6"
                >
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                  Türkiye'nin #1 PvP Platformu
                </motion.div>
                
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.05 }}
                  className="text-5xl md:text-8xl font-black mb-6 leading-tight"
                >
                  <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">ABYSSAL OCEAN</span>
                  <br />
                  <span className={theme === "dark" ? "text-white" : "text-gray-800"}>TIER LIST</span>
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10"
                >
                  Türkiye'nin en kapsamlı Minecraft PvP tier list platformu.<br />
                  8 farklı kit kategorisinde yeteneğini kanıtla!
                </motion.p>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                  className="flex flex-wrap items-center justify-center gap-4"
                >
                  <button 
                    onClick={() => setCurrentPage("rankings")} 
                    className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl font-bold text-lg transition-all shadow-lg shadow-cyan-500/30 hover:scale-105 hover:shadow-xl"
                  >
                    🏆 Sıralamaları Gör
                  </button>
                  <a 
                    href="https://discord.gg/cKFwKcfcWn" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="px-8 py-4 bg-[#5865F2] hover:bg-[#4752c4] rounded-xl font-bold text-lg transition-all flex items-center gap-2 shadow-lg shadow-[#5865F2]/30 hover:scale-105"
                  >
                    <DiscordIcon className="w-6 h-6" /> Sunucuya Katıl
                  </a>
                </motion.div>
              </div>

              {/* Son Eklenen Oyuncular */}
              <div className="mb-20">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center mb-8"
                >
                  <h2 className="text-3xl md:text-4xl font-black mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    ⚡ Son Test Olan Oyuncular
                  </h2>
                  <p className="text-white/50">En son test olan 5 oyuncu</p>
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {recentPlayers.map((player, i) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.25 + i * 0.05 }}
                      onClick={() => setSelectedPlayer(player)}
                      className={`${cardTheme} rounded-xl p-4 border cursor-pointer hover:border-cyan-500/50 transition-all group hover:scale-105 hover:shadow-xl`}
                    >
                      <div className="flex items-center gap-3">
                        <img src={player.avatar} alt="" className="w-12 h-12 rounded-lg group-hover:ring-2 ring-cyan-400 transition-all" onError={(e) => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/Steve/48`; }} />
                        <div>
                          <h3 className="font-bold group-hover:text-cyan-400 transition-colors">{player.username}</h3>
                          <p className="text-xs text-white/40">{player.totalPoints} puan • {player.tests} test</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Kitler */}
              <div className="mb-20">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center mb-12"
                >
                  <h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    Test Edebileceğin Kitler
                  </h2>
                  <p className="text-white/50 text-lg">8 farklı kit, kendi tarzını bul!</p>
                </motion.div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  {Object.entries(KITS).map(([key, kit], i) => (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.35 + i * 0.03 }}
                      className={`group relative overflow-hidden ${cardTheme} rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-xl`}
                      onClick={() => { setCurrentPage("rankings"); setSelectedKit(key as KitKey); }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 transition-all duration-300" />
                      <div className="relative">
                        <div className="mb-4 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                          {kit.icon}
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-center group-hover:text-cyan-400 transition-colors">
                          {kit.ad}
                        </h3>
                        <p className="text-xs text-white/40 text-center leading-relaxed">
                          {kit.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <motion.div                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="relative bg-gradient-to-br from-cyan-600/20 via-blue-600/20 to-purple-600/20 border border-white/10 rounded-3xl p-10 md:p-14 text-center overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
                <div className="relative">
                  <h2 className="text-4xl md:text-6xl font-black mb-4">Hazır mısın?</h2>
                  <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
                    Discord sunucumuza katıl, tier test başvurusu yap ve yeteneğini herkese kanıtla!
                  </p>
                  <a 
                    href="https://discord.gg/cKFwKcfcWn" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-3 px-10 py-5 bg-[#5865F2] hover:bg-[#4752c4] rounded-xl font-bold text-xl transition-all shadow-2xl shadow-[#5865F2]/40 hover:scale-105"
                  >
                    <DiscordIcon className="w-7 h-7" /> Hemen Katıl
                  </a>
                </div>
              </motion.div>

              {/* Footer - Düzenlendi */}
              <div className="mt-20 pt-8 border-t border-white/10 text-center">
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/40 mb-3">
                  <span>© 2025 Abyssal Ocean Net Ltd. Tüm hakları saklıdır.</span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/30">
                  <span>🌡️ 21°C</span>
                  <span>☀️ Güneşli</span>
                  <span>🔍 Ara</span>
                  <span>💧 %99 Nem</span>
                  <span>🕐 19:34</span>
                  <span>📅 25.05.2026</span>
                </div>
              </div>
            </main>
          )}

          {currentPage === "rankings" && (
            <main className="relative z-10 max-w-[1400px] mx-auto px-4 py-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/50">Sırala:</span>
                  <div className="flex gap-1">
                    {[
                      { key: "rank", label: "🏆 Sıra" },
                      { key: "points", label: "⭐ Puan" },
                      { key: "name", label: "📝 İsim" },
                      { key: "tests", label: "🎯 Test" }
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setSortType(opt.key as SortType)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 ${
                          sortType === opt.key
                            ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg"
                            : "bg-slate-800 text-white/60 hover:bg-slate-700"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-white/40">
                  Toplam {kitPlayers.length} oyuncu
                </div>
              </div>

              <div className="mb-6 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-2 min-w-max pb-2">
                  {KIT_ORDER.map((key, index) => {
                    const isOverall = key === "overall";
                    const kit = isOverall ? { ad: "Overall", icon: <span className="text-xl">🏆</span>, color: "#f59e0b" } : KITS[key];
                    const isActive = selectedKit === key;
                    return (
                      <motion.button
                        key={key}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        onClick={() => setSelectedKit(key)}
                        className={`relative px-5 py-3 rounded-2xl font-medium transition-all whitespace-nowrap flex items-center gap-2.5 ${
                          isActive ? activeButtonTheme : buttonTheme
                        } hover:scale-105`}
                      >
                        <div className="w-7 h-7 flex items-center justify-center">{kit.icon}</div>
                        <span className="text-sm font-semibold">{kit.ad}</span>
                        {isActive && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50"
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {selectedKit === "overall" ? (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className={`${cardTheme} rounded-[24px] border overflow-hidden`}>
                  {currentPlayers.length === 0 ? (
                    <div className="py-32 text-center">
                      <div className="text-6xl mb-4 opacity-20">🏆</div>
                      <h3 className="text-xl font-bold text-white/30 mb-2">Henüz Oyuncu Yok</h3>
                      <p className="text-white/20 text-sm max-w-md mx-auto">Bot ile test sonucu gönderdiğinizde oyuncular burada görünecek.</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-white/10 bg-slate-900/30">
                              <th className="text-left px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider w-16">#</th>
                              <th className="text-left px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Oyuncu</th>
                              <th className="text-right px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Tierler</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {loading ? (
                              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                            ) : (
                              currentPlayers.map((player, idx) => (
                                <motion.tr
                                  key={player.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.01 }}
                                  onClick={() => setSelectedPlayer(player)}
                                  className="group hover:bg-white/5 cursor-pointer transition-all hover:scale-[1.01]"
                                >
                                  <td className="px-6 py-4">
                                    {player.rank <= 3 ? (
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${player.rank === 1 ? "bg-gradient-to-br from-amber-400 to-yellow-600 text-black shadow-lg" : player.rank === 2 ? "bg-gradient-to-br from-slate-300 to-slate-500 text-black shadow-lg" : "bg-gradient-to-br from-orange-600 to-amber-700 text-white shadow-lg"}`}>
                                        {player.rank}
                                      </div>
                                    ) : (
                                      <span className="w-10 text-center text-xl font-bold text-white/30 block group-hover:text-white/60 transition-colors">
                                        {player.rank}
                                      </span>
                                    )}
                                   </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                      <img src={player.avatar} alt={player.username} className="w-12 h-12 rounded-xl ring-2 ring-white/10 group-hover:ring-cyan-500/50 transition-all" onError={(e) => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/Steve/64`; }} />
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors">{player.username}</h3>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className={`text-xs font-medium ${player.totalPoints >= 300 ? "text-amber-400" : player.totalPoints >= 200 ? "text-purple-400" : player.totalPoints >= 100 ? "text-cyan-400" : "text-white/50"}`}>
                                            {getTitle(player.totalPoints)}
                                          </span>
                                          <span className="text-xs text-white/30">•</span>
                                          <span className="text-xs text-white/50">{player.totalPoints} puan</span>
                                          <span className="text-xs text-white/30">•</span>
                                          <span className="text-xs text-white/50">🎮 {player.minecraftNick}</span>
                                        </div>
                                      </div>
                                    </div>
                                   </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                      {Object.entries(KITS).map(([kitKey, kit]) => {
                                        const tier = player.tiers[kitKey];
                                        return (
                                          <div key={kitKey} className="w-9 h-9 rounded-lg bg-slate-900 border border-white/10 flex flex-col items-center justify-center hover:border-cyan-500/50 transition-all hover:scale-110 group/tier" title={`${kit.ad}: ${tier || 'Test olmamış'}`}>
                                            <div className="text-[10px] leading-none flex justify-center">{kit.icon}</div>
                                            <span className={`text-[9px] font-bold leading-none mt-0.5 ${tier?.startsWith("HT") || tier?.startsWith("Crystal HT") ? "text-amber-400" : tier?.startsWith("LT") || tier?.startsWith("Crystal LT") ? "text-white/60" : "text-white/20"}`}>
                                              {tier ? tier.replace("Crystal ", "") : "—"}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                   </td>
                                </motion.tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 py-6 border-t border-white/10">
                          <button
                            onClick={() => setCurrentPageRank(p => Math.max(1, p - 1))}
                            disabled={currentPageRank === 1}
                            className="px-4 py-2 rounded-lg bg-slate-800 text-white/60 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition-all hover:scale-105"
                          >
                            ◀ Önceki
                          </button>
                          <span className="px-4 py-2 text-sm text-white/60">
                            Sayfa {currentPageRank} / {totalPages}
                          </span>
                          <button
                            onClick={() => setCurrentPageRank(p => Math.min(totalPages, p + 1))}
                            disabled={currentPageRank === totalPages}
                            className="px-4 py-2 rounded-lg bg-slate-800 text-white/60 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition-all hover:scale-105"
                          >
                            Sonraki ▶
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map((tierNum, idx) => {
                    const tierPlayers = playersByTier?.[tierNum] || [];
                    const tierEmojis: Record<number, string> = {
                      1: "👑",
                      2: "🥈",
                      3: "🥉",
                      4: "🔥",
                      5: "🌱"
                    };
                    return (
                      <motion.div key={tierNum} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className={`${cardTheme} rounded-[20px] border overflow-hidden hover:scale-105 transition-all`}>
                        <div className={`px-4 py-3 border-b border-white/10 ${tierNum === 1 ? "bg-gradient-to-r from-amber-500/20 to-yellow-600/20" : tierNum === 2 ? "bg-gradient-to-r from-slate-500/20 to-slate-600/20" : tierNum === 3 ? "bg-gradient-to-r from-orange-600/20 to-amber-700/20" : tierNum === 4 ? "bg-gradient-to-r from-red-500/20 to-orange-600/20" : "bg-gradient-to-r from-green-500/20 to-emerald-600/20"}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{tierEmojis[tierNum]}</span>
                              <h3 className="font-bold">Tier {tierNum}</h3>
                            </div>
                            <span className="text-xs text-white/50">{tierPlayers.length}</span>
                          </div>
                        </div>
                        <div className="p-2 max-h-[600px] overflow-y-auto custom-scroll">
                          {tierPlayers.length === 0 ? (
                            <div className="py-16 text-center">
                              <div className="text-3xl mb-2 opacity-20">👤</div>
                              <p className="text-xs text-white/30">Henüz oyuncu yok</p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {tierPlayers.map((player) => {
                                const tier = player.tiers[selectedKit];
                                const displayTier = tier?.replace("Crystal ", "") || tier;
                                return (
                                  <button key={player.id} onClick={() => setSelectedPlayer(player)} className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/5 transition-all group text-left hover:scale-105">
                                    <img src={player.avatar} alt="" className="w-8 h-8 rounded-lg ring-1 ring-white/10 group-hover:ring-cyan-500/50 transition-all" onError={(e) => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/Steve/32`; }} />
                                    <div className="flex-1 min-w-0">
                                      <span className="text-sm font-medium truncate group-hover:text-cyan-400 transition-colors block">{player.username}</span>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold bg-gradient-to-r ${TIER_COLORS[tier] || TIER_COLORS[displayTier] || "from-gray-600 to-gray-700"} text-white`}>{displayTier}</span>
                                        <span className="text-[10px] text-white/40">{TIER_POINTS[tier] || 0}p</span>
                                      </div>
                                      <div className="text-[9px] text-white/30 truncate mt-0.5">🎮 {player.minecraftNick}</div>
                                    </div>
                                    <svg className="w-3.5 h-3.5 text-white/20 group-hover:text-white/60 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </main>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Player Modal - 3D Skin gösterimi buraya eklenecek */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" onClick={() => setSelectedPlayer(null)}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-2xl bg-gradient-to-br from-slate-800 to-slate-900 rounded-[28px] border border-white/10 shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 via-blue-600/10 to-purple-600/10" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px]" />
            <div className="relative">
              <div className="flex items-start justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-600 blur-xl opacity-50 rounded-2xl" />
                    <img src={selectedPlayer.avatar} alt="" className="relative w-20 h-20 rounded-2xl ring-2 ring-white/20" onError={(e) => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/Steve/64`; }} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black">{selectedPlayer.username}</h2>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedPlayer.totalPoints >= 300 ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : selectedPlayer.totalPoints >= 200 ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : selectedPlayer.totalPoints >= 100 ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-gray-500/20 text-gray-400 border border-gray-500/30"}`}>
                        {getTitle(selectedPlayer.totalPoints)}
                      </span>
                      <span className="text-sm text-white/60">#{selectedPlayer.rank} • {selectedPlayer.totalPoints} puan</span>
                    </div>
                    <div className="mt-2 text-sm text-white/50">🎮 Minecraft: <span className="text-cyan-400 font-medium">{selectedPlayer.minecraftNick}</span></div>
                  </div>
                </div>
                <button onClick={() => setSelectedPlayer(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all hover:scale-110">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Tüm Kit Tierleri</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(KITS).map(([kitKey, kit]) => {
                    const tier = selectedPlayer.tiers[kitKey];
                    const displayTier = tier?.replace("Crystal ", "") || tier;
                    const points = TIER_POINTS[tier] || 0;
                    return (
                      <div key={kitKey} className="bg-slate-900/50 border border-white/10 rounded-2xl p-4 hover:border-cyan-500/30 transition-all hover:scale-105">
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-8 h-8 flex items-center justify-center">{kit.icon}</div>
                          {tier ? (
                            <span className={`text-xs font-bold px-2 py-1 rounded-lg bg-gradient-to-r ${TIER_COLORS[tier] || TIER_COLORS[displayTier] || "from-gray-600 to-gray-700"} text-white`}>{displayTier}</span>
                          ) : (
                            <span className="text-xs text-white/30">—</span>
                          )}
                        </div>
                        <div className="text-sm font-medium text-white/90">{kit.ad}</div>
                        <div className="text-xs text-white/40 mt-1">{points} puan</div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-3 gap-4">
                  {[
                    { label: "Toplam Test", value: selectedPlayer.tests },
                    { label: "HT Kit Sayısı", value: Object.values(selectedPlayer.tiers).filter(t => t?.startsWith("HT") || t?.startsWith("Crystal HT")).length },
                    { label: "Bölge", value: selectedPlayer.region },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div className="text-2xl font-black text-white">{stat.value}</div>
                      <div className="text-xs text-white/40 mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgb(255 255 255 / 0.1); border-radius: 2px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgb(255 255 255 / 0.2); }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
