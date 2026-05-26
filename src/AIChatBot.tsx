import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
}

// ==========================================
// KALIP SORULAR - 20 SORU + DİSCORD BOT SORULARI
// ==========================================
const kalipSorular = [
  // ===== DISCORD BOT KALIPLARI =====
  { 
    anahtar: ['nasıl test olucam', 'nasıl test olurum', 'test nasıl olunur', 'nasıl test'], 
    cevap: 'Test olmak için Discord sunucumuzdaki #soru-sor kanalına gidip sorunuzu iletebilirsiniz. 🎯' 
  },
  { 
    anahtar: ['cooldown ne kadar', 'cooldown süresi', 'bekleme süresi', 'cooldown'], 
    cevap: '⏰ 2 gün' 
  },
  { 
    anahtar: ['partnerlik', 'iş birliği', 'partner'], 
    cevap: '🤝 Ticket açarsanız yetkililerimiz ilgilenecektir.' 
  },
  { 
    anahtar: ['sıradayım ne zaman', 'sıra ne zaman gelir', 'sırada bekliyorum'], 
    cevap: '⏳ Testerlerimiz sırayla ilerliyor, lütfen sıranızı bekleyin.' 
  },
  
  // ===== 20 KURAL SORUSU =====
  
  // 1. Makro / Auto-Clicker
  { 
    anahtar: ['makro', 'auto-clicker', 'autoclicker', 'auto clicker', 'oto clicker', 'otomatik tıklama'], 
    cevap: '🚫 **Makro/Auto-Clicker Cezası:**\nTespiti halinde oyuncu sunucudan **kalıcı olarak uzaklaştırılır** ve tüm tier kayıtları silinir.' 
  },
  
  // 2. Clean
  { 
    anahtar: ['clean', 'arkadan vurmak', 'savaştan çıkan', 'az canlı vurmak'], 
    cevap: '⚔️ **Clean Kuralı:**\nHayır, resmi turnuva ve tier maçlarında **yasaktır**; FFA (Free For All) alanlarında **serbesttir**.' 
  },
  
  // 3. Hakaret / Mute
  { 
    anahtar: ['hakaret', 'küfür', 'mute', 'sövme', 'argo'], 
    cevap: '🤐 **Hakaret Cezası:**\nİlk ihlalde **geçici mute**, tekrarı halinde tier maçlarından **men edilme** cezası verilir.' 
  },
  
  // 4. Cross-Teaming
  { 
    anahtar: ['cross-teaming', 'cross teaming', 'crossteam', 'birleşmek', 'takım kurmak', 'beraber saldırmak'], 
    cevap: '🚫 **Cross-Teaming:**\nEvet, takım modları dışındaki tüm bireysel tier maçlarında **tamamen yasaktır**.' 
  },
  
  // 5. SS Süresi
  { 
    anahtar: ['ss süresi', 'screen share süre', 'ekran kontrolü süre', 'ss kaç dakika', 'ss ne kadar'], 
    cevap: '⏱️ **SS Çağrı Süresi:**\nÇağrı yapıldığı andan itibaren oyuncunun sese gelmesi ve ekran açması için **maksimum 3 dakikası** vardır.' 
  },
  
  // 6. SS Reddi
  { 
    anahtar: ['ss reddetmek', 'ss reddi', 'ss kabul etmemek', 'alt f4', 'ekran açmamak', 'ss kaçmak'], 
    cevap: '🚨 **SS Reddi:**\nDoğrudan **hile kullanımı (Anında Ban)** olarak değerlendirilir ve sunucudan yasaklanır.' 
  },
  
  // 7. Combat Log
  { 
    anahtar: ['combat log', 'combatlog', 'maçtan çıkmak', 'kasıtlı çıkış', 'oyundan çıkmak'], 
    cevap: '⚠️ **Combat Log Cezası:**\nO maç direkt **hükmen mağlubiyet** sayılır ve oyuncuya **geçici süreyle maç banı** atılır.' 
  },
  
  // 8. Hileye Yataklık
  { 
    anahtar: ['hileli arkadaş', 'hile saklamak', 'hileliyi almak', 'yataklık', 'hile koruma'], 
    cevap: '🚫 **Hileye Yataklık:**\nEvet, hileye yataklık etmek de hile kullanımıyla aynı cezai yaptırımı **(ban)** gerektirir.' 
  },
  
  // 9. Regedit / Hit Değiştirici
  { 
    anahtar: ['regedit', 'hit değiştirici', 'ağ programı', 'paket düzenleyici', 'wireshark', 'hit reg'], 
    cevap: '🚫 **Regedit / Hit Değiştirici:**\nHayır, oyun dosyalarına veya internet paketlerine müdahale eden **tüm haksız avantaj sağlayan yazılımlar yasaktır**.' 
  },
  
  // 10. Ban Evading / Alt Account
  { 
    anahtar: ['alt hesap', 'yan hesap', 'ban evading', 'banevading', 'bandan kaçmak', 'ikinci hesap'], 
    cevap: '🚫 **Ban Evading:**\nTespit edilen **tüm yan hesaplar ve ana hesap** sunucudan kalıcı olarak uzaklaştırılır.' 
  },
  
  // 11. Tier Up Şartı
  { 
    anahtar: ['tier up', 'tier atlama', 'tier yükseltme', 'tier nasıl atlanır', 'win rate'], 
    cevap: '📈 **Tier Up Şartı:**\nKendi tierindeki oyunculara karşı **yüksek bir kazanma oranına (Win Rate)** sahip olmak.' 
  },
  
  // 12. Tier Test Nedir
  { 
    anahtar: ['tier test nedir', 'tier test ne', 'test maçı nedir', 'tester kim'], 
    cevap: '🧪 **Tier Test:**\nOyuncunun mekanik seviyesini resmi olarak ölçen ve sadece yetkili **"Tester" kadrosu gözetiminde** yapılan maçtır.' 
  },
  
  // 13. Tier İtiraz
  { 
    anahtar: ['tier itiraz', 'sonuca itiraz', 'pov', 'itiraz etmek', 'ekran kaydı'], 
    cevap: '📹 **Tier İtiraz:**\nKendi aldığı **kesintisiz ekran kaydını (POV)** destek talebi açarak kanıt olarak sunmalıdır.' 
  },
  
  // 14. Re-Test
  { 
    anahtar: ['re-test', 'retest', 're test', 'yeniden test', 'tekrar test'], 
    cevap: '🔄 **Re-Test Şartları:**\nİlk testte kanıtlanabilir bir **lag/bağlantı sorunu** yaşandıysa veya **itiraz videosu haklı bulunduysa** verilir.' 
  },
  
  // 15. Tier Down
  { 
    anahtar: ['tier down', 'tier düşmek', 'tier düşüşü', 'inaktif', 'sürekli kaybediyorum'], 
    cevap: '📉 **Tier Down:**\nBelirli bir süre aktif olmayan veya sürekli yenilen oyuncular **"Tier Down" (Tier düşüşü)** yaşar.' 
  },
  
  // 16. Günde Kaç Test
  { 
    anahtar: ['günde kaç test', 'günlük test', 'kaç kere test', 'günde kaç kez'], 
    cevap: '📅 **Günlük Test Hakkı:**\nYoğunluğu önlemek adına her oyuncunun günde **en fazla 1 kez** resmi test talep etme hakkı vardır.' 
  },
  
  // 17. Tester Haksızlığı
  { 
    anahtar: ['tester haksız', 'tester taraflı', 'tester adaletsiz', 'haksız puanlama'], 
    cevap: '⚖️ **Haksız Tester:**\nYetkisi **kalıcı olarak alınır**, kara listeye eklenir ve etkilenen maçlar iptal edilerek **yeniden yapılır**.' 
  },
  
  // 18. Elo Boosting
  { 
    anahtar: ['elo boost', 'boost', 'hesap kastırmak', 'boosting', 'kasma'], 
    cevap: '🚫 **Elo Boosting:**\nKesinlikle yasaktır; tespit edildiğinde **hesap sahibinin tieri sıfırlanır**.' 
  },
  
  // 19. Sıralama Yeri
  { 
    anahtar: ['sıralama nerede', 'tier list nerede', 'rankings', 'sıralama nasıl', 'tier listesi'], 
    cevap: '🏆 **Sıralama:**\nÖzel bir **#tier-list veya #rankings** kanalında, oyunculara verilen özel Discord rolleriyle gösterilir. Ayrıca bu sitenin **Rankings** sayfasından da görebilirsin!' 
  },
  
  // 20. Pause / Lag
  { 
    anahtar: ['pause', 'duraklatma', 'lag bahanesi', 'maç durdurmak', 'ping yüksek'], 
    cevap: '⏸️ **Pause/Lag:**\nResmi maçlarda pause/duraklatma talebi **kabul edilmez**. Maç başlamadan önce bağlantı sorunlarınızı çözmelisiniz.' 
  },
  
  // ===== EK YARDIMCI KALIPLAR =====
  {
    anahtar: ['puanlama', 'puan sistemi', 'kaç puan', 'puan nasıl'],
    cevap: '📊 **Puanlama Sistemi:**\n• HT1: 60p | LT1: 44p\n• HT2: 28p | LT2: 16p\n• HT3: 10p | LT3: 6p\n• HT4: 4p | LT4: 3p\n• HT5: 2p | LT5: 1p'
  },
  {
    anahtar: ['kaç kit', 'hangi kitler', 'kit listesi', 'kitler neler'],
    cevap: '⚔️ **8 Kit Mevcut:**\n🌿 Vanilla | ⚔️ Sword | 🪓 Axe | 🌌 NethOP\n🧪 Pot | 🍎 UHC | 🌿 SMP | 🔨 Mace'
  },
  {
    anahtar: ['discord', 'sunucu link', 'discord link', 'sunucuya katıl'],
    cevap: '🎮 **Discord:** https://discord.gg/cKFwKcfcWn'
  },
  {
    anahtar: ['tester nasıl olunur', 'tester olmak', 'tester başvuru'],
    cevap: '🛡️ **Tester Başvurusu:**\nDiscord sunucumuzda ticket açıp **Tester Başvurusu** seçeneğini kullanabilirsin.'
  },
  {
    anahtar: ['merhaba', 'selam', 'slm', 'sa', 'selamün aleyküm'],
    cevap: '👋 Selam! Ben **Abyssal Ocean** asistanıyım. Sana nasıl yardımcı olabilirim?'
  }
];

// Discord botundaki aynı eşleşme fonksiyonu
function kalipEslesme(mesaj: string): string | null {
  const kucukMesaj = mesaj.toLowerCase().trim();
  for (const kalip of kalipSorular) {
    for (const anahtar of kalip.anahtar) {
      if (kucukMesaj.includes(anahtar.toLowerCase())) return kalip.cevap;
    }
  }
  return null;
}

// ==========================================
// OPENROUTER AI (KALIP YOKSA AI'YA SOR)
// ==========================================
async function internetteAraVeCevapla(soru: string): Promise<string> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer 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",
        "HTTP-Referer": window.location.origin,
        "X-Title": "Abyssal Ocean Tier List"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [
          {
            role: "system",
            content: "Sen bir Minecraft PvP Tierlist sunucusunun yardımcı botusun. Yanıtlar kısa, net ve Türkçe olsun."
          },
          {
            role: "user",
            content: soru
          }
        ],
        max_tokens: 500
      })
    });

    const data = await response.json();
    if (data.choices && data.choices[0]) {
      return data.choices[0].message.content;
    }
    return "❌ Şu anda yanıt veremiyorum, lütfen tekrar dene.";
  } catch (error) {
    console.error("OpenRouter hatası:", error);
    return "❌ Şu anda yanıt veremiyorum, lütfen tekrar dene.";
  }
}

export default function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      content: "👋 Selam! Ben **Abyssal Ocean** asistanıyım. Tier sistem, kurallar, kitler veya başka herhangi bir konuda sorun varsa bana yazabilirsin! 🌊",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Discord botundaki AYNI MANTIK: Önce kalıp → sonra AI
  const sendMessage = async (customInput?: string) => {
    const trimmed = (customInput || input).trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // 1. ÖNCE KALIP SORU KONTROLÜ
    const kalipCevap = kalipEslesme(trimmed);
    
    let botCevap: string;
    if (kalipCevap) {
      // Kalıp bulundu, direkt cevap ver (ufak bir gecikme ile doğal göster)
      await new Promise(resolve => setTimeout(resolve, 400));
      botCevap = kalipCevap;
    } else {
      // 2. KALIP YOKSA AI'YA SOR
      botCevap = await internetteAraVeCevapla(trimmed);
    }

    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "bot",
      content: botCevap,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);

    if (!isOpen) {
      setUnreadCount(prev => prev + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const hizliSorular = [
    "Cooldown ne kadar?",
    "Makro yasak mı?",
    "Re-test nedir?",
    "Cross-teaming yasak mı?"
  ];

  return (
    <>
      {/* Açma Butonu */}
      <motion.button
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.5 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[200] w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-2xl shadow-cyan-500/50 flex items-center justify-center hover:scale-110 transition-transform group"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 animate-ping opacity-20" />
        <div className="relative">
          {isOpen ? (
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <>
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                  {unreadCount}
                </span>
              )}
            </>
          )}
        </div>
      </motion.button>

      {/* Chat Penceresi */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 250, damping: 25 }}
            className="fixed bottom-24 right-6 z-[199] w-[calc(100vw-3rem)] sm:w-[400px] h-[600px] max-h-[calc(100vh-8rem)] bg-gradient-to-br from-[#0f141b] to-[#0a0e14] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="relative p-4 border-b border-white/10 bg-gradient-to-r from-cyan-600/20 to-blue-600/20">
              <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl" />
              <div className="relative flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full blur-md opacity-60" />
                  <div className="relative w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-2xl">
                    🤖
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0f141b] animate-pulse" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white">Abyssal AI</h3>
                  <p className="text-xs text-cyan-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Çevrimiçi • Sana yardım edebilir
                  </p>
                </div>
              </div>
            </div>

            {/* Mesajlar */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex items-start gap-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-purple-500 to-pink-500"
                        : "bg-gradient-to-br from-cyan-500 to-blue-600"
                    }`}>
                      {msg.role === "user" ? "👤" : "🤖"}
                    </div>
                    <div className={`relative px-4 py-2.5 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-tr-sm"
                        : "bg-[#1a1f2e] text-white/90 rounded-tl-sm border border-white/5"
                    }`}>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {msg.content}
                      </div>
                      <div className={`text-[10px] mt-1 ${msg.role === "user" ? "text-white/70" : "text-white/40"}`}>
                        {msg.timestamp.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-sm">
                      🤖
                    </div>
                    <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Hızlı Sorular */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2">
                <p className="text-xs text-white/40 mb-2">💡 Hızlı sorular:</p>
                <div className="flex flex-wrap gap-2">
                  {hizliSorular.map((soru) => (
                    <button
                      key={soru}
                      onClick={() => sendMessage(soru)}
                      className="text-xs px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-full text-cyan-400 transition-all hover:scale-105"
                    >
                      {soru}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-[#0a0e14]/50">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Bir soru sor..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-[#1a1f2e] border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all disabled:opacity-50"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center hover:scale-105 transition-all shadow-lg shadow-cyan-500/30 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              <p className="text-[10px] text-white/30 text-center mt-2">
                ⚡ Powered by Abyssal Ocean AI
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
