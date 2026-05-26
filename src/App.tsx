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
type ThemeKey = "ocean" | "dark" | "light" | "sunset" | "forest";
type LangKey = "tr" | "en" | "de";

const UPSTASH_URL = 'https://adequate-loon-101577.upstash.io';
const UPSTASH_TOKEN = 'gQAAAAAAAYzJAAIgcDJhOWJiYWFhM2M2MmE0NThkYTJiMjZjZmM3ZDcxZWMwNA';

// 🎨 TEMA SİSTEMİ
const THEMES: Record<ThemeKey, {
  name: string;
  emoji: string;
  bg: string;
  cardBg: string;
  headerBg: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryGradient: string;
  accent: string;
}> = {
  ocean: {
    name: "Ocean",
    emoji: "🌊",
    bg: "#0a0e14",
    cardBg: "#11161f",
    headerBg: "#0f141b",
    text: "#ffffff",
    textMuted: "rgba(255,255,255,0.6)",
    border: "rgba(255,255,255,0.05)",
    primary: "#22d3ee",
    primaryGradient: "from-cyan-500 to-blue-500",
    accent: "#3b82f6",
  },
  dark: {
    name: "Midnight",
    emoji: "🌙",
    bg: "#000000",
    cardBg: "#0a0a0a",
    headerBg: "#050505",
    text: "#ffffff",
    textMuted: "rgba(255,255,255,0.5)",
    border: "rgba(255,255,255,0.08)",
    primary: "#a855f7",
    primaryGradient: "from-purple-500 to-pink-500",
    accent: "#ec4899",
  },
  light: {
    name: "Light",
    emoji: "☀️",
    bg: "#f5f5f7",
    cardBg: "#ffffff",
    headerBg: "#fafafa",
    text: "#1a1a1a",
    textMuted: "rgba(0,0,0,0.6)",
    border: "rgba(0,0,0,0.08)",
    primary: "#0ea5e9",
    primaryGradient: "from-blue-500 to-cyan-500",
    accent: "#0284c7",
  },
  sunset: {
    name: "Sunset",
    emoji: "🌅",
    bg: "#1a0f0a",
    cardBg: "#2a1810",
    headerBg: "#1f1208",
    text: "#fff5e6",
    textMuted: "rgba(255,245,230,0.6)",
    border: "rgba(255,165,0,0.1)",
    primary: "#f97316",
    primaryGradient: "from-orange-500 to-red-500",
    accent: "#dc2626",
  },
  forest: {
    name: "Forest",
    emoji: "🌲",
    bg: "#0a1410",
    cardBg: "#0f1f18",
    headerBg: "#0b1814",
    text: "#e8f5e9",
    textMuted: "rgba(232,245,233,0.6)",
    border: "rgba(34,197,94,0.1)",
    primary: "#22c55e",
    primaryGradient: "from-green-500 to-emerald-500",
    accent: "#16a34a",
  },
};

// 🌍 DİL SİSTEMİ
const LANGUAGES: Record<LangKey, { name: string; flag: string; code: string }> = {
  tr: { name: "Türkçe", flag: "🇹🇷", code: "TR" },
  en: { name: "English", flag: "🇬🇧", code: "EN" },
  de: { name: "Deutsch", flag: "🇩🇪", code: "DE" },
};

// 📝 ÇEVİRİLER
const TRANSLATIONS: Record<LangKey, Record<string, string>> = {
  tr: {
    home: "Ana Sayfa",
    rankings: "Sıralamalar",
    discord: "Discord",
    searchPlayer: "Oyuncu ara...",
    pvpPlatform: "Türkiye'nin #1 PvP Platformu",
    chooseLevel: "Seviyeni Seç, Gücünü Kanıtla!",
    viewRankings: "Sıralamaları Gör",
    joinServer: "Sunucuya Katıl",
    kitsTitle: "Test Edebileceğin Kitler",
    kitsSubtitle: "8 farklı kit, kendi tarzını bul ve ustalaş!",
    ready: "Hazır mısın?",
    joinDiscord: "Discord sunucumuza katıl!",
    joinNow: "Hemen Katıl",
    region: "Bölge",
    sortBy: "Sırala",
    sortRank: "🏆 Sıra",
    sortPoints: "⭐ Puan",
    sortName: "📝 İsim",
    sortTests: "🎯 Test",
    totalPlayers: "Toplam {count} oyuncu",
    player: "Oyuncu",
    tiers: "Tierler",
    noPlayers: "Bu bölgede henüz oyuncu yok",
    previous: "◀ Önceki",
    next: "Sonraki ▶",
    page: "Sayfa {current}/{total}",
    points: "puan",
    allKitTiers: "Tüm Kit Tierleri",
    totalTests: "Toplam Test",
    highestTier: "En Yüksek Tier",
    theme: "Tema",
    language: "Dil",
    allRights: "Tüm hakları gizlidir",
    madeWith: "Türk PvP Topluluğu için 💙 ile yapıldı",
    pvpTierList: "Minecraft PvP Tier List",
    seeRankings: "Sıralamaları Gör →",
    loading: "Yükleniyor...",
    title_legendary: "🏆 Efsanevi Savaşçı",
    title_master: "⚡ Usta Savaşçı",
    title_experienced: "🌟 Tecrübeli Savaşçı",
    title_expert: "📈 Uzman Savaşçı",
    title_novice: "🌱 Acemi Savaşçı",
    title_rookie: "🆕 Çaylak",
  },
  en: {
    home: "Home",
    rankings: "Rankings",
    discord: "Discord",
    searchPlayer: "Search player...",
    pvpPlatform: "Turkey's #1 PvP Platform",
    chooseLevel: "Choose Your Level, Prove Your Power!",
    viewRankings: "View Rankings",
    joinServer: "Join Server",
    kitsTitle: "Kits You Can Test",
    kitsSubtitle: "8 different kits, find your own style!",
    ready: "Are you ready?",
    joinDiscord: "Join our Discord server!",
    joinNow: "Join Now",
    region: "Region",
    sortBy: "Sort",
    sortRank: "🏆 Rank",
    sortPoints: "⭐ Points",
    sortName: "📝 Name",
    sortTests: "🎯 Tests",
    totalPlayers: "Total {count} players",
    player: "Player",
    tiers: "Tiers",
    noPlayers: "No players in this region yet",
    previous: "◀ Previous",
    next: "Next ▶",
    page: "Page {current}/{total}",
    points: "points",
    allKitTiers: "All Kit Tiers",
    totalTests: "Total Tests",
    highestTier: "Highest Tier",
    theme: "Theme",
    language: "Language",
    allRights: "All rights reserved",
    madeWith: "Made with 💙 for Turkish PvP Community",
    pvpTierList: "Minecraft PvP Tier List",
    seeRankings: "View Rankings →",
    loading: "Loading...",
    title_legendary: "🏆 Legendary Warrior",
    title_master: "⚡ Master Warrior",
    title_experienced: "🌟 Experienced Warrior",
    title_expert: "📈 Expert Warrior",
    title_novice: "🌱 Novice Warrior",
    title_rookie: "🆕 Rookie",
  },
  de: {
    home: "Startseite",
    rankings: "Ranglisten",
    discord: "Discord",
    searchPlayer: "Spieler suchen...",
    pvpPlatform: "Die #1 PvP-Plattform der Türkei",
    chooseLevel: "Wähle dein Level, beweise deine Stärke!",
    viewRankings: "Ranglisten ansehen",
    joinServer: "Server beitreten",
    kitsTitle: "Kits zum Testen",
    kitsSubtitle: "8 verschiedene Kits, finde deinen Stil!",
    ready: "Bist du bereit?",
    joinDiscord: "Tritt unserem Discord bei!",
    joinNow: "Jetzt beitreten",
    region: "Region",
    sortBy: "Sortieren",
    sortRank: "🏆 Rang",
    sortPoints: "⭐ Punkte",
    sortName: "📝 Name",
    sortTests: "🎯 Tests",
    totalPlayers: "Insgesamt {count} Spieler",
    player: "Spieler",
    tiers: "Stufen",
    noPlayers: "Noch keine Spieler in dieser Region",
    previous: "◀ Zurück",
    next: "Weiter ▶",
    page: "Seite {current}/{total}",
    points: "Punkte",
    allKitTiers: "Alle Kit-Stufen",
    totalTests: "Gesamttests",
    highestTier: "Höchste Stufe",
    theme: "Theme",
    language: "Sprache",
    allRights: "Alle Rechte vorbehalten",
    madeWith: "Mit 💙 für die türkische PvP-Community",
    pvpTierList: "Minecraft PvP Stufenliste",
    seeRankings: "Ranglisten ansehen →",
    loading: "Wird geladen...",
    title_legendary: "🏆 Legendärer Krieger",
    title_master: "⚡ Meisterkrieger",
    title_experienced: "🌟 Erfahrener Krieger",
    title_expert: "📈 Expertenkrieger",
    title_novice: "🌱 Anfänger Krieger",
    title_rookie: "🆕 Neuling",
  },
};

const KITS: Record<string, { ad: string; icon: JSX.Element; color: string; description: Record<LangKey, string>; detail: Record<LangKey, string> }> = {
  vanilla: { 
    ad: "Vanilla", 
    icon: <img src="https://www.tierslist.net/tier_icons/vanilla.svg" width="30" height="30" alt="" className="w-7 h-7" />, 
    color: "#fbbf24", 
    description: { tr: "Saf Yetenek Savaşı", en: "Pure Skill Battle", de: "Reiner Skill-Kampf" },
    detail: { 
      tr: "Hiçbir ekipman yok, sadece yumruklarınla rakibini alt et. Refleks, taktik ve cesaret testi!",
      en: "No equipment, defeat your opponent with just your fists. Reflex, tactics and courage test!",
      de: "Keine Ausrüstung, besiege deinen Gegner nur mit deinen Fäusten. Reflex- und Taktiktest!"
    }
  },
  sword: { 
    ad: "Sword", 
    icon: <img src="https://www.tierslist.net/tier_icons/sword.svg" width="30" height="30" alt="" className="w-7 h-7" />, 
    color: "#60a5fa", 
    description: { tr: "Kılıç Ustalığı", en: "Sword Mastery", de: "Schwertbeherrschung" },
    detail: { 
      tr: "Klasik kılıç savaşı! Combo, timing ve crit vuruşların ustalığını sergile.",
      en: "Classic sword battle! Show your mastery of combos, timing and crit hits.",
      de: "Klassischer Schwertkampf! Zeige deine Beherrschung von Combos und Crits."
    }
  },
  axe: { 
    ad: "Axe", 
    icon: <img src="https://www.tierslist.net/tier_icons/axe.svg" width="30" height="30" alt="" className="w-7 h-7" />, 
    color: "#a78bfa", 
    description: { tr: "Ağır Darbe Sanatı", en: "Heavy Strike Art", de: "Schwere Schlagkunst" },
    detail: { 
      tr: "Yüksek hasar, kalkan kırma! Stratejik vuruşlarla rakibinin savunmasını çök.",
      en: "High damage, shield breaking! Crush your opponent's defense with strategic hits.",
      de: "Hoher Schaden, Schildbruch! Zerstöre die Verteidigung mit strategischen Schlägen."
    }
  },
  nethpot: { 
    ad: "NethOP", 
    icon: <img src="https://www.tierslist.net/tier_icons/nethop.svg" width="30" height="30" alt="" className="w-7 h-7" />, 
    color: "#ec4899", 
    description: { tr: "Netherite Üstünlüğü", en: "Netherite Supremacy", de: "Netherite-Vorherrschaft" },
    detail: { 
      tr: "En güçlü zırh ve silahlarla efsanevi savaşlar. Pot kullanımı ve OP gear yönetimi şart!",
      en: "Legendary battles with the strongest armor and weapons. Pot usage and OP gear management required!",
      de: "Legendäre Kämpfe mit stärkster Rüstung. Pot-Nutzung und OP-Gear-Management erforderlich!"
    }
  },
  pot: { 
    ad: "Pot", 
    icon: <img src="https://www.tierslist.net/tier_icons/pot.svg" width="30" height="30" alt="" className="w-7 h-7" />, 
    color: "#f43f5e", 
    description: { tr: "Pot PvP Sanatı", en: "Pot PvP Art", de: "Trank-PvP Kunst" },
    detail: { 
      tr: "Şifa iksirleri, hız ve güç potions! Hızlı refleks ve pot yönetimi ustalığı.",
      en: "Healing potions, speed and power potions! Fast reflexes and pot management mastery.",
      de: "Heiltränke, Geschwindigkeit und Krafttränke! Schnelle Reflexe und Trankbeherrschung."
    }
  },
  uhc: { 
    ad: "UHC", 
    icon: <img src="https://www.tierslist.net/tier_icons/uhc.svg" width="30" height="30" alt="" className="w-7 h-7" />, 
    color: "#ef4444", 
    description: { tr: "Ultra Hardcore", en: "Ultra Hardcore", de: "Ultra Hardcore" },
    detail: { 
      tr: "Doğal yenilenme yok! Golden apple ile hayatta kal, her vuruş kritik önem taşır.",
      en: "No natural regen! Survive with golden apples, every hit is critical.",
      de: "Keine natürliche Regeneration! Überlebe mit goldenen Äpfeln, jeder Treffer zählt."
    }
  },
  smp: { 
    ad: "SMP", 
    icon: <img src="https://www.tierslist.net/tier_icons/smp.svg" width="30" height="30" alt="" className="w-7 h-7" />, 
    color: "#22c55e", 
    description: { tr: "Survival Multiplayer", en: "Survival Multiplayer", de: "Survival Multiplayer" },
    detail: { 
      tr: "Gerçek survival deneyimi! Crystal, totem, elytra - tüm modern SMP araçlarıyla savaş.",
      en: "Real survival experience! Fight with crystal, totem, elytra and all modern SMP tools.",
      de: "Echtes Survival-Erlebnis! Kämpfe mit Kristall, Totem, Elytra und allen modernen SMP-Tools."
    }
  },
  mace: { 
    ad: "Mace", 
    icon: <img src="https://www.tierslist.net/tier_icons/mace.svg" width="30" height="30" alt="" className="w-7 h-7" />, 
    color: "#eab308", 
    description: { tr: "Çekiç Gücü", en: "Mace Power", de: "Streitkolben-Macht" },
    detail: { 
      tr: "1.21'in yeni efsanevi silahı! Yükseklikten saldır, ağır hasar ver, alanı kontrol et.",
      en: "The legendary new weapon of 1.21! Attack from heights, deal heavy damage, control the area.",
      de: "Die legendäre neue Waffe von 1.21! Greife von oben an und kontrolliere das Feld."
    }
  },
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

const REGIONS: Record<string, { code: string; name: Record<LangKey, string>; color: string }> = {
  TR: { code: "TR", name: { tr: "Türkiye", en: "Turkey", de: "Türkei" }, color: "from-red-500 to-red-600" },
  EU: { code: "EU", name: { tr: "Avrupa", en: "Europe", de: "Europa" }, color: "from-blue-500 to-blue-600" },
  NA: { code: "US", name: { tr: "Amerika", en: "America", de: "Amerika" }, color: "from-green-500 to-green-600" },
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

const getTitle = (points: number, t: (key: string) => string): string => {
  if (points >= 300) return t("title_legendary");
  if (points >= 200) return t("title_master");
  if (points >= 150) return t("title_experienced");
  if (points >= 100) return t("title_expert");
  if (points >= 50) return t("title_novice");
  return t("title_rookie");
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
  const [selectedRegion, setSelectedRegion] = useState<string>("TR");
  const playersPerPage = 20;

  // 🎨 TEMA & DİL STATE
  const [theme, setTheme] = useState<ThemeKey>(() => {
    const saved = localStorage.getItem("theme");
    return (saved as ThemeKey) || "ocean";
  });
  const [language, setLanguage] = useState<LangKey>(() => {
    const saved = localStorage.getItem("language");
    return (saved as LangKey) || "tr";
  });
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  // Tema/dil kaydet
  useEffect(() => { localStorage.setItem("theme", theme); }, [theme]);
  useEffect(() => { localStorage.setItem("language", language); }, [language]);

  // Çeviri fonksiyonu
  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = TRANSLATIONS[language][key] || TRANSLATIONS.tr[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  const currentTheme = THEMES[theme];
  const isLight = theme === "light";

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: currentTheme.bg }}>
        <Bubbles />
        <div className="text-center z-10">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4" style={{ borderColor: `${currentTheme.primary}20` }}></div>
            <div className="absolute inset-0 rounded-full border-4 border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ borderTopColor: currentTheme.primary }}></div>
          </div>
          <p className="font-medium" style={{ color: currentTheme.primary }}>{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen w-full relative overflow-x-hidden transition-colors duration-500" 
      style={{ background: currentTheme.bg, color: currentTheme.text }}
      data-theme={theme}
    >
      <Bubbles />
      
      <header 
        className="relative z-50 sticky top-0 backdrop-blur-xl border-b transition-colors duration-500"
        style={{ background: `${currentTheme.headerBg}cc`, borderColor: currentTheme.border }}
      >
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentPage("home")}>
              <img src="/logo.png" alt="" className="h-12 w-12 rounded-xl object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div>
                <h1 className="text-xl font-black tracking-tight leading-none">
                  <span className={`bg-gradient-to-r ${currentTheme.primaryGradient} bg-clip-text text-transparent`}>ABYSSAL OCEAN</span>
                </h1>
                <p className="text-[11px] font-semibold tracking-widest mt-0.5" style={{ color: currentTheme.textMuted }}>TIER LIST</p>
              </div>
            </div>
            <nav className="hidden lg:flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage("home")} 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === "home" ? `bg-gradient-to-r ${currentTheme.primaryGradient} text-white shadow-lg` : ""}`}
                style={currentPage !== "home" ? { background: currentTheme.cardBg, color: currentTheme.textMuted } : {}}
              >
                🏠 {t("home")}
              </button>
              <button 
                onClick={() => setCurrentPage("rankings")} 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === "rankings" ? `bg-gradient-to-r ${currentTheme.primaryGradient} text-white shadow-lg` : ""}`}
                style={currentPage !== "rankings" ? { background: currentTheme.cardBg, color: currentTheme.textMuted } : {}}
              >
                🏆 {t("rankings")}
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {currentPage === "rankings" && (
              <input 
                type="text" 
                placeholder={t("searchPlayer")} 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="hidden md:block w-[200px] px-4 py-2 rounded-xl text-sm focus:outline-none transition-all"
                style={{ background: currentTheme.cardBg, border: `1px solid ${currentTheme.border}`, color: currentTheme.text }}
              />
            )}

            {/* 🌍 DİL SEÇİCİ */}
            <div className="relative">
              <button
                onClick={() => { setLangMenuOpen(!langMenuOpen); setThemeMenuOpen(false); }}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105"
                style={{ background: currentTheme.cardBg, border: `1px solid ${currentTheme.border}`, color: currentTheme.text }}
              >
                <span className="text-base">{LANGUAGES[language].flag}</span>
                <span className="hidden sm:inline text-xs font-bold">{LANGUAGES[language].code}</span>
              </button>
              <AnimatePresence>
                {langMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-44 rounded-xl shadow-2xl overflow-hidden z-50"
                    style={{ background: currentTheme.cardBg, border: `1px solid ${currentTheme.border}` }}
                  >
                    {Object.entries(LANGUAGES).map(([key, lang]) => (
                      <button
                        key={key}
                        onClick={() => { setLanguage(key as LangKey); setLangMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all hover:scale-[1.02] ${
                          language === key ? `bg-gradient-to-r ${currentTheme.primaryGradient} text-white` : ""
                        }`}
                        style={language !== key ? { color: currentTheme.text } : {}}
                      >
                        <span className="text-xl">{lang.flag}</span>
                        <div className="flex-1 text-left">
                          <div className="font-semibold">{lang.name}</div>
                          <div className="text-[10px] opacity-60">{lang.code}</div>
                        </div>
                        {language === key && <span>✓</span>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 🎨 TEMA SEÇİCİ */}
            <div className="relative">
              <button
                onClick={() => { setThemeMenuOpen(!themeMenuOpen); setLangMenuOpen(false); }}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105"
                style={{ background: currentTheme.cardBg, border: `1px solid ${currentTheme.border}`, color: currentTheme.text }}
              >
                <span className="text-base">{currentTheme.emoji}</span>
                <span className="hidden sm:inline text-xs font-bold">{currentTheme.name}</span>
              </button>
              <AnimatePresence>
                {themeMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-52 rounded-xl shadow-2xl overflow-hidden z-50"
                    style={{ background: currentTheme.cardBg, border: `1px solid ${currentTheme.border}` }}
                  >
                    <div className="px-4 py-2 text-[10px] uppercase font-bold tracking-widest" style={{ color: currentTheme.textMuted, borderBottom: `1px solid ${currentTheme.border}` }}>
                      {t("theme")}
                    </div>
                    {Object.entries(THEMES).map(([key, th]) => (
                      <button
                        key={key}
                        onClick={() => { setTheme(key as ThemeKey); setThemeMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all hover:scale-[1.02] ${
                          theme === key ? `bg-gradient-to-r ${th.primaryGradient} text-white` : ""
                        }`}
                        style={theme !== key ? { color: currentTheme.text } : {}}
                      >
                        <span className="text-xl">{th.emoji}</span>
                        <div className="flex-1 text-left">
                          <div className="font-semibold">{th.name}</div>
                          <div className="flex gap-1 mt-1">
                            <div className="w-3 h-3 rounded-full" style={{ background: th.primary }}></div>
                            <div className="w-3 h-3 rounded-full" style={{ background: th.accent }}></div>
                          </div>
                        </div>
                        {theme === key && <span>✓</span>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <a href="https://discord.gg/cKFwKcfcWn" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-[#5865F2] hover:bg-[#4752c4] rounded-xl text-sm font-medium transition-all text-white">
              <DiscordIcon className="w-5 h-5" />
              <span className="hidden sm:inline">{t("discord")}</span>
            </a>
          </div>
        </div>
      </header>

      {/* Click outside to close menus */}
      {(themeMenuOpen || langMenuOpen) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => { setThemeMenuOpen(false); setLangMenuOpen(false); }}
        />
      )}

      <AnimatePresence mode="wait">
        <motion.div key={currentPage} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
          
          {currentPage === "home" && (
            <main className="relative z-10 max-w-[1600px] mx-auto px-4 py-12">
              <div className="text-center mb-20">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6"
                  style={{ background: `${currentTheme.primary}15`, border: `1px solid ${currentTheme.primary}30`, color: currentTheme.primary }}
                >
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: currentTheme.primary }}></span>
                  {t("pvpPlatform")}
                </motion.div>
                
                <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl md:text-8xl font-black mb-6 leading-tight">
                  <span className="inline-block animated-gradient-text">ABYSSAL OCEAN</span>
                  <br />
                  <span className="inline-block">
                    {"TIER LIST".split("").map((char, i) => (
                      <span key={i} className="inline-block tier-letter" style={{ animationDelay: `${i * 0.1}s`, color: isLight ? "#1a1a1a" : "white" }}>
                        {char === " " ? "\u00A0" : char}
                      </span>
                    ))}
                  </span>
                </motion.h1>
                
                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-lg md:text-xl max-w-2xl mx-auto mb-10" style={{ color: currentTheme.textMuted }}>
                  {t("chooseLevel")}
                </motion.p>
                
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-center gap-4">
                  <button onClick={() => setCurrentPage("rankings")} className={`px-8 py-4 bg-gradient-to-r ${currentTheme.primaryGradient} rounded-xl font-bold text-lg transition-all shadow-lg hover:scale-105 text-white`}>🏆 {t("viewRankings")}</button>
                  <a href="https://discord.gg/cKFwKcfcWn" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-[#5865F2] rounded-xl font-bold text-lg transition-all flex items-center gap-2 shadow-lg hover:scale-105 text-white"><DiscordIcon className="w-6 h-6" /> {t("joinServer")}</a>
                </motion.div>
              </div>

              <div className="mb-20">
                <div className="text-center mb-12">
                  <h2 className="text-4xl md:text-5xl font-black mb-4">{t("kitsTitle")}</h2>
                  <p className="text-lg" style={{ color: currentTheme.textMuted }}>{t("kitsSubtitle")}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  {Object.entries(KITS).map(([key, kit], i) => (
                    <motion.div 
                      key={key} 
                      initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                      animate={{ opacity: 1, scale: 1, y: 0 }} 
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="group relative rounded-2xl p-6 transition-all cursor-pointer overflow-hidden"
                      onClick={() => { setCurrentPage("rankings"); setSelectedKit(key as KitKey); }}
                      style={{ background: currentTheme.cardBg, border: `1px solid ${currentTheme.border}` }}
                    >
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                        style={{ background: `radial-gradient(circle at top, ${kit.color}40, transparent 70%)` }}
                      />
                      <div className="relative z-10">
                        <div className="mb-4 flex justify-center">
                          <div 
                            className="w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all group-hover:scale-110"
                            style={{ 
                              background: `linear-gradient(135deg, ${kit.color}15, ${kit.color}05)`,
                              borderColor: `${kit.color}30`
                            }}
                          >
                            {kit.icon}
                          </div>
                        </div>
                        <h3 className="text-2xl font-black mb-2 text-center transition-colors">{kit.ad}</h3>
                        <p className="text-sm font-semibold text-center mb-3" style={{ color: kit.color }}>
                          {kit.description[language]}
                        </p>
                        <p className="text-xs text-center leading-relaxed" style={{ color: currentTheme.textMuted }}>{kit.detail[language]}</p>
                        <div className="mt-4 pt-4 text-center" style={{ borderTop: `1px solid ${currentTheme.border}` }}>
                          <span className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: currentTheme.primary }}>
                            {t("seeRankings")}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className={`relative bg-gradient-to-br ${currentTheme.primaryGradient} rounded-3xl p-10 md:p-14 text-center text-white`} style={{ opacity: 0.95 }}>
                <h2 className="text-4xl md:text-6xl font-black mb-4">{t("ready")}</h2>
                <p className="text-lg mb-8 text-white/90">{t("joinDiscord")}</p>
                <a href="https://discord.gg/cKFwKcfcWn" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-10 py-5 bg-[#5865F2] rounded-xl font-bold text-xl transition-all shadow-2xl hover:scale-105"><DiscordIcon className="w-7 h-7" /> {t("joinNow")}</a>
              </div>
            </main>
          )}

          {currentPage === "rankings" && (
            <main className="relative z-10 max-w-[1600px] mx-auto px-4 py-6">
              
              <div className="flex items-center justify-end gap-2 mb-6 overflow-x-auto scrollbar-hide">
                <span className="text-sm whitespace-nowrap flex items-center gap-1.5" style={{ color: currentTheme.textMuted }}>
                  <span className="text-base">🌐</span> {t("region")}:
                </span>
                {Object.entries(REGIONS).map(([key, r]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedRegion(key)}
                    className={`group relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all hover:scale-105 ${
                      selectedRegion === key
                        ? `bg-gradient-to-r ${currentTheme.primaryGradient} text-white shadow-lg`
                        : ""
                    }`}
                    style={selectedRegion !== key ? { background: currentTheme.cardBg, color: currentTheme.textMuted, border: `1px solid ${currentTheme.border}` } : {}}
                  >
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${selectedRegion === key ? "bg-white/20 text-white" : "bg-white/10"}`}>
                      {r.code}
                    </span>
                    <span>{r.name[language]}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <span className="text-sm" style={{ color: currentTheme.textMuted }}>{t("sortBy")}:</span>
                  {[
                    {key:"rank",label:t("sortRank")},
                    {key:"points",label:t("sortPoints")},
                    {key:"name",label:t("sortName")},
                    {key:"tests",label:t("sortTests")}
                  ].map(opt => (
                    <button 
                      key={opt.key} 
                      onClick={() => setSortType(opt.key as SortType)} 
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${sortType === opt.key ? `bg-gradient-to-r ${currentTheme.primaryGradient} text-white shadow-lg` : ""}`}
                      style={sortType !== opt.key ? { background: currentTheme.cardBg, color: currentTheme.textMuted } : {}}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="text-sm" style={{ color: currentTheme.textMuted }}>{t("totalPlayers", { count: kitPlayers.length })}</div>
              </div>

              <div className="mb-6 overflow-x-auto">
                <div className="flex items-center gap-2 min-w-max pb-2">
                  {KIT_ORDER.map(key => {
                    const isOverall = key === "overall";
                    const kit = isOverall ? { ad: "Overall", icon: <span className="text-xl">🏆</span> } : KITS[key];
                    const isActive = selectedKit === key;
                    return (
                      <button 
                        key={key} 
                        onClick={() => setSelectedKit(key)} 
                        className={`px-5 py-3 rounded-2xl font-medium transition-all whitespace-nowrap flex items-center gap-2 hover:scale-105 ${isActive ? `bg-gradient-to-r ${currentTheme.primaryGradient} text-white shadow-lg` : ""}`}
                        style={!isActive ? { background: currentTheme.cardBg, color: currentTheme.textMuted } : {}}
                      >
                        <div className="w-7 h-7 flex items-center justify-center">{kit.icon}</div>
                        <span className="text-sm font-semibold">{kit.ad}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedKit === "overall" ? (
                <div className="backdrop-blur-sm rounded-2xl overflow-hidden" style={{ background: `${currentTheme.cardBg}e6`, border: `1px solid ${currentTheme.border}` }}>
                  {currentPlayers.length === 0 ? (
                    <div className="py-20 text-center">
                      <div className="text-6xl mb-4 opacity-20">🏆</div>
                      <h3 className="text-xl font-bold" style={{ color: currentTheme.textMuted }}>{t("noPlayers")}</h3>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr style={{ borderBottom: `1px solid ${currentTheme.border}`, background: `${currentTheme.headerBg}80` }}>
                              <th className="text-left px-6 py-4 text-xs font-semibold uppercase w-16" style={{ color: currentTheme.textMuted }}>#</th>
                              <th className="text-left px-6 py-4 text-xs font-semibold uppercase" style={{ color: currentTheme.textMuted }}>{t("player")}</th>
                              <th className="text-center px-6 py-4 text-xs font-semibold uppercase" style={{ color: currentTheme.textMuted }}>{t("region")}</th>
                              <th className="text-right px-6 py-4 text-xs font-semibold uppercase" style={{ color: currentTheme.textMuted }}>{t("tiers")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentPlayers.map((player, idx) => {
                              const displayRank = sortType === "rank" ? player.rank : (currentPageRank - 1) * playersPerPage + idx + 1;
                              return (
                                <motion.tr 
                                  key={player.id} 
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.03 }}
                                  onClick={() => setSelectedPlayer(player)} 
                                  className="group cursor-pointer transition-all hover:bg-white/5"
                                  style={{ borderTop: `1px solid ${currentTheme.border}` }}
                                >
                                  <td className="px-6 py-4">
                                    {displayRank <= 3 ? (
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${displayRank === 1 ? "bg-gradient-to-br from-amber-400 to-yellow-600 text-black" : displayRank === 2 ? "bg-gradient-to-br from-slate-300 to-slate-500 text-black" : "bg-gradient-to-br from-orange-600 to-amber-700 text-white"}`}>{displayRank}</div>
                                    ) : (
                                      <span className="w-10 text-center text-xl font-bold block" style={{ color: currentTheme.textMuted }}>{displayRank}</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                      <img src={player.avatar} alt="" className="w-12 h-12 rounded-xl ring-2 transition-all" style={{ boxShadow: `0 0 0 2px ${currentTheme.border}` }} onError={(e) => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/Steve/64`; }} />
                                      <div className="min-w-0 flex-1">
                                        <h3 className="font-bold text-lg transition-colors truncate" style={{ color: currentTheme.text }}>{player.minecraftNick || player.username}</h3>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap player-info-row">
                                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md transition-all ${
                                            player.totalPoints >= 200 
                                              ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" 
                                              : player.totalPoints >= 100 
                                              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" 
                                              : "bg-white/5 border border-white/10"
                                          }`} style={player.totalPoints < 100 ? { color: currentTheme.textMuted } : {}}>
                                            {getTitle(player.totalPoints, t)}
                                          </span>
                                          <span className="text-xs font-black px-2 py-0.5 rounded-md flex items-center gap-1" style={{ background: `${currentTheme.primary}15`, color: currentTheme.primary, border: `1px solid ${currentTheme.primary}30` }}>
                                            <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: currentTheme.primary }}></span>
                                            {player.totalPoints} {t("points")}
                                          </span>
                                          <span className="text-xs font-medium text-[#5865F2] px-2 py-0.5 bg-[#5865F2]/10 rounded-md border border-[#5865F2]/20 flex items-center gap-1">
                                            <DiscordIcon className="w-3 h-3" />
                                            @{player.username}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex justify-center">
                                      <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-black bg-gradient-to-br ${REGIONS[player.region]?.color || "from-gray-500 to-gray-600"} text-white shadow-lg min-w-[44px] group-hover:scale-110 transition-transform`}>
                                        {REGIONS[player.region]?.code || player.region}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2 flex-wrap">
                                      {Object.entries(KITS).map(([kitKey, kit]) => {
                                        const tier = player.tiers[kitKey];
                                        const displayTier = cleanTier(tier);
                                        return (
                                          <div key={kitKey} className="w-14 h-14 rounded-xl flex flex-col items-center justify-center transition-all hover:scale-110" style={{ background: currentTheme.headerBg, border: `1px solid ${currentTheme.border}` }}>
                                            <div className="w-7 h-7 flex items-center justify-center">{kit.icon}</div>
                                            {displayTier ? (
                                              <span className={`text-[10px] font-black leading-none mt-1 ${displayTier.startsWith("HT") ? "text-amber-400" : "text-cyan-400"}`}>{displayTier}</span>
                                            ) : (
                                              <span className="text-[10px] font-bold leading-none mt-1" style={{ color: currentTheme.textMuted, opacity: 0.4 }}>—</span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </td>
                                </motion.tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 py-4" style={{ borderTop: `1px solid ${currentTheme.border}` }}>
                          <button onClick={() => setCurrentPageRank(p => Math.max(1, p - 1))} disabled={currentPageRank === 1} className="px-4 py-2 rounded-lg disabled:opacity-30" style={{ background: currentTheme.cardBg, color: currentTheme.textMuted }}>{t("previous")}</button>
                          <span className="px-4 py-2 text-sm">{t("page", { current: currentPageRank, total: totalPages })}</span>
                          <button onClick={() => setCurrentPageRank(p => Math.min(totalPages, p + 1))} disabled={currentPageRank === totalPages} className="px-4 py-2 rounded-lg disabled:opacity-30" style={{ background: currentTheme.cardBg, color: currentTheme.textMuted }}>{t("next")}</button>
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
                      <div key={tierNum} className="rounded-2xl overflow-hidden" style={{ background: `${currentTheme.cardBg}e6`, border: `1px solid ${currentTheme.border}` }}>
                        <div className={`px-4 py-3 ${tierNum === 1 ? "bg-gradient-to-r from-amber-500/20 to-yellow-600/20" : tierNum === 2 ? "bg-gradient-to-r from-slate-500/20 to-slate-600/20" : tierNum === 3 ? "bg-gradient-to-r from-orange-600/20 to-amber-700/20" : tierNum === 4 ? "bg-gradient-to-r from-red-500/20 to-orange-600/20" : "bg-gradient-to-r from-green-500/20 to-emerald-600/20"}`} style={{ borderBottom: `1px solid ${currentTheme.border}` }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2"><span className="text-xl">{emojis[tierNum]}</span><h3 className="font-bold">Tier {tierNum}</h3></div>
                            <span className="text-xs" style={{ color: currentTheme.textMuted }}>{tierPlayers.length}</span>
                          </div>
                        </div>
                        <div className="p-2 max-h-[600px] overflow-y-auto">
                          {tierPlayers.length === 0 ? (
                            <div className="py-16 text-center"><div className="text-3xl mb-2 opacity-20">👤</div><p className="text-xs" style={{ color: currentTheme.textMuted }}>—</p></div>
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
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold text-white bg-gradient-to-r ${TIER_COLORS[tierKey] || "from-gray-600 to-gray-700"}`}>{displayTier}</span>
                                        <span className="text-[10px]" style={{ color: currentTheme.textMuted }}>{getTierPoints(player.tiers[selectedKit])}p</span>
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
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${currentTheme.cardBg}, ${currentTheme.bg})`, border: `1px solid ${currentTheme.border}` }} onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6" style={{ borderBottom: `1px solid ${currentTheme.border}` }}>
              <div className="flex items-center gap-4">
                <img src={selectedPlayer.avatar} alt="" className="w-20 h-20 rounded-2xl ring-2" style={{ boxShadow: `0 0 0 2px ${currentTheme.border}` }} onError={(e) => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/Steve/64`; }} />
                <div>
                  <h2 className="text-2xl font-black">{selectedPlayer.minecraftNick || selectedPlayer.username}</h2>
                  <div className="text-sm mt-1 flex items-center gap-2 flex-wrap" style={{ color: currentTheme.textMuted }}>
                    <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-black bg-gradient-to-br ${REGIONS[selectedPlayer.region]?.color || "from-gray-500 to-gray-600"} text-white shadow`}>
                      {REGIONS[selectedPlayer.region]?.code}
                    </span>
                    <span>#{selectedPlayer.rank}</span>
                    <span>•</span>
                    <span className="font-bold" style={{ color: currentTheme.primary }}>{selectedPlayer.totalPoints} {t("points")}</span>
                  </div>
                  <div className="mt-1 text-sm" style={{ color: currentTheme.textMuted }}>Discord: <span style={{ color: currentTheme.primary }}>@{selectedPlayer.username}</span></div>
                </div>
              </div>
              <button onClick={() => setSelectedPlayer(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <h3 className="text-sm font-semibold uppercase mb-4" style={{ color: currentTheme.textMuted }}>{t("allKitTiers")}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(KITS).map(([kitKey, kit]) => {
                  const tier = selectedPlayer.tiers[kitKey];
                  const displayTier = cleanTier(tier);
                  const points = getTierPoints(tier);
                  const tierKey = displayTier as keyof typeof TIER_COLORS;
                  return (
                    <div key={kitKey} className="rounded-2xl p-4" style={{ background: currentTheme.headerBg, border: `1px solid ${currentTheme.border}` }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 flex items-center justify-center">{kit.icon}</div>
                        {displayTier ? (
                          <span className={`text-xs font-bold px-2 py-1 rounded-lg text-white bg-gradient-to-r ${TIER_COLORS[tierKey] || "from-gray-600 to-gray-700"}`}>{displayTier}</span>
                        ) : (
                          <span className="text-xs" style={{ color: currentTheme.textMuted }}>—</span>
                        )}
                      </div>
                      <div className="text-sm font-medium">{kit.ad}</div>
                      <div className="text-xs mt-1" style={{ color: currentTheme.textMuted }}>{points} {t("points")}</div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 pt-6 grid grid-cols-2 gap-4" style={{ borderTop: `1px solid ${currentTheme.border}` }}>
                <div className="text-center">
                  <div className="text-2xl font-black">{selectedPlayer.tests}</div>
                  <div className="text-xs mt-1" style={{ color: currentTheme.textMuted }}>{t("totalTests")}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black">{getHighestTier(selectedPlayer.tiers)}</div>
                  <div className="text-xs mt-1" style={{ color: currentTheme.textMuted }}>{t("highestTier")}</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <footer className="relative z-10 mt-20 backdrop-blur-sm" style={{ borderTop: `1px solid ${currentTheme.border}`, background: `${currentTheme.headerBg}80` }}>
        <div className="max-w-[1600px] mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="" className="h-10 w-10 rounded-lg object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div>
                <h3 className={`font-black text-sm bg-gradient-to-r ${currentTheme.primaryGradient} bg-clip-text text-transparent`}>ABYSSAL OCEAN</h3>
                <p className="text-[10px] tracking-widest" style={{ color: currentTheme.textMuted }}>TIER LIST</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm" style={{ color: currentTheme.textMuted }}>
              <a href="https://discord.gg/cKFwKcfcWn" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity flex items-center gap-1.5" style={{ color: currentTheme.primary }}>
                <DiscordIcon className="w-4 h-4" /> Discord
              </a>
              <span style={{ opacity: 0.3 }}>•</span>
              <span>{t("pvpTierList")}</span>
            </div>
            <div className="text-xs text-center md:text-right" style={{ color: currentTheme.textMuted }}>
              © {new Date().getFullYear()} Abyssal Ocean. {t("allRights")}.
              <br />
              <span style={{ opacity: 0.6 }}>{t("madeWith")}</span>
            </div>
          </div>
        </div>
      </footer>

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
          display: inline-block;
          animation: letterDrop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) backwards, letterGlow 3s ease-in-out infinite;
          transition: all 0.3s ease;
        }
        .tier-letter:hover {
          transform: translateY(-10px) scale(1.2);
          color: #22d3ee !important;
        }
        
        @keyframes slideInBadge {
          0% { opacity: 0; transform: translateX(-10px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .player-info-row > * {
          animation: slideInBadge 0.4s ease-out backwards;
        }
        .player-info-row > *:nth-child(1) { animation-delay: 0.05s; }
        .player-info-row > *:nth-child(2) { animation-delay: 0.15s; }
        .player-info-row > *:nth-child(3) { animation-delay: 0.25s; }
        
        .player-info-row > *:hover {
          transform: translateY(-2px) scale(1.05);
          transition: transform 0.2s ease;
        }
      `}</style>

      <AIChatBot />
    </div>
  );
}
