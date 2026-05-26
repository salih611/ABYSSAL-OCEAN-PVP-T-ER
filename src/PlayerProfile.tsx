import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import * as skinview3d from "skinview3d";

const UPSTASH_URL = 'https://adequate-loon-101577.upstash.io';
const UPSTASH_TOKEN = 'gQAAAAAAAYzJAAIgcDJhOWJiYWFhM2M2MmE0NThkYTJiMjZjZmM3ZDcxZWMwNA';

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

const KITS: Record<string, { ad: string; emoji: string }> = {
  vanilla: { ad: "Vanilla", emoji: "🌿" },
  sword: { ad: "Sword", emoji: "⚔️" },
  axe: { ad: "Axe", emoji: "🪓" },
  nethpot: { ad: "NethOP", emoji: "🌌" },
  pot: { ad: "Pot", emoji: "🧪" },
  uhc: { ad: "UHC", emoji: "🍎" },
  smp: { ad: "SMP", emoji: "🌿" },
  mace: { ad: "Mace", emoji: "🔨" },
};

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

const getCombatTitle = (points: number) => {
  if (points >= 250) return { title: "Combat Grandmaster", color: "from-amber-400 to-yellow-600", emoji: "👑" };
  if (points >= 150) return { title: "Combat Master", color: "from-purple-500 to-pink-500", emoji: "⚡" };
  if (points >= 100) return { title: "Combat Ace", color: "from-blue-500 to-cyan-500", emoji: "🌟" };
  if (points >= 50) return { title: "Combat Specialist", color: "from-green-500 to-emerald-500", emoji: "🎯" };
  if (points >= 20) return { title: "Combat Cadet", color: "from-orange-500 to-amber-500", emoji: "🔥" };
  return { title: "Combat Novice", color: "from-gray-500 to-slate-500", emoji: "🆕" };
};

export default function PlayerProfile() {
  const { nick } = useParams<{ nick: string }>();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const skinViewerRef = useRef<HTMLCanvasElement>(null);
  const viewerInstance = useRef<any>(null);

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const response = await fetch(`${UPSTASH_URL}/get/players`, {
          headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
        });
        const data = await response.json();
        if (data.result) {
          const players = JSON.parse(data.result);
          const found = players.find((p: any) => 
            p.minecraftNick?.toLowerCase() === nick?.toLowerCase() ||
            p.username?.toLowerCase() === nick?.toLowerCase()
          );
          if (found) {
            let total = 0;
            for (const tier of Object.values(found.tiers || {})) {
              total += getTierPoints(tier as string);
            }
            setPlayer({ ...found, totalPoints: total });
          }
        }
      } catch (e) {
        console.error("Profil hatası:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayer();
  }, [nick]);

  useEffect(() => {
    if (player && skinViewerRef.current && !viewerInstance.current) {
      try {
        const viewer = new skinview3d.SkinViewer({
          canvas: skinViewerRef.current,
          width: 280,
          height: 380,
          skin: `https://mc-heads.net/skin/${player.minecraftNick || 'Steve'}`,
        });
        viewer.controls.enableRotate = true;
        viewer.controls.enableZoom = false;
        viewer.controls.enablePan = false;
        viewer.autoRotate = true;
        viewer.autoRotateSpeed = 1;
        viewerInstance.current = viewer;
      } catch (e) {
        console.error("3D Skin hatası:", e);
      }
    }
    return () => {
      if (viewerInstance.current) {
        viewerInstance.current.dispose();
        viewerInstance.current = null;
      }
    };
  }, [player]);

  const sharePlayer = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `${player.minecraftNick} - Abyssal Ocean`,
        text: `${player.minecraftNick} oyuncusunun profilini gör! ${player.totalPoints} puan`,
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      alert("✅ Link kopyalandı!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center text-white p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h1 className="text-2xl font-bold mb-2">Oyuncu Bulunamadı</h1>
          <p className="text-white/60 mb-6">"{nick}" adlı oyuncu sistemde kayıtlı değil.</p>
          <Link to="/" className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold hover:scale-105 transition-all inline-block">
            🏠 Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  const combatRank = getCombatTitle(player.totalPoints);

  return (
    <div className="min-h-screen bg-[#0a0e14] text-white">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0f141b]/80 border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Geri</span>
          </button>
          <h1 className="text-lg font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            ABYSSAL OCEAN
          </h1>
          <button onClick={sharePlayer} className="p-2 hover:bg-white/10 rounded-xl transition-all">
            📤
          </button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-[#11161f] to-[#0f141b] rounded-3xl border border-white/10 p-6 sticky top-24">
              <div className="flex justify-center mb-4">
                <canvas ref={skinViewerRef} className="rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-black mb-2">{player.minecraftNick}</h2>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${combatRank.color} text-white font-bold text-sm shadow-lg`}>
                  <span>{combatRank.emoji}</span>
                  <span>{combatRank.title}</span>
                </div>
                <div className="mt-4 text-4xl font-black text-cyan-400">{player.totalPoints}</div>
                <div className="text-xs text-white/40 uppercase tracking-widest">Toplam Puan</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-[#11161f] border border-white/10 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-amber-400">#{player.rank || '—'}</div>
                <div className="text-xs text-white/50 mt-1">Sıralama</div>
              </div>
              <div className="bg-[#11161f] border border-white/10 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-cyan-400">{player.tests || 0}</div>
                <div className="text-xs text-white/50 mt-1">Toplam Test</div>
              </div>
              <div className="bg-[#11161f] border border-white/10 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-purple-400">{Object.keys(player.tiers || {}).length}</div>
                <div className="text-xs text-white/50 mt-1">Kit Sayısı</div>
              </div>
              <div className="bg-[#11161f] border border-white/10 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-green-400">{REGIONS[player.region]?.flag}</div>
                <div className="text-xs text-white/50 mt-1">{REGIONS[player.region]?.name}</div>
              </div>
            </div>

            <div className="bg-[#11161f] border border-white/10 rounded-2xl p-5">
              <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Discord Hesabı</div>
              <div className="text-lg font-bold text-cyan-400">@{player.username}</div>
            </div>

            <div className="bg-[#11161f] border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">⚔️ Kit Tier'ları</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(KITS).map(([kitKey, kit]) => {
                  const tier = player.tiers?.[kitKey];
                  const displayTier = cleanTier(tier);
                  const points = getTierPoints(tier);
                  const tierColor = displayTier ? TIER_COLORS[displayTier] : "from-gray-700 to-gray-800";
                  return (
                    <div key={kitKey} className={`bg-gradient-to-br ${displayTier ? tierColor : 'from-[#0f141b] to-[#0a0e14]'} border ${displayTier ? 'border-white/20' : 'border-white/5'} rounded-2xl p-4 hover:scale-105 transition-all`}>
                      <div className="text-center">
                        <div className="text-3xl mb-2">{kit.emoji}</div>
                        <div className="font-bold text-sm mb-1">{kit.ad}</div>
                        {displayTier ? (
                          <>
                            <div className="text-2xl font-black text-white drop-shadow-lg">{displayTier}</div>
                            <div className="text-xs text-white/80 mt-1">{points} puan</div>
                          </>
                        ) : (
                          <div className="text-xs text-white/30">Test olmamış</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={sharePlayer} className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold hover:scale-105 transition-all flex items-center justify-center gap-2">
                📤 Profili Paylaş
              </button>
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${player.minecraftNick} oyuncusunun Abyssal Ocean profili! ${player.totalPoints} puan 🌊`)}&url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className="flex-1 px-4 py-3 bg-[#1DA1F2] rounded-xl font-bold hover:scale-105 transition-all flex items-center justify-center gap-2">
                🐦 Twitter'da Paylaş
              </a>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
