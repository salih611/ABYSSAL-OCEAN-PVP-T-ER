import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import AIChatBot from "./AIChatBot";

interface Player {
  id: string;
  username: string;
  discordId: string;
  avatar: string;
  region: "TR" | "EU" | "NA";
  tiers: Record<string, string>;
  peakTiers: Record<string, string>;
  totalPoints: number;
  peakPoints: number;
  rank: number;
  tests: number;
  minecraftNick: string;
}

type KitKey = "overall" | "vanilla" | "sword" | "axe" | "nethpot" | "pot" | "uhc" | "mace" | "smp";
type PageType = "home" | "rankings";
type SortType = "rank" | "points" | "name" | "tests";
type ThemeKey = "ocean" | "dark" | "sunset" | "forest";
type LangKey = "tr" | "en" | "de";

const UPSTASH_URL = 'https://adequate-loon-101577.upstash.io';
const UPSTASH_TOKEN = 'gQAAAAAAAYzJAAIgcDJhOWJiYWFhM2M2MmE0NThkYTJiMjZjZmM3ZDcxZWMwNA';

const THEMES: Record<ThemeKey, {
  name: string; emoji: string; bg: string; cardBg: string; headerBg: string;
  text: string; textMuted: string; border: string; primary: string;
  primaryGradient: string; accent: string; ctaGradient: string;
}> = {
  ocean: {
    name: "Ocean", emoji: "🌊", bg: "#0a0e14", cardBg: "#11161f", headerBg: "#0f141b",
    text: "#ffffff", textMuted: "rgba(255,255,255,0.6)", border: "rgba(255,255,255,0.05)",
    primary: "#22d3ee", primaryGradient: "from-cyan-500 to-blue-500", accent: "#3b82f6",
    ctaGradient: "from-cyan-600/30 via-blue-600/30 to-purple-600/30",
  },
  dark: {
    name: "Midnight", emoji: "🌙", bg: "#000000", cardBg: "#0a0a0a", headerBg: "#050505",
    text: "#ffffff", textMuted: "rgba(255,255,255,0.5)", border: "rgba(255,255,255,0.08)",
    primary: "#a855f7", primaryGradient: "from-purple-500 to-pink-500", accent: "#ec4899",
    ctaGradient: "from-purple-600/30 via-pink-600/30 to-rose-600/30",
  },
  sunset: {
    name: "Sunset", emoji: "🌅", bg: "#1a0f0a", cardBg: "#2a1810", headerBg: "#1f1208",
    text: "#fff5e6", textMuted: "rgba(255,245,230,0.6)", border: "rgba(255,165,0,0.1)",
    primary: "#f97316", primaryGradient: "from-orange-500 to-red-500", accent: "#dc2626",
    ctaGradient: "from-orange-600/30 via-red-600/30 to-pink-600/30",
  },
  forest: {
    name: "Forest", emoji: "🌲", bg: "#0a1410", cardBg: "#0f1f18", headerBg: "#0b1814",
    text: "#e8f5e9", textMuted: "rgba(232,245,233,0.6)", border: "rgba(34,197,94,0.1)",
    primary: "#22c55e", primaryGradient: "from-green-500 to-emerald-500", accent: "#16a34a",
    ctaGradient: "from-green-600/30 via-emerald-600/30 to-teal-600/30",
  },
};

const LANGUAGES: Record<LangKey, { name: string; flag: string; code: string }> = {
  tr: { name: "Türkçe", flag: "🇹🇷", code: "TR" },
  en: { name: "English", flag: "🇬🇧", code: "EN" },
  de: { name: "Deutsch", flag: "🇩🇪", code: "DE" },
};

const TRANSLATIONS: Record<LangKey, Record<string, string>> = {
  tr: {
    home: "Ana Sayfa", rankings: "Sıralamalar", discord: "Discord",
    searchPlayer: "Oyuncu ara...", pvpPlatform: "Türkiye'nin #1 PvP Platformu",
    chooseLevel: "Seviyeni Seç, Gücünü Kanıtla!", viewRankings: "Sıralamaları Gör",
    joinServer: "Sunucuya Katıl", kitsTitle: "Test Edebileceğin Kitler",
    kitsSubtitle: "8 farklı kit, kendi tarzını bul ve ustalaş!", ready: "Hazır mısın?",
    joinDiscord: "Discord sunucumuza katıl!", joinNow: "Hemen Katıl",
    region: "Bölge", sortBy: "Sırala", sortRank: "🏆 Sıra", sortPoints: "⭐ Puan",
    sortName: "📝 İsim", sortTests: "🎯 Test", totalPlayers: "Toplam {count} oyuncu",
    player: "Oyuncu", tiers: "Tierler", noPlayers: "Bu bölgede henüz oyuncu yok",
    previous: "◀ Önceki", next: "Sonraki ▶", page: "Sayfa {current}/{total}",
    points: "puan", allKitTiers: "Tüm Kit Tierleri", totalTests: "Toplam Test",
    highestTier: "En Yüksek Tier", theme: "Tema", language: "Dil",
    allRights: "Tüm hakları gizlidir", madeWith: "Türk PvP Topluluğu için 💙 ile yapıldı",
    pvpTierList: "Minecraft PvP Tier List", seeRankings: "Sıralamaları Gör →",
    loading: "Yükleniyor...", loadingMore: "Daha fazla yükleniyor...",
    shareCard: "Kartı Paylaş", downloadCard: "İndir", copyLink: "Linki Kopyala", linkCopied: "Link kopyalandı!",
    peakPoints: "Peak Puan", peak: "Peak", currentTier: "Şu Anki",
    installApp: "Uygulamayı Yükle", installPrompt: "Abyssal Ocean'ı telefonuna ekle!", installNow: "Yükle", later: "Sonra",
    intro_subtitle: "Seviyeni Seç, Gücünü Kanıtla!",
    intro_p1_a: "Gelişmekte olan", intro_p1_b: "Minecraft tier sunucumuz", intro_p1_c: "'da,",
    intro_p1_d: "8 farklı kit", intro_p1_e: "ile kendini test edip",
    intro_p1_f: "gerçek PvP seviyeni", intro_p1_g: "hemen öğrenebilirsin.",
    intro_p2_a: "Üstelik yeteneğine güveniyorsan sunucumuzda", intro_p2_b: "Tester",
    intro_p2_c: "olabilir ya da yönetim kadromuza katılarak", intro_p2_d: "yetkili", intro_p2_e: "olarak yer alabilirsin.",
    intro_cta: "Kitini seç ve bu maceraya ortak ol!",
    stat_kit: "Kit", stat_tier: "Tier", stat_region: "Bölge",
    title_legendary: "🏆 Efsanevi Savaşçı", title_master: "⚡ Usta Savaşçı",
    title_experienced: "🌟 Tecrübeli Savaşçı", title_expert: "📈 Uzman Savaşçı",
    title_novice: "🌱 Acemi Savaşçı", title_rookie: "🆕 Çaylak",
  },
  en: {
    home: "Home", rankings: "Rankings", discord: "Discord",
    searchPlayer: "Search player...", pvpPlatform: "Turkey's #1 PvP Platform",
    chooseLevel: "Choose Your Level, Prove Your Power!", viewRankings: "View Rankings",
    joinServer: "Join Server", kitsTitle: "Kits You Can Test",
    kitsSubtitle: "8 different kits, find your own style!", ready: "Are you ready?",
    joinDiscord: "Join our Discord server!", joinNow: "Join Now",
    region: "Region", sortBy: "Sort", sortRank: "🏆 Rank", sortPoints: "⭐ Points",
    sortName: "📝 Name", sortTests: "🎯 Tests", totalPlayers: "Total {count} players",
    player: "Player", tiers: "Tiers", noPlayers: "No players in this region yet",
    previous: "◀ Previous", next: "Next ▶", page: "Page {current}/{total}",
    points: "points", allKitTiers: "All Kit Tiers", totalTests: "Total Tests",
    highestTier: "Highest Tier", theme: "Theme", language: "Language",
    allRights: "All rights reserved", madeWith: "Made with 💙 for Turkish PvP Community",
    pvpTierList: "Minecraft PvP Tier List", seeRankings: "View Rankings →",
    loading: "Loading...", loadingMore: "Loading more...",
    shareCard: "Share Card", downloadCard: "Download", copyLink: "Copy Link", linkCopied: "Link copied!",
    peakPoints: "Peak Points", peak: "Peak", currentTier: "Current",
    installApp: "Install App", installPrompt: "Add Abyssal Ocean to your phone!", installNow: "Install", later: "Later",
    intro_subtitle: "Choose Your Level, Prove Your Power!",
    intro_p1_a: "On our developing", intro_p1_b: "Minecraft tier server", intro_p1_c: ",",
    intro_p1_d: "8 different kits", intro_p1_e: "let you test yourself and discover your",
    intro_p1_f: "true PvP level", intro_p1_g: "instantly.",
    intro_p2_a: "If you trust your skills, you can become a", intro_p2_b: "Tester",
    intro_p2_c: "on our server, or join our management team as a", intro_p2_d: "staff member", intro_p2_e: ".",
    intro_cta: "Choose your kit and join this adventure!",
    stat_kit: "Kit", stat_tier: "Tier", stat_region: "Region",
    title_legendary: "🏆 Legendary Warrior", title_master: "⚡ Master Warrior",
    title_experienced: "🌟 Experienced Warrior", title_expert: "📈 Expert Warrior",
    title_novice: "🌱 Novice Warrior", title_rookie: "🆕 Rookie",
  },
  de: {
    home: "Startseite", rankings: "Ranglisten", discord: "Discord",
    searchPlayer: "Spieler suchen...", pvpPlatform: "Die #1 PvP-Plattform der Türkei",
    chooseLevel: "Wähle dein Level, beweise deine Stärke!", viewRankings: "Ranglisten ansehen",
    joinServer: "Server beitreten", kitsTitle: "Kits zum Testen",
    kitsSubtitle: "8 verschiedene Kits, finde deinen Stil!", ready: "Bist du bereit?",
    joinDiscord: "Tritt unserem Discord bei!", joinNow: "Jetzt beitreten",
    region: "Region", sortBy: "Sortieren", sortRank: "🏆 Rang", sortPoints: "⭐ Punkte",
    sortName: "📝 Name", sortTests: "🎯 Tests", totalPlayers: "Insgesamt {count} Spieler",
    player: "Spieler", tiers: "Stufen", noPlayers: "Noch keine Spieler in dieser Region",
    previous: "◀ Zurück", next: "Weiter ▶", page: "Seite {current}/{total}",
    points: "Punkte", allKitTiers: "Alle Kit-Stufen", totalTests: "Gesamttests",
    highestTier: "Höchste Stufe", theme: "Theme", language: "Sprache",
    allRights: "Alle Rechte vorbehalten", madeWith: "Mit 💙 für die türkische PvP-Community",
    pvpTierList: "Minecraft PvP Stufenliste", seeRankings: "Ranglisten ansehen →",
    loading: "Wird geladen...", loadingMore: "Mehr wird geladen...",
    shareCard: "Karte teilen", downloadCard: "Herunterladen", copyLink: "Link kopieren", linkCopied: "Link kopiert!",
    peakPoints: "Peak-Punkte", peak: "Peak", currentTier: "Aktuell",
    installApp: "App installieren", installPrompt: "Füge Abyssal Ocean zu deinem Handy hinzu!", installNow: "Installieren", later: "Später",
    intro_subtitle: "Wähle dein Level, beweise deine Stärke!",
    intro_p1_a: "Auf unserem aufstrebenden", intro_p1_b: "Minecraft-Tier-Server", intro_p1_c: "kannst du dich mit",
    intro_p1_d: "8 verschiedenen Kits", intro_p1_e: "testen und dein",
    intro_p1_f: "echtes PvP-Level", intro_p1_g: "sofort herausfinden.",
    intro_p2_a: "Wenn du deinen Fähigkeiten vertraust, kannst du auf unserem Server", intro_p2_b: "Tester",
    intro_p2_c: "werden oder unserem Management-Team als", intro_p2_d: "Mitarbeiter", intro_p2_e: "beitreten.",
    intro_cta: "Wähle dein Kit und sei Teil dieses Abenteuers!",
    stat_kit: "Kit", stat_tier: "Stufe", stat_region: "Region",
    title_legendary: "🏆 Legendärer Krieger", title_master: "⚡ Meisterkrieger",
    title_experienced: "🌟 Erfahrener Krieger", title_expert: "📈 Expertenkrieger",
    title_novice: "🌱 Anfänger Krieger", title_rookie: "🆕 Neuling",
  },
};

const KITS: Record<string, { ad: string; icon: JSX.Element; color: string; description: Record<LangKey, string>; detail: Record<LangKey, string> }> = {
  vanilla: { ad: "Vanilla", icon: <img src="https://www.tierslist.net/tier_icons/vanilla.svg" width="30" height="30" alt="" className="w-7 h-7" />, color: "#fbbf24", description: { tr: "Saf Yetenek Savaşı", en: "Pure Skill Battle", de: "Reiner Skill-Kampf" }, detail: { tr: "Hiçbir ekipman yok, sadece yumruklarınla rakibini alt et. Refleks, taktik ve cesaret testi!", en: "No equipment, defeat your opponent with just your fists. Reflex, tactics and courage test!", de: "Keine Ausrüstung, besiege deinen Gegner nur mit deinen Fäusten." } },
  sword: { ad: "Sword", icon: <img src="https://www.tierslist.net/tier_icons/sword.svg" width="30" height="30" alt="" className="w-7 h-7" />, color: "#60a5fa", description: { tr: "Kılıç Ustalığı", en: "Sword Mastery", de: "Schwertbeherrschung" }, detail: { tr: "Klasik kılıç savaşı! Combo, timing ve crit vuruşların ustalığını sergile.", en: "Classic sword battle! Show your mastery of combos, timing and crit hits.", de: "Klassischer Schwertkampf!" } },
  axe: { ad: "Axe", icon: <img src="https://www.tierslist.net/tier_icons/axe.svg" width="30" height="30" alt="" className="w-7 h-7" />, color: "#a78bfa", description: { tr: "Ağır Darbe Sanatı", en: "Heavy Strike Art", de: "Schwere Schlagkunst" }, detail: { tr: "Yüksek hasar, kalkan kırma! Stratejik vuruşlarla rakibinin savunmasını çök.", en: "High damage, shield breaking!", de: "Hoher Schaden, Schildbruch!" } },
  nethpot: { ad: "NethOP", icon: <img src="https://www.tierslist.net/tier_icons/nethop.svg" width="30" height="30" alt="" className="w-7 h-7" />, color: "#ec4899", description: { tr: "Netherite Üstünlüğü", en: "Netherite Supremacy", de: "Netherite-Vorherrschaft" }, detail: { tr: "En güçlü zırh ve silahlarla efsanevi savaşlar. Pot kullanımı ve OP gear yönetimi şart!", en: "Legendary battles with the strongest armor.", de: "Legendäre Kämpfe mit stärkster Rüstung." } },
  pot: { ad: "Pot", icon: <img src="https://www.tierslist.net/tier_icons/pot.svg" width="30" height="30" alt="" className="w-7 h-7" />, color: "#f43f5e", description: { tr: "Pot PvP Sanatı", en: "Pot PvP Art", de: "Trank-PvP Kunst" }, detail: { tr: "Şifa iksirleri, hız ve güç potions! Hızlı refleks ve pot yönetimi ustalığı.", en: "Healing potions, speed and power potions!", de: "Heiltränke, Geschwindigkeit!" } },
  uhc: { ad: "UHC", icon: <img src="https://www.tierslist.net/tier_icons/uhc.svg" width="30" height="30" alt="" className="w-7 h-7" />, color: "#ef4444", description: { tr: "Ultra Hardcore", en: "Ultra Hardcore", de: "Ultra Hardcore" }, detail: { tr: "Doğal yenilenme yok! Golden apple ile hayatta kal, her vuruş kritik önem taşır.", en: "No natural regen! Survive with golden apples.", de: "Keine natürliche Regeneration!" } },
  smp: { ad: "SMP", icon: <img src="https://www.tierslist.net/tier_icons/smp.svg" width="30" height="30" alt="" className="w-7 h-7" />, color: "#22c55e", description: { tr: "Survival Multiplayer", en: "Survival Multiplayer", de: "Survival Multiplayer" }, detail: { tr: "Gerçek survival deneyimi! Crystal, totem, elytra - tüm modern SMP araçlarıyla savaş.", en: "Real survival experience!", de: "Echtes Survival-Erlebnis!" } },
  mace: { ad: "Mace", icon: <img src="https://www.tierslist.net/tier_icons/mace.svg" width="30" height="30" alt="" className="w-7 h-7" />, color: "#eab308", description: { tr: "Çekiç Gücü", en: "Mace Power", de: "Streitkolben-Macht" }, detail: { tr: "1.21'in yeni efsanevi silahı! Yükseklikten saldır, ağır hasar ver, alanı kontrol et.", en: "The legendary new weapon of 1.21!", de: "Die legendäre neue Waffe von 1.21!" } },
};

const TIER_POINTS: Record<string, number> = { "HT1": 60, "LT1": 44, "HT2": 28, "LT2": 16, "HT3": 10, "LT3": 6, "HT4": 4, "LT4": 3, "HT5": 2, "LT5": 1 };
const TIER_ORDER: Record<string, number> = { "HT1": 100, "LT1": 99, "HT2": 90, "LT2": 89, "HT3": 80, "LT3": 79, "HT4": 70, "LT4": 69, "HT5": 60, "LT5": 59 };

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

const getTierRank = (tier: string | undefined | null): number => {
  const cleaned = cleanTier(tier);
  if (!cleaned) return -1;
  return TIER_ORDER[cleaned] ?? -1;
};

const calculateTotalPoints = (tiers: Record<string, string>): number => {
  if (!tiers) return 0;
  let total = 0;
  for (const tier of Object.values(tiers)) total += getTierPoints(tier);
  return total;
};

// 🆕 PEAK RANK: current > peak ise güncelle
const updatePeakTiers = (current: Record<string, string>, peak: Record<string, string> = {}): Record<string, string> => {
  const newPeak = { ...peak };
  Object.entries(current || {}).forEach(([kit, tier]) => {
    if (getTierRank(tier) > getTierRank(newPeak[kit])) {
      newPeak[kit] = tier;
    }
  });
  return newPeak;
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
  for (const tier of Object.values(tiers || {})) {
    const cleaned = cleanTier(tier);
    if (cleaned && TIER_ORDER[cleaned] !== undefined && TIER_ORDER[cleaned] > highestValue) {
      highestValue = TIER_ORDER[cleaned];
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
  const bubbles = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
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
          }} />
      ))}
    </div>
  );
};

const SkeletonRow = ({ theme }: { theme: typeof THEMES[ThemeKey] }) => (
  <tr style={{ borderTop: `1px solid ${theme.border}` }}>
    <td className="px-3 md:px-6 py-4"><div className="w-8 h-8 md:w-10 md:h-10 rounded-xl skeleton-pulse" style={{ background: theme.cardBg }}></div></td>
    <td className="px-3 md:px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl skeleton-pulse" style={{ background: theme.cardBg }}></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 md:h-5 w-24 md:w-32 rounded skeleton-pulse" style={{ background: theme.cardBg }}></div>
          <div className="flex gap-2"><div className="h-3 w-16 rounded skeleton-pulse" style={{ background: theme.cardBg }}></div></div>
        </div>
      </div>
    </td>
    <td className="px-3 md:px-6 py-4 hidden md:table-cell"><div className="w-12 h-7 rounded-lg mx-auto skeleton-pulse" style={{ background: theme.cardBg }}></div></td>
    <td className="px-3 md:px-6 py-4">
      <div className="flex justify-end gap-2">
        {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="w-10 h-10 md:w-14 md:h-14 rounded-xl skeleton-pulse" style={{ background: theme.cardBg }}></div>))}
      </div>
    </td>
  </tr>
);

const ShareCardModal = ({ player, theme, t, onClose }: { player: Player; theme: typeof THEMES[ThemeKey]; t: (key: string) => string; onClose: () => void; }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const downloadCard = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 3, useCORS: true, allowTaint: true, logging: false });
      canvas.toBlob((blob) => {
        if (!blob) { setDownloading(false); return; }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${player.minecraftNick || player.username}-abyssal-ocean.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setDownloading(false);
      }, 'image/png', 1.0);
    } catch (e) { console.error('İndirme hatası:', e); setDownloading(false); alert('İndirme başarısız!'); }
  };

  const copyLink = () => {
    const url = `${window.location.origin}?player=${player.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = url; document.body.appendChild(textarea);
      textarea.select(); document.execCommand('copy'); document.body.removeChild(textarea);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div ref={cardRef} className="rounded-3xl overflow-hidden shadow-2xl" style={{ background: `linear-gradient(135deg, ${theme.cardBg}, ${theme.bg})`, border: `2px solid ${theme.primary}` }}>
          <div className={`h-32 bg-gradient-to-br ${theme.primaryGradient} relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
          </div>
          <div className="px-6 -mt-16 relative">
            <img src={player.avatar} alt="" crossOrigin="anonymous" className="w-32 h-32 rounded-2xl ring-4 shadow-2xl mx-auto" style={{ boxShadow: `0 0 0 4px ${theme.bg}, 0 20px 60px ${theme.primary}40` }} onError={(e) => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/Steve/128`; }} />
          </div>
          <div className="px-6 pt-4 pb-6 text-center">
            <h2 className="text-3xl font-black mb-2" style={{ color: theme.text }}>{player.minecraftNick || player.username}</h2>
            <p className="text-sm mb-4" style={{ color: theme.textMuted }}>{getTitle(player.totalPoints, t)}</p>
            <div className="flex justify-center gap-2 mb-4 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-black bg-gradient-to-r ${REGIONS[player.region]?.color} text-white`}>{REGIONS[player.region]?.code}</span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-black text-white" style={{ background: theme.primary }}>#{player.rank}</span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-black" style={{ background: `${theme.primary}20`, color: theme.primary, border: `1px solid ${theme.primary}40` }}>{player.totalPoints} {t("points")}</span>
              {player.peakPoints > player.totalPoints && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-black bg-gradient-to-r from-amber-400 to-yellow-600 text-black">⭐ {player.peakPoints}</span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {Object.entries(KITS).slice(0, 8).map(([kitKey, kit]) => {
                const tier = cleanTier(player.tiers[kitKey]);
                const peakTier = cleanTier(player.peakTiers?.[kitKey]);
                const hasPeak = peakTier && peakTier !== tier && getTierRank(player.peakTiers?.[kitKey]) > getTierRank(player.tiers[kitKey]);
                return (
                  <div key={kitKey} className="rounded-lg p-2 relative" style={{ background: theme.headerBg, border: `1px solid ${theme.border}` }}>
                    {hasPeak && <div className="absolute -top-1 -right-1 text-[10px]">⭐</div>}
                    <div className="w-6 h-6 mx-auto flex items-center justify-center">{kit.icon}</div>
                    {tier ? (
                      <span className={`block text-[9px] font-black mt-1 ${tier.startsWith("HT") ? "text-amber-400" : "text-cyan-400"}`}>{tier}</span>
                    ) : (
                      <span className="block text-[9px] font-bold mt-1" style={{ color: theme.textMuted, opacity: 0.4 }}>—</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="pt-4 text-[10px] uppercase tracking-widest font-bold" style={{ color: theme.textMuted, borderTop: `1px solid ${theme.border}` }}>⚔️ ABYSSAL OCEAN TIER LIST ⚔️</div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={downloadCard} disabled={downloading} className={`flex-1 py-3 rounded-xl font-bold bg-gradient-to-r ${theme.primaryGradient} text-white transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2 text-sm md:text-base disabled:opacity-50`}>
            {downloading ? (<><div className="w-5 h-5 rounded-full border-2 border-white border-r-transparent animate-spin"></div>İndiriliyor...</>) : (<><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>{t("downloadCard")}</>)}
          </button>
          <button onClick={copyLink} className="flex-1 py-3 rounded-xl font-bold transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2 text-sm md:text-base" style={{ background: theme.cardBg, color: theme.text, border: `1px solid ${theme.border}` }}>
            {copied ? (<><svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{t("linkCopied")}</>) : (<><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>{t("copyLink")}</>)}
          </button>
        </div>
        <button onClick={onClose} className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </motion.div>
    </div>
  );
};

const useSecurityProtection = () => {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => { e.preventDefault(); return false; };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F12" || e.keyCode === 123) { e.preventDefault(); return false; }
      if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i")) { e.preventDefault(); return false; }
      if (e.ctrlKey && e.shiftKey && (e.key === "J" || e.key === "j")) { e.preventDefault(); return false; }
      if (e.ctrlKey && e.shiftKey && (e.key === "C" || e.key === "c")) { e.preventDefault(); return false; }
      if (e.ctrlKey && (e.key === "U" || e.key === "u")) { e.preventDefault(); return false; }
      if (e.ctrlKey && (e.key === "S" || e.key === "s")) { e.preventDefault(); return false; }
      if (e.ctrlKey && e.shiftKey && (e.key === "K" || e.key === "k")) { e.preventDefault(); return false; }
    };
    let devtoolsOpen = false;
    const threshold = 160;
    const detectDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      if (widthThreshold || heightThreshold) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          document.body.innerHTML = `<div style="position:fixed;inset:0;background:#0a0e14;color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:999999;font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:20px;"><div style="font-size:80px;margin-bottom:20px;">🛡️</div><h1 style="font-size:32px;margin:0 0 10px 0;background:linear-gradient(90deg,#22d3ee,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">ERİŞİM REDDEDİLDİ</h1><p style="color:rgba(255,255,255,0.6);margin:5px 0;max-width:500px;">Geliştirici araçları (DevTools) tespit edildi.</p><p style="color:rgba(255,255,255,0.6);margin:5px 0;max-width:500px;">Lütfen DevTools'u kapatıp sayfayı yenileyin.</p><button onclick="window.location.reload()" style="margin-top:30px;padding:12px 30px;background:linear-gradient(90deg,#22d3ee,#3b82f6);border:none;border-radius:12px;color:white;font-weight:bold;font-size:16px;cursor:pointer;">🔄 Sayfayı Yenile</button></div>`;
        }
      } else { devtoolsOpen = false; }
    };
    const consoleCheck = () => {
      const element = new Image();
      let warned = false;
      Object.defineProperty(element, 'id', { get: function () {
        if (!warned) { warned = true; console.clear();
          console.log("%c🛑 DUR!", "color: red; font-size: 60px; font-weight: bold;");
          console.log("%c⚠️ Bu bir geliştirici alanıdır!", "color: orange; font-size: 24px; font-weight: bold;");
          console.log("%c🌊 Abyssal Ocean Tier List - © 2025", "color: cyan; font-size: 14px;");
        }
        return '';
      }});
      console.log(element);
    };
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    const detectInterval = setInterval(detectDevTools, 1000);
    consoleCheck();
    const handleDragStart = (e: DragEvent) => { if ((e.target as HTMLElement).tagName === "IMG") e.preventDefault(); };
    document.addEventListener("dragstart", handleDragStart);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("dragstart", handleDragStart);
      clearInterval(detectInterval);
    };
  }, []);
};

const useRateLimit = () => {
  useEffect(() => {
    const requestCounts = new Map<string, { count: number; timestamp: number }>();
    const MAX_REQUESTS = 100;
    const TIME_WINDOW = 60000;
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = typeof args[0] === "string" ? args[0] : (args[0] as Request).url;
      const now = Date.now();
      const record = requestCounts.get(url);
      if (record) {
        if (now - record.timestamp < TIME_WINDOW) {
          record.count++;
          if (record.count > MAX_REQUESTS) { console.warn("⚠️ Rate limit aşıldı!"); throw new Error("Rate limit exceeded"); }
        } else { requestCounts.set(url, { count: 1, timestamp: now }); }
      } else { requestCounts.set(url, { count: 1, timestamp: now }); }
      return originalFetch.apply(window, args);
    };
    let clickCount = 0;
    let clickTimer: NodeJS.Timeout;
    const handleClick = () => {
      clickCount++;
      if (clickCount > 30) { console.warn("⚠️ Çok hızlı tıklıyorsun!"); return false; }
      clearTimeout(clickTimer);
      clickTimer = setTimeout(() => { clickCount = 0; }, 1000);
    };
    document.addEventListener("click", handleClick);
    return () => { window.fetch = originalFetch; document.removeEventListener("click", handleClick); };
  }, []);
};

// 🆕 PWA HOOK
const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // Service Worker kaydet
    if ('serviceWorker' in navigator) {
      const swCode = `
        const CACHE_NAME = 'abyssal-ocean-v1';
        const urlsToCache = ['/', '/logo.png'];
        self.addEventListener('install', (event) => {
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)));
        });
        self.addEventListener('fetch', (event) => {
          event.respondWith(caches.match(event.request).then((response) => response || fetch(event.request)));
        });
      `;
      const blob = new Blob([swCode], { type: 'application/javascript' });
      const swUrl = URL.createObjectURL(blob);
      navigator.serviceWorker.register(swUrl).catch(() => {});
    }

    // Manifest oluştur ve ekle
    const manifest = {
      name: "Abyssal Ocean Tier List",
      short_name: "Abyssal Ocean",
      description: "Türkiye'nin #1 PvP Tier List Platformu",
      start_url: "/",
      display: "standalone",
      background_color: "#0a0e14",
      theme_color: "#22d3ee",
      orientation: "portrait-primary",
      icons: [
        { src: "/logo.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
        { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
      ]
    };
    const stringManifest = JSON.stringify(manifest);
    const blob = new Blob([stringManifest], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(blob);
    let link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    link.href = manifestURL;

    // Theme color meta
    let themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.name = 'theme-color';
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.content = '#22d3ee';

    // Install prompt yakala
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowInstallBanner(true), 3000);
      }
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const dismissBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  return { showInstallBanner, installPWA, dismissBanner, canInstall: !!deferredPrompt };
};

export default function App() {
  useSecurityProtection();
  useRateLimit();
  const { showInstallBanner, installPWA, dismissBanner } = usePWA();

  const [currentPage, setCurrentPage] = useState<PageType>("home");
  const [selectedKit, setSelectedKit] = useState<KitKey>("overall");
  const [searchQuery, setSearchQuery] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [shareCardPlayer, setShareCardPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState<SortType>("rank");
  const [selectedRegion, setSelectedRegion] = useState<string>("TR");
  const [displayCount, setDisplayCount] = useState(20);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const [theme, setTheme] = useState<ThemeKey>(() => (localStorage.getItem("theme") as ThemeKey) || "ocean");
  const [language, setLanguage] = useState<LangKey>(() => (localStorage.getItem("language") as LangKey) || "tr");
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  useEffect(() => { localStorage.setItem("theme", theme); }, [theme]);
  useEffect(() => { localStorage.setItem("language", language); }, [language]);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let text = TRANSLATIONS[language][key] || TRANSLATIONS.tr[key] || key;
    if (params) Object.entries(params).forEach(([k, v]) => { text = text.replace(`{${k}}`, String(v)); });
    return text;
  }, [language]);

  const currentTheme = THEMES[theme];

  const fetchPlayers = async () => {
    try {
      const response = await fetch(`${UPSTASH_URL}/get/players`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      let rawPlayers: Player[] = [];
      if (data.result) {
        rawPlayers = JSON.parse(data.result);
        // 🆕 PEAK RANK UYGULAMA
        rawPlayers = rawPlayers.map(p => {
          const tiers = p.tiers || {};
          const peakTiers = updatePeakTiers(tiers, p.peakTiers || {});
          const totalPoints = calculateTotalPoints(tiers);
          const peakPoints = calculateTotalPoints(peakTiers);
          return {
            ...p, tiers, peakTiers, tests: p.tests || 0, totalPoints, peakPoints
          };
        });
        rawPlayers.sort((a, b) => b.totalPoints - a.totalPoints);
        let trRank = 0;
        rawPlayers = rawPlayers.map(p => {
          if (p.region === "TR") { trRank++; return { ...p, rank: trRank }; }
          return { ...p, rank: 0 };
        });
        
        // 🆕 Peak'leri Upstash'e geri kaydet (arka planda)
        fetch(`${UPSTASH_URL}/set/players`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(rawPlayers)
        }).catch(() => {});
      }
      setPlayers(rawPlayers);
    } catch (e) { setPlayers([]); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (players.length === 0) return;
    const urlParams = new URLSearchParams(window.location.search);
    const playerId = urlParams.get('player');
    if (playerId) {
      const foundPlayer = players.find(p => p.id === playerId || p.discordId === playerId);
      if (foundPlayer) { setCurrentPage("rankings"); setSelectedPlayer(foundPlayer); }
    }
  }, [players]);

  const regionPlayers = useMemo(() => players.filter(p => p.region === selectedRegion), [players, selectedRegion]);

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

  const visiblePlayers = useMemo(() => kitPlayers.slice(0, displayCount), [kitPlayers, displayCount]);

  useEffect(() => { setDisplayCount(20); setFocusedIndex(-1); }, [sortType, selectedKit, searchQuery, selectedRegion]);

  useEffect(() => {
    if (!loadMoreRef.current || selectedKit !== "overall") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayCount < kitPlayers.length && !loadingMore) {
          setLoadingMore(true);
          setTimeout(() => {
            setDisplayCount(prev => Math.min(prev + 20, kitPlayers.length));
            setLoadingMore(false);
          }, 300);
        }
      }, { threshold: 0.1, rootMargin: '300px' }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [displayCount, kitPlayers.length, selectedKit, loadingMore]);

  useEffect(() => {
    if (currentPage !== "rankings" || selectedKit !== "overall") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPlayer || shareCardPlayer) return;
      if (e.key === "ArrowDown") { e.preventDefault(); setFocusedIndex(prev => Math.min(prev + 1, visiblePlayers.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setFocusedIndex(prev => Math.max(prev - 1, 0)); }
      else if (e.key === "Enter" && focusedIndex >= 0) { e.preventDefault(); setSelectedPlayer(visiblePlayers[focusedIndex]); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, selectedKit, visiblePlayers, focusedIndex, selectedPlayer, shareCardPlayer]);

  useEffect(() => {
    if (focusedIndex >= 0) {
      const el = document.getElementById(`player-row-${focusedIndex}`);
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [focusedIndex]);

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
    <div className="min-h-screen w-full relative overflow-x-hidden transition-colors duration-500" style={{ background: currentTheme.bg, color: currentTheme.text }}>
      <Bubbles />
      
      <header className="relative z-50 sticky top-0 backdrop-blur-xl border-b transition-colors duration-500" style={{ background: `${currentTheme.headerBg}cc`, borderColor: currentTheme.border }}>
        <div className="max-w-[1600px] mx-auto px-3 md:px-4 py-3 flex items-center justify-between gap-2 md:gap-4">
          <div className="flex items-center gap-2 md:gap-3 cursor-pointer flex-shrink-0" onClick={() => setCurrentPage("home")}>
            <img src="/logo.png" alt="" className="h-9 w-9 md:h-12 md:w-12 rounded-xl object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div>
              <h1 className="text-base md:text-xl font-black tracking-tight leading-none">
                <span className={`bg-gradient-to-r ${currentTheme.primaryGradient} bg-clip-text text-transparent`}>ABYSSAL OCEAN</span>
              </h1>
              <p className="text-[9px] md:text-[11px] font-semibold tracking-widest mt-0.5" style={{ color: currentTheme.textMuted }}>TIER LIST</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            <button onClick={() => setCurrentPage("home")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === "home" ? `bg-gradient-to-r ${currentTheme.primaryGradient} text-white shadow-lg` : ""}`} style={currentPage !== "home" ? { background: currentTheme.cardBg, color: currentTheme.textMuted } : {}}>
              🏠 {t("home")}
            </button>
            <button onClick={() => setCurrentPage("rankings")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === "rankings" ? `bg-gradient-to-r ${currentTheme.primaryGradient} text-white shadow-lg` : ""}`} style={currentPage !== "rankings" ? { background: currentTheme.cardBg, color: currentTheme.textMuted } : {}}>
              🏆 {t("rankings")}
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {currentPage === "rankings" && (
              <input type="text" placeholder={t("searchPlayer")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-[180px] lg:w-[220px] px-4 py-2 rounded-xl text-sm focus:outline-none transition-all" style={{ background: currentTheme.cardBg, border: `1px solid ${currentTheme.border}`, color: currentTheme.text }} />
            )}
            <div className="relative">
              <button onClick={() => { setLangMenuOpen(!langMenuOpen); setThemeMenuOpen(false); }} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105" style={{ background: currentTheme.cardBg, border: `1px solid ${currentTheme.border}`, color: currentTheme.text }}>
                <span className="text-base">{LANGUAGES[language].flag}</span>
                <span className="text-xs font-bold">{LANGUAGES[language].code}</span>
              </button>
              <AnimatePresence>
                {langMenuOpen && (
                  <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} className="absolute right-0 top-full mt-2 w-44 rounded-xl shadow-2xl overflow-hidden z-50" style={{ background: currentTheme.cardBg, border: `1px solid ${currentTheme.border}` }}>
                    {Object.entries(LANGUAGES).map(([key, lang]) => (
                      <button key={key} onClick={() => { setLanguage(key as LangKey); setLangMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all hover:scale-[1.02] ${language === key ? `bg-gradient-to-r ${currentTheme.primaryGradient} text-white` : ""}`} style={language !== key ? { color: currentTheme.text } : {}}>
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
            <div className="relative">
              <button onClick={() => { setThemeMenuOpen(!themeMenuOpen); setLangMenuOpen(false); }} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105" style={{ background: currentTheme.cardBg, border: `1px solid ${currentTheme.border}`, color: currentTheme.text }}>
                <span className="text-base">{currentTheme.emoji}</span>
                <span className="text-xs font-bold">{currentTheme.name}</span>
              </button>
              <AnimatePresence>
                {themeMenuOpen && (
                  <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} className="absolute right-0 top-full mt-2 w-52 rounded-xl shadow-2xl overflow-hidden z-50" style={{ background: currentTheme.cardBg, border: `1px solid ${currentTheme.border}` }}>
                    <div className="px-4 py-2 text-[10px] uppercase font-bold tracking-widest" style={{ color: currentTheme.textMuted, borderBottom: `1px solid ${currentTheme.border}` }}>{t("theme")}</div>
                    {Object.entries(THEMES).map(([key, th]) => (
                      <button key={key} onClick={() => { setTheme(key as ThemeKey); setThemeMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all hover:scale-[1.02] ${theme === key ? `bg-gradient-to-r ${th.primaryGradient} text-white` : ""}`} style={theme !== key ? { color: currentTheme.text } : {}}>
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

          <div className="flex md:hidden items-center gap-2">
            {currentPage === "rankings" && (
              <button onClick={() => setMobileSearchOpen(!mobileSearchOpen)} className="p-2.5 rounded-xl transition-all" style={{ background: currentTheme.cardBg, border: `1px solid ${currentTheme.border}`, color: currentTheme.text }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
            )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2.5 rounded-xl transition-all" style={{ background: currentTheme.cardBg, border: `1px solid ${currentTheme.border}`, color: currentTheme.text }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />) : (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />)}
              </svg>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileSearchOpen && currentPage === "rankings" && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="md:hidden px-3 pb-3 overflow-hidden">
              <input type="text" placeholder={t("searchPlayer")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all" style={{ background: currentTheme.cardBg, border: `1px solid ${currentTheme.border}`, color: currentTheme.text }} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="md:hidden overflow-hidden border-t" style={{ borderColor: currentTheme.border, background: currentTheme.cardBg }}>
              <div className="p-3 space-y-2">
                <button onClick={() => { setCurrentPage("home"); setMobileMenuOpen(false); }} className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${currentPage === "home" ? `bg-gradient-to-r ${currentTheme.primaryGradient} text-white` : ""}`} style={currentPage !== "home" ? { background: currentTheme.headerBg, color: currentTheme.text } : {}}>
                  🏠 {t("home")}
                </button>
                <button onClick={() => { setCurrentPage("rankings"); setMobileMenuOpen(false); }} className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${currentPage === "rankings" ? `bg-gradient-to-r ${currentTheme.primaryGradient} text-white` : ""}`} style={currentPage !== "rankings" ? { background: currentTheme.headerBg, color: currentTheme.text } : {}}>
                  🏆 {t("rankings")}
                </button>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t" style={{ borderColor: currentTheme.border }}>
                  <div>
                    <div className="text-[10px] uppercase font-bold mb-1 px-1" style={{ color: currentTheme.textMuted }}>{t("language")}</div>
                    <div className="space-y-1">
                      {Object.entries(LANGUAGES).map(([key, lang]) => (
                        <button key={key} onClick={() => setLanguage(key as LangKey)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${language === key ? `bg-gradient-to-r ${currentTheme.primaryGradient} text-white` : ""}`} style={language !== key ? { background: currentTheme.headerBg, color: currentTheme.text } : {}}>
                          <span>{lang.flag}</span>
                          <span className="text-xs font-bold">{lang.code}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold mb-1 px-1" style={{ color: currentTheme.textMuted }}>{t("theme")}</div>
                    <div className="space-y-1">
                      {Object.entries(THEMES).map(([key, th]) => (
                        <button key={key} onClick={() => setTheme(key as ThemeKey)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${theme === key ? `bg-gradient-to-r ${th.primaryGradient} text-white` : ""}`} style={theme !== key ? { background: currentTheme.headerBg, color: currentTheme.text } : {}}>
                          <span>{th.emoji}</span>
                          <span className="text-xs font-bold">{th.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <a href="https://discord.gg/cKFwKcfcWn" target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#5865F2] rounded-lg text-sm font-bold text-white">
                  <DiscordIcon className="w-5 h-5" /> {t("discord")}
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {(themeMenuOpen || langMenuOpen) && (<div className="fixed inset-0 z-40" onClick={() => { setThemeMenuOpen(false); setLangMenuOpen(false); }} />)}

      <AnimatePresence mode="wait">
        <motion.div key={currentPage} initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -30, scale: 0.98 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
          
          {currentPage === "home" && (
            <main className="relative z-10 max-w-[1600px] mx-auto px-3 md:px-4 py-6 md:py-12">
              <div className="text-center mb-12 md:mb-20">
                <motion.div initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 200 }} whileHover={{ scale: 1.05 }} className="hero-badge inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold mb-4 md:mb-6 cursor-default" style={{ background: `${currentTheme.primary}15`, border: `1px solid ${currentTheme.primary}30`, color: currentTheme.primary }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: currentTheme.primary }}></span>
                  <span className="hero-badge-text">{t("pvpPlatform")}</span>
                </motion.div>
                <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black mb-4 md:mb-6 leading-tight">
                  <span className="inline-block animated-gradient-text">ABYSSAL OCEAN</span>
                  <br />
                  <span className="inline-block">
                    {"TIER LIST".split("").map((char, i) => (
                      <span key={i} className="inline-block tier-letter" style={{ animationDelay: `${i * 0.1}s`, color: "white" }}>{char === " " ? "\u00A0" : char}</span>
                    ))}
                  </span>
                </motion.h1>
                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-base md:text-xl max-w-2xl mx-auto mb-6 md:mb-10 hero-subtitle px-4" style={{ color: currentTheme.textMuted }}>
                  {t("chooseLevel").split(" ").map((word, i) => (
                    <span key={i} className="inline-block subtitle-word" style={{ animationDelay: `${0.5 + i * 0.1}s`, marginRight: "0.3em" }}>{word}</span>
                  ))}
                </motion.p>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 px-4">
                  <a href="https://discord.gg/cKFwKcfcWn" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-[#5865F2] rounded-xl font-bold text-base md:text-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-105 text-white">
                    <DiscordIcon className="w-5 h-5 md:w-6 md:h-6" /> {t("joinServer")}
                  </a>
                  <button onClick={() => setCurrentPage("rankings")} className={`w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r ${currentTheme.primaryGradient} rounded-xl font-bold text-base md:text-lg transition-all shadow-lg hover:scale-105 text-white flex items-center justify-center gap-2`}>
                    🏆 {t("viewRankings")}
                  </button>
                </motion.div>
              </div>

              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }} className="max-w-4xl mx-auto mb-12 md:mb-20 relative">
                <div className="relative rounded-2xl md:rounded-3xl p-6 md:p-12 overflow-hidden backdrop-blur-sm" style={{ background: `linear-gradient(135deg, ${currentTheme.cardBg}cc, ${currentTheme.bg}cc)`, border: `1px solid ${currentTheme.primary}30` }}>
                  <div className="absolute -top-20 -left-20 w-40 md:w-60 h-40 md:h-60 rounded-full opacity-20 blur-3xl" style={{ background: currentTheme.primary }}></div>
                  <div className="absolute -bottom-20 -right-20 w-40 md:w-60 h-40 md:h-60 rounded-full opacity-20 blur-3xl" style={{ background: currentTheme.accent }}></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-center gap-2 md:gap-3 mb-4 md:mb-6">
                      <div className="h-px flex-1 max-w-[40px] md:max-w-[60px]" style={{ background: `linear-gradient(to right, transparent, ${currentTheme.primary})` }}></div>
                      <h3 className={`text-xl md:text-3xl font-black bg-gradient-to-r ${currentTheme.primaryGradient} bg-clip-text text-transparent flex items-center gap-2`}>🌊 Abyssal Ocean</h3>
                      <div className="h-px flex-1 max-w-[40px] md:max-w-[60px]" style={{ background: `linear-gradient(to left, transparent, ${currentTheme.primary})` }}></div>
                    </div>
                    <p className="text-center text-base md:text-xl font-bold mb-4 md:mb-6" style={{ color: currentTheme.primary }}>{t("intro_subtitle")}</p>
                    <p className="text-center text-sm md:text-lg leading-relaxed mb-4 md:mb-6" style={{ color: currentTheme.textMuted }}>
                      {t("intro_p1_a")} <span className="font-bold" style={{ color: currentTheme.text }}>{t("intro_p1_b")}</span> <span className={`font-bold bg-gradient-to-r ${currentTheme.primaryGradient} bg-clip-text text-transparent`}>Abyssal Ocean</span>{t("intro_p1_c")} <span className="font-bold" style={{ color: currentTheme.text }}>{t("intro_p1_d")}</span> {t("intro_p1_e")} <span className="font-bold" style={{ color: currentTheme.text }}>{t("intro_p1_f")}</span> {t("intro_p1_g")}
                    </p>
                    <p className="text-center text-sm md:text-lg leading-relaxed mb-6 md:mb-8" style={{ color: currentTheme.textMuted }}>
                      {t("intro_p2_a")} <span className="font-bold text-amber-400">{t("intro_p2_b")}</span> {t("intro_p2_c")} <span className="font-bold text-purple-400">{t("intro_p2_d")}</span> {t("intro_p2_e")}
                    </p>
                    <p className="text-center text-base md:text-xl font-black" style={{ color: currentTheme.text }}>⚔️ {t("intro_cta")} ⚔️</p>
                    <div className="grid grid-cols-3 gap-2 md:gap-4 mt-6 md:mt-8 pt-6 md:pt-8" style={{ borderTop: `1px solid ${currentTheme.border}` }}>
                      <div className="text-center">
                        <div className={`text-2xl md:text-4xl font-black bg-gradient-to-r ${currentTheme.primaryGradient} bg-clip-text text-transparent`}>8</div>
                        <div className="text-[10px] md:text-xs uppercase tracking-wider mt-1" style={{ color: currentTheme.textMuted }}>{t("stat_kit")}</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl md:text-4xl font-black bg-gradient-to-r ${currentTheme.primaryGradient} bg-clip-text text-transparent`}>10</div>
                        <div className="text-[10px] md:text-xs uppercase tracking-wider mt-1" style={{ color: currentTheme.textMuted }}>{t("stat_tier")}</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl md:text-4xl font-black bg-gradient-to-r ${currentTheme.primaryGradient} bg-clip-text text-transparent`}>3</div>
                        <div className="text-[10px] md:text-xs uppercase tracking-wider mt-1" style={{ color: currentTheme.textMuted }}>{t("stat_region")}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <div className="mb-12 md:mb-20">
                <div className="text-center mb-8 md:mb-12">
                  <h2 className="text-3xl md:text-5xl font-black mb-2 md:mb-4">{t("kitsTitle")}</h2>
                  <p className="text-sm md:text-lg" style={{ color: currentTheme.textMuted }}>{t("kitsSubtitle")}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
                  {Object.entries(KITS).map(([key, kit], i) => (
                    <motion.div key={key} initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ scale: 1.05, y: -5 }} className="group relative rounded-2xl p-5 md:p-6 transition-all cursor-pointer overflow-hidden" onClick={() => { setCurrentPage("rankings"); setSelectedKit(key as KitKey); }} style={{ background: currentTheme.cardBg, border: `1px solid ${currentTheme.border}` }}>
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500" style={{ background: `radial-gradient(circle at top, ${kit.color}40, transparent 70%)` }} />
                      <div className="relative z-10">
                        <div className="mb-3 md:mb-4 flex justify-center">
                          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center border-2 transition-all group-hover:scale-110" style={{ background: `linear-gradient(135deg, ${kit.color}15, ${kit.color}05)`, borderColor: `${kit.color}30` }}>
                            {kit.icon}
                          </div>
                        </div>
                        <h3 className="text-xl md:text-2xl font-black mb-2 text-center transition-colors">{kit.ad}</h3>
                        <p className="text-xs md:text-sm font-semibold text-center mb-2 md:mb-3" style={{ color: kit.color }}>{kit.description[language]}</p>
                        <p className="text-[11px] md:text-xs text-center leading-relaxed" style={{ color: currentTheme.textMuted }}>{kit.detail[language]}</p>
                        <div className="mt-3 md:mt-4 pt-3 md:pt-4 text-center" style={{ borderTop: `1px solid ${currentTheme.border}` }}>
                          <span className="text-[11px] md:text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: currentTheme.primary }}>{t("seeRankings")}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className={`relative rounded-2xl md:rounded-3xl p-6 md:p-14 text-center overflow-hidden bg-gradient-to-br ${currentTheme.ctaGradient}`} style={{ border: `1px solid ${currentTheme.border}` }}>
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 1px, transparent 1px), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
                <div className="relative z-10">
                  <h2 className="text-3xl md:text-6xl font-black mb-3 md:mb-4" style={{ color: currentTheme.text }}>{t("ready")}</h2>
                  <p className="text-sm md:text-lg mb-6 md:mb-8" style={{ color: currentTheme.textMuted }}>{t("joinDiscord")}</p>
                  <a href="https://discord.gg/cKFwKcfcWn" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 md:gap-3 px-6 md:px-10 py-3 md:py-5 bg-[#5865F2] rounded-xl font-bold text-base md:text-xl transition-all shadow-2xl hover:scale-105 text-white">
                    <DiscordIcon className="w-5 h-5 md:w-7 md:h-7" /> {t("joinNow")}
                  </a>
                </div>
              </div>
            </main>
          )}

          {currentPage === "rankings" && (
            <main className="relative z-10 max-w-[1600px] mx-auto px-2 md:px-4 py-4 md:py-6">
              <div className="flex items-center justify-center md:justify-end gap-2 mb-4 md:mb-6 overflow-x-auto scrollbar-hide">
                {Object.entries(REGIONS).map(([key, r]) => (
                  <button key={key} onClick={() => setSelectedRegion(key)} className={`flex items-center px-4 md:px-5 py-2 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition-all hover:scale-105 ${selectedRegion === key ? `bg-gradient-to-r ${currentTheme.primaryGradient} text-white shadow-lg` : ""}`} style={selectedRegion !== key ? { background: currentTheme.cardBg, color: currentTheme.textMuted, border: `1px solid ${currentTheme.border}` } : {}}>
                    {r.name[language]}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1">
                  <span className="text-xs md:text-sm whitespace-nowrap" style={{ color: currentTheme.textMuted }}>{t("sortBy")}:</span>
                  {[{key:"rank",label:t("sortRank")},{key:"points",label:t("sortPoints")},{key:"name",label:t("sortName")},{key:"tests",label:t("sortTests")}].map(opt => (
                    <button key={opt.key} onClick={() => setSortType(opt.key as SortType)} className={`px-2.5 md:px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-medium whitespace-nowrap transition-all ${sortType === opt.key ? `bg-gradient-to-r ${currentTheme.primaryGradient} text-white shadow-lg` : ""}`} style={sortType !== opt.key ? { background: currentTheme.cardBg, color: currentTheme.textMuted } : {}}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="text-xs md:text-sm whitespace-nowrap" style={{ color: currentTheme.textMuted }}>{t("totalPlayers", { count: kitPlayers.length })}</div>
              </div>

              <div className="mb-4 md:mb-6 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-2 min-w-max pb-2">
                  {KIT_ORDER.map(key => {
                    const isOverall = key === "overall";
                    const kit = isOverall ? { ad: "Overall", icon: <span className="text-xl">🏆</span> } : KITS[key];
                    const isActive = selectedKit === key;
                    return (
                      <button key={key} onClick={() => setSelectedKit(key)} className={`px-3 md:px-5 py-2 md:py-3 rounded-xl md:rounded-2xl font-medium transition-all whitespace-nowrap flex items-center gap-1.5 md:gap-2 hover:scale-105 ${isActive ? `bg-gradient-to-r ${currentTheme.primaryGradient} text-white shadow-lg` : ""}`} style={!isActive ? { background: currentTheme.cardBg, color: currentTheme.textMuted } : {}}>
                        <div className="w-5 h-5 md:w-7 md:h-7 flex items-center justify-center">{kit.icon}</div>
                        <span className="text-xs md:text-sm font-semibold">{kit.ad}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedKit === "overall" ? (
                <div className="backdrop-blur-sm rounded-xl md:rounded-2xl overflow-hidden" style={{ background: `${currentTheme.cardBg}e6`, border: `1px solid ${currentTheme.border}` }}>
                  {kitPlayers.length === 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${currentTheme.border}`, background: `${currentTheme.headerBg}80` }}>
                            <th className="text-left px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-semibold uppercase w-12" style={{ color: currentTheme.textMuted }}>#</th>
                            <th className="text-left px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-semibold uppercase" style={{ color: currentTheme.textMuted }}>{t("player")}</th>
                            <th className="text-center px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-semibold uppercase hidden md:table-cell" style={{ color: currentTheme.textMuted }}>{t("region")}</th>
                            <th className="text-right px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-semibold uppercase" style={{ color: currentTheme.textMuted }}>{t("tiers")}</th>
                          </tr>
                        </thead>
                        <tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} theme={currentTheme} />)}</tbody>
                      </table>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr style={{ borderBottom: `1px solid ${currentTheme.border}`, background: `${currentTheme.headerBg}80` }}>
                              <th className="text-left px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-semibold uppercase w-12" style={{ color: currentTheme.textMuted }}>#</th>
                              <th className="text-left px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-semibold uppercase" style={{ color: currentTheme.textMuted }}>{t("player")}</th>
                              <th className="text-center px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-semibold uppercase hidden md:table-cell" style={{ color: currentTheme.textMuted }}>{t("region")}</th>
                              <th className="text-right px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-semibold uppercase" style={{ color: currentTheme.textMuted }}>{t("tiers")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {visiblePlayers.map((player, idx) => {
                              const displayRank = sortType === "rank" ? player.rank : idx + 1;
                              const isFocused = focusedIndex === idx;
                              return (
                                <motion.tr key={player.id} id={`player-row-${idx}`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(idx * 0.02, 0.5) }} onClick={() => setSelectedPlayer(player)} className={`group cursor-pointer transition-all hover:bg-white/5 ${isFocused ? 'bg-white/10' : ''}`} style={{ borderTop: `1px solid ${currentTheme.border}`, boxShadow: isFocused ? `inset 4px 0 0 ${currentTheme.primary}` : 'none' }}>
                                  <td className="px-3 md:px-6 py-3 md:py-4">
                                    {displayRank <= 3 ? (
                                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center font-black text-sm md:text-base ${displayRank === 1 ? "bg-gradient-to-br from-amber-400 to-yellow-600 text-black" : displayRank === 2 ? "bg-gradient-to-br from-slate-300 to-slate-500 text-black" : "bg-gradient-to-br from-orange-600 to-amber-700 text-white"}`}>{displayRank}</div>
                                    ) : (
                                      <span className="w-8 md:w-10 text-center text-base md:text-xl font-bold block" style={{ color: currentTheme.textMuted }}>{displayRank}</span>
                                    )}
                                  </td>
                                  <td className="px-3 md:px-6 py-3 md:py-4">
                                    <div className="flex items-center gap-2 md:gap-4">
                                      <img src={player.avatar} alt="" className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl ring-2 transition-all flex-shrink-0" style={{ boxShadow: `0 0 0 2px ${currentTheme.border}` }} onError={(e) => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/Steve/64`; }} />
                                      <div className="min-w-0 flex-1">
                                        <h3 className="font-bold text-sm md:text-lg transition-colors truncate" style={{ color: currentTheme.text }}>{player.minecraftNick || player.username}</h3>
                                        <div className="flex items-center gap-1 md:gap-2 mt-0.5 md:mt-1 flex-wrap player-info-row">
                                          <span className={`text-[9px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 rounded-md transition-all ${player.totalPoints >= 200 ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : player.totalPoints >= 100 ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-white/5 border border-white/10"}`} style={player.totalPoints < 100 ? { color: currentTheme.textMuted } : {}}>
                                            {getTitle(player.totalPoints, t)}
                                          </span>
                                          <span className="text-[9px] md:text-xs font-black px-1.5 md:px-2 py-0.5 rounded-md flex items-center gap-1" style={{ background: `${currentTheme.primary}15`, color: currentTheme.primary, border: `1px solid ${currentTheme.primary}30` }}>
                                            <span className="inline-block w-1 md:w-1.5 h-1 md:h-1.5 rounded-full animate-pulse" style={{ background: currentTheme.primary }}></span>
                                            {player.totalPoints}p
                                          </span>
                                          {player.peakPoints > player.totalPoints && (
                                            <span className="text-[9px] md:text-xs font-black px-1.5 md:px-2 py-0.5 rounded-md flex items-center gap-1 bg-gradient-to-r from-amber-400/20 to-yellow-600/20 text-amber-400 border border-amber-400/30" title={`Peak: ${player.peakPoints}p`}>
                                              ⭐ {player.peakPoints}
                                            </span>
                                          )}
                                          <span className="hidden sm:flex text-[9px] md:text-xs font-medium text-[#5865F2] px-1.5 md:px-2 py-0.5 bg-[#5865F2]/10 rounded-md border border-[#5865F2]/20 items-center gap-1">
                                            <DiscordIcon className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                            @{player.username}
                                          </span>
                                          <span className={`md:hidden inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-black bg-gradient-to-br ${REGIONS[player.region]?.color || "from-gray-500 to-gray-600"} text-white`}>{REGIONS[player.region]?.code}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-3 md:px-6 py-3 md:py-4 hidden md:table-cell">
                                    <div className="flex justify-center">
                                      <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-black bg-gradient-to-br ${REGIONS[player.region]?.color || "from-gray-500 to-gray-600"} text-white shadow-lg min-w-[44px] group-hover:scale-110 transition-transform`}>
                                        {REGIONS[player.region]?.code || player.region}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-3 md:px-6 py-3 md:py-4">
                                    <div className="flex items-center justify-end gap-1 md:gap-2 flex-wrap">
                                      {Object.entries(KITS).map(([kitKey, kit]) => {
                                        const tier = player.tiers[kitKey];
                                        const peakTier = player.peakTiers?.[kitKey];
                                        const displayTier = cleanTier(tier);
                                        const displayPeak = cleanTier(peakTier);
                                        const hasPeak = displayPeak && displayPeak !== displayTier && getTierRank(peakTier) > getTierRank(tier);
                                        return (
                                          <div key={kitKey} className="relative w-9 h-9 md:w-14 md:h-14 rounded-lg md:rounded-xl flex flex-col items-center justify-center transition-all hover:scale-110" style={{ background: currentTheme.headerBg, border: `1px solid ${currentTheme.border}` }} title={hasPeak ? `Peak: ${displayPeak}` : ''}>
                                            {hasPeak && (
                                              <div className="absolute -top-1 -right-1 text-[8px] md:text-[10px] z-10" style={{ filter: 'drop-shadow(0 0 3px rgba(251, 191, 36, 0.8))' }}>⭐</div>
                                            )}
                                            <div className="w-4 h-4 md:w-7 md:h-7 flex items-center justify-center">{kit.icon}</div>
                                            {displayTier ? (
                                              <span className={`text-[7px] md:text-[10px] font-black leading-none mt-0.5 md:mt-1 ${displayTier.startsWith("HT") ? "text-amber-400" : "text-cyan-400"}`}>{displayTier}</span>
                                            ) : (
                                              <span className="text-[7px] md:text-[10px] font-bold leading-none mt-0.5 md:mt-1" style={{ color: currentTheme.textMuted, opacity: 0.4 }}>—</span>
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
                      
                      {/* 🔥 SONSUZ SCROLL - Buton kaldırıldı */}
                      {displayCount < kitPlayers.length && (
                        <div ref={loadMoreRef} className="py-6 text-center" style={{ borderTop: `1px solid ${currentTheme.border}` }}>
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-5 h-5 rounded-full border-2 border-r-transparent animate-spin" style={{ borderColor: currentTheme.primary, borderRightColor: 'transparent' }}></div>
                            <span className="text-sm" style={{ color: currentTheme.textMuted }}>{t("loadingMore")}</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                  {[1, 2, 3, 4, 5].map(tierNum => {
                    const tierPlayers = playersByTier?.[tierNum] || [];
                    const emojis: Record<number, string> = { 1: "👑", 2: "🥈", 3: "🥉", 4: "🔥", 5: "🌱" };
                    return (
                      <motion.div key={tierNum} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: tierNum * 0.1 }} className="rounded-xl md:rounded-2xl overflow-hidden" style={{ background: `${currentTheme.cardBg}e6`, border: `1px solid ${currentTheme.border}` }}>
                        <div className={`px-3 md:px-4 py-2 md:py-3 ${tierNum === 1 ? "bg-gradient-to-r from-amber-500/20 to-yellow-600/20" : tierNum === 2 ? "bg-gradient-to-r from-slate-500/20 to-slate-600/20" : tierNum === 3 ? "bg-gradient-to-r from-orange-600/20 to-amber-700/20" : tierNum === 4 ? "bg-gradient-to-r from-red-500/20 to-orange-600/20" : "bg-gradient-to-r from-green-500/20 to-emerald-600/20"}`} style={{ borderBottom: `1px solid ${currentTheme.border}` }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2"><span className="text-lg md:text-xl">{emojis[tierNum]}</span><h3 className="font-bold text-sm md:text-base">Tier {tierNum}</h3></div>
                            <span className="text-[10px] md:text-xs" style={{ color: currentTheme.textMuted }}>{tierPlayers.length}</span>
                          </div>
                        </div>
                        <div className="p-2 max-h-[400px] md:max-h-[600px] overflow-y-auto">
                          {tierPlayers.length === 0 ? (
                            <div className="py-8 md:py-16 text-center"><div className="text-2xl md:text-3xl mb-2 opacity-20">👤</div><p className="text-xs" style={{ color: currentTheme.textMuted }}>—</p></div>
                          ) : (
                            <div className="space-y-1">
                              {tierPlayers.map(player => {
                                const displayTier = cleanTier(player.tiers[selectedKit]) || "—";
                                const tierKey = displayTier as keyof typeof TIER_COLORS;
                                return (
                                  <button key={player.id} onClick={() => setSelectedPlayer(player)} className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 text-left">
                                    <img src={player.avatar} alt="" className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/Steve/32`; }} />
                                    <div className="flex-1 min-w-0">
                                      <span className="text-xs md:text-sm font-medium truncate block">{player.minecraftNick || player.username}</span>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className={`text-[9px] md:text-[10px] px-1.5 py-0.5 rounded font-bold text-white bg-gradient-to-r ${TIER_COLORS[tierKey] || "from-gray-600 to-gray-700"}`}>{displayTier}</span>
                                        <span className="text-[9px] md:text-[10px]" style={{ color: currentTheme.textMuted }}>{getTierPoints(player.tiers[selectedKit])}p</span>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </main>
          )}
        </motion.div>
      </AnimatePresence>

      {selectedPlayer && !shareCardPlayer && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-md" onClick={() => setSelectedPlayer(null)}>
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="relative w-full max-w-2xl rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" style={{ background: `linear-gradient(135deg, ${currentTheme.cardBg}, ${currentTheme.bg})`, border: `1px solid ${currentTheme.border}` }} onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-4 md:p-6 sticky top-0 backdrop-blur-xl" style={{ borderBottom: `1px solid ${currentTheme.border}`, background: `${currentTheme.cardBg}f0` }}>
              <div className="flex items-center gap-3 md:gap-4 min-w-0">
                <img src={selectedPlayer.avatar} alt="" className="w-16 h-16 md:w-20 md:h-20 rounded-2xl ring-2 flex-shrink-0" style={{ boxShadow: `0 0 0 2px ${currentTheme.border}` }} onError={(e) => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/Steve/64`; }} />
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl md:text-2xl font-black truncate">{selectedPlayer.minecraftNick || selectedPlayer.username}</h2>
                  <div className="text-xs md:text-sm mt-1 flex items-center gap-1.5 flex-wrap" style={{ color: currentTheme.textMuted }}>
                    <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-black bg-gradient-to-br ${REGIONS[selectedPlayer.region]?.color || "from-gray-500 to-gray-600"} text-white shadow`}>{REGIONS[selectedPlayer.region]?.code}</span>
                    <span>#{selectedPlayer.rank}</span>
                    <span>•</span>
                    <span className="font-bold" style={{ color: currentTheme.primary }}>{selectedPlayer.totalPoints} {t("points")}</span>
                  </div>
                  <div className="mt-1 text-xs md:text-sm truncate" style={{ color: currentTheme.textMuted }}>Discord: <span style={{ color: currentTheme.primary }}>@{selectedPlayer.username}</span></div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                <button onClick={() => setShareCardPlayer(selectedPlayer)} className="p-2 rounded-xl transition-all hover:scale-110" style={{ background: currentTheme.primary, color: 'white' }} title={t("shareCard")}>
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                </button>
                <button onClick={() => setSelectedPlayer(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <div className="p-4 md:p-6">
              <h3 className="text-xs md:text-sm font-semibold uppercase mb-3 md:mb-4" style={{ color: currentTheme.textMuted }}>{t("allKitTiers")}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                {Object.entries(KITS).map(([kitKey, kit]) => {
                  const tier = selectedPlayer.tiers[kitKey];
                  const peakTier = selectedPlayer.peakTiers?.[kitKey];
                  const displayTier = cleanTier(tier);
                  const displayPeak = cleanTier(peakTier);
                  const points = getTierPoints(tier);
                  const tierKey = displayTier as keyof typeof TIER_COLORS;
                  const peakKey = displayPeak as keyof typeof TIER_COLORS;
                  const isPeakHigher = displayPeak && displayPeak !== displayTier && getTierRank(peakTier) > getTierRank(tier);
                  return (
                    <div key={kitKey} className="rounded-xl md:rounded-2xl p-3 md:p-4 relative" style={{ background: currentTheme.headerBg, border: `1px solid ${currentTheme.border}` }}>
                      {isPeakHigher && (
                        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-xs shadow-lg z-10" style={{ filter: 'drop-shadow(0 0 5px rgba(251, 191, 36, 0.6))' }} title={`Peak: ${displayPeak}`}>⭐</div>
                      )}
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center">{kit.icon}</div>
                        {displayTier ? (
                          <span className={`text-[10px] md:text-xs font-bold px-2 py-1 rounded-lg text-white bg-gradient-to-r ${TIER_COLORS[tierKey] || "from-gray-600 to-gray-700"}`}>{displayTier}</span>
                        ) : (
                          <span className="text-xs" style={{ color: currentTheme.textMuted }}>—</span>
                        )}
                      </div>
                      <div className="text-xs md:text-sm font-medium">{kit.ad}</div>
                      <div className="text-[10px] md:text-xs mt-1" style={{ color: currentTheme.textMuted }}>{points} {t("points")}</div>
                      {isPeakHigher && (
                        <div className="mt-2 pt-2 border-t flex items-center justify-between" style={{ borderColor: currentTheme.border }}>
                          <span className="text-[9px] uppercase font-bold flex items-center gap-1" style={{ color: currentTheme.textMuted }}>⭐ {t("peak")}</span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded text-white bg-gradient-to-r ${TIER_COLORS[peakKey] || "from-gray-600 to-gray-700"}`}>{displayPeak}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 md:mt-6 pt-4 md:pt-6 grid grid-cols-3 gap-4" style={{ borderTop: `1px solid ${currentTheme.border}` }}>
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-black">{selectedPlayer.tests}</div>
                  <div className="text-[10px] md:text-xs mt-1" style={{ color: currentTheme.textMuted }}>{t("totalTests")}</div>
                </div>
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-black">{getHighestTier(selectedPlayer.tiers)}</div>
                  <div className="text-[10px] md:text-xs mt-1" style={{ color: currentTheme.textMuted }}>{t("highestTier")}</div>
                </div>
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-black bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent">⭐ {selectedPlayer.peakPoints || selectedPlayer.totalPoints}</div>
                  <div className="text-[10px] md:text-xs mt-1" style={{ color: currentTheme.textMuted }}>{t("peakPoints")}</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {shareCardPlayer && (<ShareCardModal player={shareCardPlayer} theme={currentTheme} t={t} onClose={() => setShareCardPlayer(null)} />)}

      {/* 🆕 PWA INSTALL BANNER */}
      <AnimatePresence>
        {showInstallBanner && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-[120] rounded-2xl shadow-2xl backdrop-blur-xl p-4 border-2" style={{ background: `${currentTheme.cardBg}f5`, borderColor: currentTheme.primary }}>
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${currentTheme.primaryGradient} flex-shrink-0`}>
                <img src="/logo.png" alt="" className="w-8 h-8 rounded-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm mb-1" style={{ color: currentTheme.text }}>📱 {t("installApp")}</h4>
                <p className="text-xs mb-3" style={{ color: currentTheme.textMuted }}>{t("installPrompt")}</p>
                <div className="flex gap-2">
                  <button onClick={installPWA} className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold bg-gradient-to-r ${currentTheme.primaryGradient} text-white hover:scale-105 transition-all`}>
                    {t("installNow")}
                  </button>
                  <button onClick={dismissBanner} className="px-3 py-2 rounded-lg text-xs font-bold transition-all hover:bg-white/10" style={{ color: currentTheme.textMuted, border: `1px solid ${currentTheme.border}` }}>
                    {t("later")}
                  </button>
                </div>
              </div>
              <button onClick={dismissBanner} className="text-xs opacity-50 hover:opacity-100 transition-opacity">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="relative z-10 mt-12 md:mt-20 backdrop-blur-sm" style={{ borderTop: `1px solid ${currentTheme.border}`, background: `${currentTheme.headerBg}80` }}>
        <div className="max-w-[1600px] mx-auto px-4 py-6 md:py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="" className="h-10 w-10 rounded-lg object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div>
                <h3 className={`font-black text-sm bg-gradient-to-r ${currentTheme.primaryGradient} bg-clip-text text-transparent`}>ABYSSAL OCEAN</h3>
                <p className="text-[10px] tracking-widest" style={{ color: currentTheme.textMuted }}>TIER LIST</p>
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm flex-wrap justify-center" style={{ color: currentTheme.textMuted }}>
              <a href="https://discord.gg/cKFwKcfcWn" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity flex items-center gap-1.5" style={{ color: currentTheme.primary }}>
                <DiscordIcon className="w-4 h-4" /> Discord
              </a>
              <span style={{ opacity: 0.3 }}>•</span>
              <span>{t("pvpTierList")}</span>
            </div>
            <div className="text-[10px] md:text-xs" style={{ color: currentTheme.textMuted }}>
              © {new Date().getFullYear()} Abyssal Ocean. {t("allRights")}.
              <br />
              <span style={{ opacity: 0.6 }}>{t("madeWith")}</span>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        * {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none;
        }
        input, textarea, [contenteditable="true"] {
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
          user-select: text !important;
        }
        
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        
        @keyframes bubbleFloat {
          0% { transform: translateY(0) scale(0.3); opacity: 0; }
          15% { opacity: 0.8; }
          85% { opacity: 0.5; }
          100% { transform: translateY(-110vh) scale(1); opacity: 0; }
        }
        
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
        .player-info-row > *:nth-child(4) { animation-delay: 0.35s; }
        .player-info-row > *:nth-child(5) { animation-delay: 0.45s; }
        
        .player-info-row > *:hover {
          transform: translateY(-2px) scale(1.05);
          transition: transform 0.2s ease;
        }
        
        @keyframes skeletonShimmer {
          0% { opacity: 0.3; }
          50% { opacity: 0.7; }
          100% { opacity: 0.3; }
        }
        .skeleton-pulse {
          position: relative;
          overflow: hidden;
          animation: skeletonShimmer 1.5s ease-in-out infinite;
        }
        
        @keyframes badgeFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes badgeGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(34, 211, 238, 0.3); }
          50% { box-shadow: 0 0 40px rgba(34, 211, 238, 0.6); }
        }
        .hero-badge {
          animation: badgeFloat 3s ease-in-out infinite, badgeGlow 2s ease-in-out infinite;
        }
        .hero-badge-text {
          background: linear-gradient(90deg, #22d3ee, #a855f7, #ec4899, #22d3ee);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientShift 3s linear infinite;
          font-weight: 800;
        }
        
        @keyframes wordFadeIn {
          0% { opacity: 0; transform: translateY(20px) scale(0.8); filter: blur(10px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        .subtitle-word {
          animation: wordFadeIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) backwards;
          transition: all 0.3s ease;
          display: inline-block;
        }
        .subtitle-word:hover {
          color: #22d3ee !important;
          transform: translateY(-3px) scale(1.1);
          cursor: default;
        }
        
        img {
          -webkit-user-drag: none;
          -khtml-user-drag: none;
          -moz-user-drag: none;
          -o-user-drag: none;
          user-drag: none;
          -webkit-touch-callout: none;
        }
        
        @media (max-width: 768px) {
          body { overflow-x: hidden; }
          .animated-gradient-text { filter: drop-shadow(0 0 15px rgba(34, 211, 238, 0.4)); }
        }
        
        html { scroll-behavior: smooth; }
        
        @media (max-width: 768px) {
          button, a { -webkit-tap-highlight-color: transparent; }
        }
      `}</style>

      <AIChatBot />
    </div>
  );
}
