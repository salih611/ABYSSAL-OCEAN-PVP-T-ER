import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AIChatBot from "./AIChatBot";

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

const UPSTASH_URL = 'https://adequate-loon-101577.upstash.io';
const UPSTASH_TOKEN = 'gQAAAAAAAYzJAAIgcDJhOWJiYWFhM2M2MmE0NThkYTJiMjZjZmM3ZDcxZWMwNA';

const KITS: Record<string, { ad: string; icon: JSX.Element; color: string; description: string }> = {
  vanilla: { ad: "Vanilla", icon: <img src="https://www.tierslist.net/tier_icons/vanilla.svg" width="30" height="30" alt="" className="w-7 h-7" />, color: "#fbbf24", description: "⚔️ Saf yetenek!" },
  sword: { ad: "Sword", icon: <img src="https://www.tierslist.net/tier_icons/sword.svg" width="30" height="30" alt="" className="w-7 h-7" />, color: "#60a5fa", description: "🗡️ Kılıç ustalığı!" },
  axe: { ad: "Axe", icon: <img src="https://www.tierslist.net/tier_icons/axe.svg" width="30" height="30" alt="" className="w-7 h-7" />, color: "#a78bfa", description: "🪓 Ağır darbe!" },
  nethpot: { ad: "NethOP", icon: <img src="https://www.tierslist.net/tier_icons/nethop.svg" width="30" height="30" alt="" className="w-7 h-7" />, color: "#ec4899", description: "🌌 Netherite OP!" },
  pot: { ad: "Pot", icon: <img src="https://www.tierslist.net/tier_icons/pot.svg" width="30" height="30" alt="" className="w-7 h-7" />, color: "#f43f5e", description: "🧪 Pot PvP!" },
  uhc: { ad: "UHC", icon: <img src="https://www.tierslist.net/tier_icons/uhc.svg" width="30" height="30" alt="" className="w-7 h-7" />, color: "#ef4444", description: "🍎 Hardcore!" },
  smp: { ad: "SMP", icon: <img src="https://www.tierslist.net/tier_icons/smp.svg" width="30" height="30" alt="" className="w-7 h-7" />, color: "#22c55e", description: "🌿 Survival!" },
  mace: { ad: "Mace", icon: <img src="https://www.tierslist.net/tier_icons/mace.svg" width="30" height="30" alt="" className="w-7 h-7" />, color: "#eab308", description: "🔨 Ağır çekiç!" },
};

const TIER_POINTS: Record<string, number> = {
  "HT1": 60, "LT1": 44, "HT2": 28, "LT2": 16, "HT3": 10, "LT3": 6,
  "HT4": 4, "LT4": 3, "HT5": 2, "LT5": 1,
};

const TIER_COLORS: Record<string, string> = {
  HT1: "from-amber-400 to-yellow-600", HT2: "from-slate-300 to-slate-500",
  HT3: "from-orange-600 to-amber-700", HT4: "from-blue-500 to-blue-700",
  HT5: "from-purple-500 to-purple-700", LT1: "from-emerald-500 to-emerald-700",
  LT2: "from-cyan-500 to-cyan-700", LT3: "from-indigo-500 to-indigo-700",
  LT4: "from-pink-500 to-pink-700", LT5: "from-gray-500 to-gray-700",
};

const KIT_ORDER: KitKey[] = ["overall", "vanilla", "sword", "axe", "nethpot", "pot", "uhc", "mace", "smp"];

// 🆕 BÖLGELER - YENİ EKLENDİ
const REGIONS: Record<string, { flag: string; name: string }> = {
  TR: { flag: "🇹🇷", name: "Türkiye" },
  EU: { flag: "🇪🇺", name: "Avrupa" },
  NA: { flag: "🇺🇸", name: "Amerika" },
};

const cleanTier = (tier: string | undefined | null): string | null => {
  if (!tier) return null;
  let cleaned = String(tier).replace(/Crystal\s+/gi, "").trim();
  cleaned = cleaned.replace(/^(Vanilla|Sword|Axe|Nethpot|NethOP|Pot|UHC|SMP|Mace)\s+/i, "").trim();
  const match = cleaned.match(/(HT|LT)\s*([1-5])/i);
  return match ? `${match[1].toUpperCase()}${match[2]}` : null;
};

const getTierPoints = (tier: string | undefined | null): number => {
  const cleaned = cleanTier(tier);
  return cleaned ? TIER_POINTS[cleaned] || 0 : 0;
};

const calculateTotalPoints = (tiers: Record<string, string>): number => {
  if (!tiers) return 0;
  let total = 0;
  for (const tier of Object.values(tiers)) total += getTierPoints(tier);
  return total;
};

const getTitle = (points: number): string => {
  if (points >= 300) return "🏆 Efsanevi Savaşçı";
  if (points >= 200) return "⚡ Usta Savaşçı";
  if (points >= 150) return "🌟 Tecrübeli Savaşçı";
  if (points >= 100) return "📈 Uzman Savaşçı";
  if (points >= 50) return "🌱 Acemi Savaşçı";
  return "🆕 Çaylak";
};

const getHighestTier = (tiers: Record<string, string>): string => {
  let highestTier = "", highestValue = -1;
  const order: Record<string, number> = { "HT1": 100, "LT1": 99, "HT2": 90, "LT2": 89, "HT3": 80, "LT3": 79, "HT4": 70, "LT4": 69, "HT5": 60, "LT5": 59 };
  for (const tier of Object.values(tiers || {})) {
    const cleaned = cleanTier(tier);
    if (cleaned && order[cleaned] !== undefined && order[cleaned] > highestValue) {
      highestValue = order[cleaned];
      highestTier = cleaned;
    }
  }
  return highestTier || "—";
};

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 127.14 96.36" fill="currentColor">
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
  </svg>
);

const Bubbles = () => {
  const bubbles = useMemo(() => Array.from({ length: 25 }, (_, i) => ({
    id: i, size: Math.random() * 25 + 6, left: Math.random() * 100,
    duration: Math.random() * 12 + 10, delay: Math.random() * 15,
  })), []);
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {bubbles.map(bubble => (
        <div key={bubble.id} className="absolute bottom-0 rounded-full"
          style={{
            width: bubble.size, height: bubble.size, left: `${bubble.left}%`,
            background: 'radial-gradient(circle at 30% 30%, rgba(165, 243, 252, 0.3), rgba(34, 211, 238, 0.1) 60%, rgba(8, 145, 178, 0.05) 100%)',
            border: '1px solid rgba(165, 243, 252, 0.2)',
            animation: `bubbleFloat ${bubble.duration}s ease-in infinite`,
            animationDelay: `${bubble.delay}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes bubbleFloat {
          0% { transform: translateY(0) scale(0.3); opacity: 0; }
          15% { opacity: 0.8; }
          85% { opacity: 0.5; }
          100% { transform: translateY(-110vh) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>("home");
  const [selectedKit, setSelectedKit] = useState<KitKey>("overall");
  const [searchQuery, setSearchQuery] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState<SortType>("rank");
  const [currentPageRank, setCurrentPageRank] = useState(1);
  const [selectedRegion, setSelectedRegion] = useState<string>("TR"); // 🆕 YENİ
  const playersPerPage = 20;

  const fetchPlayers = async () => {
    try {
      const response = await fetch(`${UPSTASH_URL}/get/players`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      let rawPlayers: Player[] = [];
      if (data.result) {
        rawPlayers = JSON.parse(data.result);
        rawPlayers = rawPlayers.map(p => ({
          ...p, tiers: p.tiers || {}, tests: p.tests || 0,
          totalPoints: calculateTotalPoints(p.tiers || {})
        }));
        rawPlayers.sort((a, b) => b.totalPoints - a.totalPoints);
        let trRank = 0;
        rawPlayers = rawPlayers.map(p => {
          if (p.region === "TR") { trRank++; return { ...p, rank: trRank }; }
          return { ...p, rank: 0 };
        });
      }
      setPlayers(rawPlayers);
    } catch (e) {
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

  // 🆕 BÖLGE FİLTRESİ - Eskiden sadece TR'ydi, şimdi seçili bölge
  const regionPlayers = useMemo(() => {
    return players.filter(p => p.region === selectedRegion);
  }, [players, selectedRegion]);

  const filteredPlayers = useMemo(() => {
    let filtered = [...regionPlayers];
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.minecraftNick?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (sortType === "points") filtered.sort((a, b) => b.totalPoints - a.totalPoints);
    else if (sortType === "name") filtered.sort((a, b) => (a.minecraftNick || a.username || "").localeCompare(b.minecraftNick || b.username || ""));
    else if (sortType === "tests") filtered.sort((a, b) => (b.tests || 0) - (a.tests || 0));
    else filtered.sort((a, b) => a.rank - b.rank);
    return filtered;
  }, [regionPlayers, searchQuery, sortType]);

  const kitPlayers = useMemo(() => {
    if (selectedKit === "overall") return filteredPlayers;
    return [...filteredPlayers].filter(p => p.tiers[selectedKit]).sort((a, b) => getTierPoints(b.tiers[selectedKit]) - getTierPoints(a.tiers[selectedKit]));
  }, [filteredPlayers, selectedKit]);

  const totalPages = Math.ceil(kitPlayers.length / playersPerPage);
  const currentPlayers = kitPlayers.slice((currentPageRank - 1) * playersPerPage, currentPageRank * playersPerPage);

  useEffect(() => { setCurrentPageRank(1); }, [sortType, selectedKit, searchQuery, selectedRegion]);

  const playersByTier = useMemo(() => {
    if (selectedKit === "overall") return null;
    const groups: Record<number, Player[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    kitPlayers.forEach(player => {
      const cleaned = cleanTier(player.tiers[selectedKit]);
      if (!cleaned) return;
      let groupNum = 0;
      if (cleaned === "HT1" || cleaned === "LT1") groupNum = 1;
      else if (cleaned === "HT2" || cleaned === "LT2") groupNum = 2;
      else if (cleaned === "HT3" || cleaned === "LT3") groupNum = 3;
      else if (cleaned === "HT4" || cleaned === "LT4") groupNum = 4;
      else if (cleaned === "HT5" || cleaned === "LT5") groupNum = 5;
      if (groupNum >= 1 && groupNum <= 5) groups[groupNum].push(player);
    });
    for (let i = 1; i <= 5; i++) {
      groups[i].sort((a, b) => getTierPoints(b.tiers[selectedKit]) - getTierPoints(a.tiers[selectedKit]));
    }
    return groups;
  }, [kitPlayers, selectedKit]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center">
        <Bubbles />
        <div className="text-center z-10">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          </div>
          <p className="text-cyan-400 font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0a0e14] text-white relative overflow-x-hidden">
      <Bubbles />
      
      <header className="relative z-50 sticky top-0 backdrop-blur-xl bg-[#0f141b]/80 border-b border-white/5">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentPage("home")}>
              <img src="/logo.png" alt="" className="h-12 w-12 rounded-xl object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div>
                <h1 className="text-xl font-black tracking-tight leading-none">
                  <span className="bg-gradient-to-r from-cyan-400 via-blue-300 to-cyan-500 bg-clip-text text-transparent">ABYSSAL OCEAN</span>
                </h1>
                <p className="text-[11px] text-white/40 font-semibold tracking-widest mt-0.5">TIER LIST</p>
              </div>
            </div>
            <nav className="hidden lg:flex items-center gap-1">
              <button onClick={() => setCurrentPage("home")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === "home" ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg" : "bg-[#1a1f2e] text-white/60 hover:bg-[#222838]"}`}>🏠 Home</button>
              <button onClick={() => setCurrentPage("rankings")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === "rankings" ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg" : "bg-[#1a1f2e] text-white/60 hover:bg-[#222838]"}`}>🏆 Rankings</button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {currentPage === "rankings" && (
              <input type="text" placeholder="Oyuncu ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="hidden md:block w-[260px] px-4 py-2 bg-[#1a1f2e] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-cyan-500/50" />
            )}
            <a href="https://discord.gg/cKFwKcfcWn" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-[#5865F2] hover:bg-[#4752c4] rounded-xl text-sm font-medium transition-all">
              <DiscordIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Discord</span>
            </a>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div key={currentPage} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
          
          {currentPage === "home" && (
            <main className="relative z-10 max-w-[1600px] mx-auto px-4 py-12">
              <div className="text-center mb-20">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-semibold mb-6">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                  Türkiye'nin #1 PvP Platformu
                </motion.div>
                
                <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl md:text-8xl font-black mb-6 leading-tight">
                  <span className="inline-block animated-gradient-text">ABYSSAL OCEAN</span>
                  <br />
                  <span className="inline-block">
                    {"TIER LIST".split("").map((char, i) => (
                      <span key={i} className="inline-block tier-letter" style={{ animationDelay: `${i * 0.1}s` }}>
                        {char === " " ? "\u00A0" : char}
                      </span>
                    ))}
                  </span>
                </motion.h1>
                
                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10">
                  Seviyeni Seç, Gücünü Kanıtla!
                </motion.p>
                
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-center gap-4">
                  <button onClick={() => setCurrentPage("rankings")} className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-lg transition-all shadow-lg hover:scale-105">🏆 Sıralamaları Gör</button>
                  <a href="https://discord.gg/cKFwKcfcWn" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-[#5865F2] rounded-xl font-bold text-lg transition-all flex items-center gap-2 shadow-lg hover:scale-105"><DiscordIcon className="w-6 h-6" /> Sunucuya Katıl</a>
                </motion.div>
              </div>

              <div className="mb-20">
                <div className="text-center mb-12">
                  <h2 className="text-4xl md:text-5xl font-black mb-4">Test Edebileceğin Kitler</h2>
                  <p className="text-white/50 text-lg">8 farklı kit, kendi tarzını bul!</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  {Object.entries(KITS).map(([key, kit], i) => (
                    <motion.div key={key} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }} className="bg-[#11161f] border border-white/5 rounded-2xl p-6 hover:border-cyan-500/50 transition-all cursor-pointer hover:scale-105" onClick={() => { setCurrentPage("rankings"); setSelectedKit(key as KitKey); }}>
                      <div className="mb-4 flex justify-center">{kit.icon}</div>
                      <h3 className="text-xl font-bold mb-2 text-center hover:text-cyan-400">{kit.ad}</h3>
                      <p className="text-xs text-white/40 text-center">{kit.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="relative bg-gradient-to-br from-cyan-600/20 via-blue-600/20 to-purple-600/20 border border-white/10 rounded-3xl p-10 md:p-14 text-center">
                <h2 className="text-4xl md:text-6xl font-black mb-4">Hazır mısın?</h2>
                <p className="text-lg text-white/70 mb-8">Discord sunucumuza katıl!</p>
                <a href="https://discord.gg/cKFwKcfcWn" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-10 py-5 bg-[#5865F2] rounded-xl font-bold text-xl transition-all shadow-2xl hover:scale-105"><DiscordIcon className="w-7 h-7" /> Hemen Katıl</a>
              </div>
            </main>
          )}

          {currentPage === "rankings" && (
            <main className="relative z-10 max-w-[1600px] mx-auto px-4 py-6">
              
              {/* 🆕 BÖLGE FİLTRESİ - YENİ EKLENDİ */}
              <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide">
                <span className="text-sm text-white/50 whitespace-nowrap">🌍 Bölge:</span>
                {Object.entries(REGIONS).map(([key, r]) => (
                  <button key={key} onClick={() => setSelectedRegion(key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all hover:scale-105 ${
                      selectedRegion === key 
                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg ring-2 ring-cyan-400/50" 
                        : "bg-[#1a1f2e] text-white/60 hover:bg-[#222838]"
                    }`}>
                    {r.flag} {r.name}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <span className="text-sm text-white/50">Sırala:</span>
                  {[{key:"rank",label:"🏆 Sıra"},{key:"points",label:"⭐ Puan"},{key:"name",label:"📝 İsim"},{key:"tests",label:"🎯 Test"}].map(opt => (
                    <button key={opt.key} onClick={() => setSortType(opt.key as SortType)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${sortType === opt.key ? "bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg" : "bg-[#1a1f2e] text-white/60 hover:bg-[#222838]"}`}>{opt.label}</button>
                  ))}
                </div>
                <div className="text-sm text-white/40">Toplam {kitPlayers.length} oyuncu</div>
              </div>

              <div className="mb-6 overflow-x-auto">
                <div className="flex items-center gap-2 min-w-max pb-2">
                  {KIT_ORDER.map(key => {
                    const isOverall = key === "overall";
                    const kit = isOverall ? { ad: "Overall", icon: <span className="text-xl">🏆</span> } : KITS[key];
                    const isActive = selectedKit === key;
                    return (
                      <button key={key} onClick={() => setSelectedKit(key)} className={`px-5 py-3 rounded-2xl font-medium transition-all whitespace-nowrap flex items-center gap-2 hover:scale-105 ${isActive ? "bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg" : "bg-[#1a1f2e] text-white/60 hover:bg-[#222838]"}`}>
                        <div className="w-7 h-7 flex items-center justify-center">{kit.icon}</div>
                        <span className="text-sm font-semibold">{kit.ad}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedKit === "overall" ? (
                <div className="bg-[#11161f]/90 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden">
                  {currentPlayers.length === 0 ? (
                    <div className="py-20 text-center">
                      <div className="text-6xl mb-4 opacity-20">🏆</div>
                      <h3 className="text-xl font-bold text-white/30">Bu bölgede henüz oyuncu yok</h3>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-white/5 bg-[#0f141b]/50">
                              <th className="text-left px-6 py-4 text-xs font-semibold text-white/40 uppercase w-16">#</th>
                              <th className="text-left px-6 py-4 text-xs font-semibold text-white/40 uppercase">Oyuncu</th>
                              <th className="text-right px-6 py-4 text-xs font-semibold text-white/40 uppercase">Tierler</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.03]">
                            {currentPlayers.map((player, idx) => {
                              const displayRank = sortType === "rank" ? player.rank : (currentPageRank - 1) * playersPerPage + idx + 1;
                              return (
                                <tr key={player.id} onClick={() => setSelectedPlayer(player)} className="group hover:bg-white/5 cursor-pointer transition-all">
                                  <td className="px-6 py-4">
                                    {displayRank <= 3 ? (
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${displayRank === 1 ? "bg-gradient-to-br from-amber-400 to-yellow-600 text-black" : displayRank === 2 ? "bg-gradient-to-br from-slate-300 to-slate-500 text-black" : "bg-gradient-to-br from-orange-600 to-amber-700"}`}>{displayRank}</div>
                                    ) : (
                                      <span className="w-10 text-center text-xl font-bold text-white/30 block">{displayRank}</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                      <img src={player.avatar} alt="" className="w-12 h-12 rounded-xl ring-2 ring-white/10" onError={(e) => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/Steve/64`; }} />
                                      <div>
                                        <h3 className="font-bold text-lg group-hover:text-cyan-400 transition-colors">{player.minecraftNick || player.username}</h3>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                          <span className={`text-xs font-medium ${player.totalPoints >= 200 ? "text-purple-400" : player.totalPoints >= 100 ? "text-cyan-400" : "text-white/50"}`}>{getTitle(player.totalPoints)}</span>
                                          <span className="text-xs text-white/30">•</span>
                                          <span className="text-xs font-bold text-cyan-400">{player.totalPoints} puan</span>
                                          <span className="text-xs text-white/30">•</span>
                                          <span className="text-xs">{REGIONS[player.region]?.flag}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2 flex-wrap">
                                      {Object.entries(KITS).map(([kitKey, kit]) => {
                                        const tier = player.tiers[kitKey];
                                        const displayTier = cleanTier(tier);
                                        return (
                                          <div key={kitKey} className="w-14 h-14 rounded-xl bg-[#0f141b] border border-white/10 flex flex-col items-center justify-center hover:border-cyan-500/50 transition-all hover:scale-110">
                                            <div className="w-7 h-7 flex items-center justify-center">{kit.icon}</div>
                                            {displayTier ? (
                                              <span className={`text-[10px] font-black leading-none mt-1 ${displayTier.startsWith("HT") ? "text-amber-400" : "text-cyan-400"}`}>{displayTier}</span>
                                            ) : (
                                              <span className="text-[10px] font-bold text-white/20 leading-none mt-1">—</span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 py-4 border-t border-white/5">
                          <button onClick={() => setCurrentPageRank(p => Math.max(1, p - 1))} disabled={currentPageRank === 1} className="px-4 py-2 rounded-lg bg-[#1a1f2e] text-white/60 disabled:opacity-30">◀ Önceki</button>
                          <span className="px-4 py-2 text-sm">Sayfa {currentPageRank}/{totalPages}</span>
                          <button onClick={() => setCurrentPageRank(p => Math.min(totalPages, p + 1))} disabled={currentPageRank === totalPages} className="px-4 py-2 rounded-lg bg-[#1a1f2e] text-white/60 disabled:opacity-30">Sonraki ▶</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map(tierNum => {
                    const tierPlayers = playersByTier?.[tierNum] || [];
                    const emojis: Record<number, string> = { 1: "👑", 2: "🥈", 3: "🥉", 4: "🔥", 5: "🌱" };
                    return (
                      <div key={tierNum} className="bg-[#11161f]/90 rounded-2xl border border-white/5 overflow-hidden">
                        <div className={`px-4 py-3 border-b border-white/5 ${tierNum === 1 ? "bg-gradient-to-r from-amber-500/20 to-yellow-600/20" : tierNum === 2 ? "bg-gradient-to-r from-slate-500/20 to-slate-600/20" : tierNum === 3 ? "bg-gradient-to-r from-orange-600/20 to-amber-700/20" : tierNum === 4 ? "bg-gradient-to-r from-red-500/20 to-orange-600/20" : "bg-gradient-to-r from-green-500/20 to-emerald-600/20"}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2"><span className="text-xl">{emojis[tierNum]}</span><h3 className="font-bold">Tier {tierNum}</h3></div>
                            <span className="text-xs text-white/50">{tierPlayers.length}</span>
                          </div>
                        </div>
                        <div className="p-2 max-h-[600px] overflow-y-auto">
                          {tierPlayers.length === 0 ? (
                            <div className="py-16 text-center"><div className="text-3xl mb-2 opacity-20">👤</div><p className="text-xs text-white/30">Yok</p></div>
                          ) : (
                            <div className="space-y-1">
                              {tierPlayers.map(player => {
                                const displayTier = cleanTier(player.tiers[selectedKit]) || "—";
                                const tierKey = displayTier as keyof typeof TIER_COLORS;
                                return (
                                  <button key={player.id} onClick={() => setSelectedPlayer(player)} className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 text-left">
                                    <img src={player.avatar} alt="" className="w-8 h-8 rounded-lg" onError={(e) => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/Steve/32`; }} />
                                    <div className="flex-1 min-w-0">
                                      <span className="text-sm font-medium truncate block">{player.minecraftNick || player.username}</span>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold bg-gradient-to-r ${TIER_COLORS[tierKey] || "from-gray-600 to-gray-700"}`}>{displayTier}</span>
                                        <span className="text-[10px] text-white/40">{getTierPoints(player.tiers[selectedKit])}p</span>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </main>
          )}
        </motion.div>
      </AnimatePresence>

      {selectedPlayer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setSelectedPlayer(null)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-2xl bg-gradient-to-br from-[#11161f] to-[#0a0e14] rounded-3xl border border-white/10 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-4">
                <img src={selectedPlayer.avatar} alt="" className="w-20 h-20 rounded-2xl ring-2 ring-white/20" onError={(e) => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/Steve/64`; }} />
                <div>
                  <h2 className="text-2xl font-black">{selectedPlayer.minecraftNick || selectedPlayer.username}</h2>
                  <div className="text-sm text-white/60 mt-1">{REGIONS[selectedPlayer.region]?.flag} #{selectedPlayer.rank} • <span className="text-cyan-400 font-bold">{selectedPlayer.totalPoints} puan</span></div>
                  <div className="mt-1 text-sm text-white/50">Discord: <span className="text-cyan-400">@{selectedPlayer.username}</span></div>
                </div>
              </div>
              <button onClick={() => setSelectedPlayer(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <h3 className="text-sm font-semibold text-white/40 uppercase mb-4">Tüm Kit Tierleri</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(KITS).map(([kitKey, kit]) => {
                  const tier = selectedPlayer.tiers[kitKey];
                  const displayTier = cleanTier(tier);
                  const points = getTierPoints(tier);
                  const tierKey = displayTier as keyof typeof TIER_COLORS;
                  return (
                    <div key={kitKey} className="bg-[#0f141b] border border-white/10 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 flex items-center justify-center">{kit.icon}</div>
                        {displayTier ? (
                          <span className={`text-xs font-bold px-2 py-1 rounded-lg bg-gradient-to-r ${TIER_COLORS[tierKey] || "from-gray-600 to-gray-700"}`}>{displayTier}</span>
                        ) : (
                          <span className="text-xs text-white/30">—</span>
                        )}
                      </div>
                      <div className="text-sm font-medium">{kit.ad}</div>
                      <div className="text-xs text-white/40 mt-1">{points} puan</div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-black">{selectedPlayer.tests}</div>
                  <div className="text-xs text-white/40 mt-1">Toplam Test</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black">{getHighestTier(selectedPlayer.tiers)}</div>
                  <div className="text-xs text-white/40 mt-1">En Yüksek Tier</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <style>{`
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        @keyframes gradientShift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .animated-gradient-text {
          background: linear-gradient(90deg, #22d3ee 0%, #3b82f6 25%, #a855f7 50%, #ec4899 75%, #22d3ee 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientShift 4s ease-in-out infinite;
          filter: drop-shadow(0 0 30px rgba(34, 211, 238, 0.4));
        }
        @keyframes letterDrop {
          0% { transform: translateY(-30px) rotate(-10deg); opacity: 0; }
          50% { transform: translateY(5px) rotate(2deg); opacity: 1; }
          100% { transform: translateY(0) rotate(0); opacity: 1; }
        }
        @keyframes letterGlow {
          0%, 100% { text-shadow: 0 0 10px rgba(34, 211, 238, 0.5); }
          50% { text-shadow: 0 0 20px rgba(168, 85, 247, 0.7); }
        }
        .tier-letter {
          color: white;
          display: inline-block;
          animation: letterDrop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) backwards, letterGlow 3s ease-in-out infinite;
          transition: all 0.3s ease;
        }
        .tier-letter:hover {
          transform: translateY(-10px) scale(1.2);
          color: #22d3ee;
        }
      `}</style>

      <AIChatBot />
    </div>
  );
}
