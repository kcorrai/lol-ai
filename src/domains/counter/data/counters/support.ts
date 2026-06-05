import type { GeneralCounterResult } from "../../types/counter.types";

type RoleData = Omit<GeneralCounterResult, "champion" | "role" | "generatedAt">;

const NOTE = "Bu veriler manuel olarak girilmiştir. Patch güncellemelerini yansıtmayabilir.";

export const SUPPORT_COUNTERS: Record<string, RoleData> = {
  "Alistar": {
    topCounters: [
      { champion: "Morgana", difficulty: "medium", tier: "S", reasonWhy: "Black Shield Alistar'ın tüm CC zincirini bloklar.", laneAdvantage: "Q kök ile Alistar'ı immobilize eder.", watchOut: "Alistar Q+W sırasını değiştirerek Black Shield'ı atlatabilir.", buildHint: "Imperial Mandate, Zhonya's Hourglass" },
      { champion: "Bard", difficulty: "medium", tier: "A", reasonWhy: "R portal Alistar engage'inden kaçar.", laneAdvantage: "Poke ve hareket gücü Alistar'ı zorlar.", watchOut: "Alistar W+Q combo Bard için tehlikeli.", buildHint: "Shurelya's Battlesong, Locket of the Iron Solari" },
      { champion: "Lulu", difficulty: "medium", tier: "A", reasonWhy: "Polymorph Alistar'ın W+Q combo'sunu keser.", laneAdvantage: "W kalkan + E slow Alistar engage'ini engeller.", watchOut: "Alistar W+Q ani gelir, Lulu hızlı tepki gerektirir.", buildHint: "Moonstone Renewer, Ardent Censer" },
    ],
    easyCounters: [
      { champion: "Morgana", difficulty: "easy", tier: "S", reasonWhy: "En kolay Alistar counter'ı.", laneAdvantage: "Black Shield her CC'yi bloklar.", watchOut: "Alistar Q+W sırasına dikkat.", buildHint: "Imperial Mandate, Chemtech Putrifier" },
      { champion: "Lulu", difficulty: "easy", tier: "A", reasonWhy: "Polymorph combo'yu keser.", laneAdvantage: "Kalkan + yavaşlatma güçlü.", watchOut: "Alistar her engage'de tehlikeli.", buildHint: "Moonstone Renewer, Ardent Censer" },
    ],
    soloQueueCounters: [
      { champion: "Morgana", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da Alistar için en iyi counter.", laneAdvantage: "Black Shield her CC'yi etkisiz kılar.", watchOut: "Alistar W+Q sırası.", buildHint: "Imperial Mandate, Redemption" },
      { champion: "Lulu", difficulty: "medium", tier: "A", reasonWhy: "Polymorph combo'yu durdurur.", laneAdvantage: "ADC koruması.", watchOut: "Alistar passive poke.", buildHint: "Moonstone Renewer, Ardent Censer" },
    ],
    tips: ["Alistar W+Q combo'sunun sırasına dikkat et.", "Alistar passive healing trade'leri uzatır.", "Alistar R damage reduction çok yüksektir."],
    patchNote: NOTE,
  },

  "Bard": {
    topCounters: [
      { champion: "Nautilus", difficulty: "medium", tier: "S", reasonWhy: "Hook + CC chain Bard'ın kite stilini durdurur.", laneAdvantage: "Passive root + abilityler Bard için sorun.", watchOut: "Bard R freeze düşman support'u etkisizleştirir.", buildHint: "Locket of the Iron Solari, Warmog's Armor" },
      { champion: "Leona", difficulty: "medium", tier: "A", reasonWhy: "All-in engage Bard'ı durdurur.", laneAdvantage: "CC chain Bard meep poke'unu ezer.", watchOut: "Bard W shrine heal poke'u dengeler.", buildHint: "Locket of the Iron Solari, Zeke's Convergence" },
      { champion: "Blitzcrank", difficulty: "hard", tier: "A", reasonWhy: "Hook Bard'ı uzak mesafeden yakalar.", laneAdvantage: "Grab + knock Bard için sorun.", watchOut: "Bard R Blitzcrank'i dondurabilir.", buildHint: "Locket of the Iron Solari, Knight's Vow" },
    ],
    easyCounters: [
      { champion: "Leona", difficulty: "easy", tier: "A", reasonWhy: "En kolay Bard counter'ı.", laneAdvantage: "CC chain dominant.", watchOut: "Bard R freeze Leona'yı dondurur.", buildHint: "Locket of the Iron Solari, Zeke's Convergence" },
      { champion: "Nautilus", difficulty: "easy", tier: "A", reasonWhy: "Hook + CC Bard için sorun.", laneAdvantage: "CC chain güçlü.", watchOut: "Bard R Nautilus'u dondurur.", buildHint: "Locket of the Iron Solari, Warmog's Armor" },
    ],
    soloQueueCounters: [
      { champion: "Leona", difficulty: "easy", tier: "A", reasonWhy: "Solo queue'da Bard için iyi counter.", laneAdvantage: "Engage gücü yüksek.", watchOut: "Bard R freeze sürpriz.", buildHint: "Locket of the Iron Solari, Zeke's Convergence" },
      { champion: "Nautilus", difficulty: "medium", tier: "A", reasonWhy: "Hook Bard'ı yakalar.", laneAdvantage: "CC chain.", watchOut: "Bard portal kaçış.", buildHint: "Locket of the Iron Solari, Warmog's Armor" },
    ],
    tips: ["Bard R kendi takımını da dondurabilir.", "Bard meep stack'i 5'te AoE stun verir.", "Bard portal pozisyon değiştirme için kullanır."],
    patchNote: NOTE,
  },

  "Blitzcrank": {
    topCounters: [
      { champion: "Morgana", difficulty: "medium", tier: "S", reasonWhy: "Black Shield Blitzcrank'ın tüm CC zincirini bloklar.", laneAdvantage: "Q kök ile Blitzcrank'i immobilize eder.", watchOut: "Blitzcrank hook cooldown dışındayken fırsat kollar.", buildHint: "Imperial Mandate, Chemtech Putrifier" },
      { champion: "Thresh", difficulty: "hard", tier: "A", reasonWhy: "Fener ile ADC'ye daha güvenli positioning sağlar.", laneAdvantage: "Hook + E geri itmesi Blitzcrank engage'ini bozar.", watchOut: "Blitzcrank hook Thresh için de tehlikelidir.", buildHint: "Locket of the Iron Solari, Knight's Vow" },
      { champion: "Lulu", difficulty: "medium", tier: "A", reasonWhy: "Polymorph Blitzcrank'ı grab'den önce keser.", laneAdvantage: "W hız boost + kalkan ADC'yi korur.", watchOut: "Blitzcrank W speed grab kombinasyonu.", buildHint: "Moonstone Renewer, Ardent Censer" },
    ],
    easyCounters: [
      { champion: "Morgana", difficulty: "easy", tier: "S", reasonWhy: "En kolay Blitzcrank counter'ı.", laneAdvantage: "Black Shield her grab'i engeller.", watchOut: "Blitzcrank grab CD dışındayken.", buildHint: "Imperial Mandate, Redemption" },
      { champion: "Thresh", difficulty: "medium", tier: "A", reasonWhy: "Fener ADC'yi korur.", laneAdvantage: "E geri itmesi grab'i iptal eder.", watchOut: "Blitzcrank grab Thresh için de tehlikeli.", buildHint: "Locket of the Iron Solari, Knight's Vow" },
    ],
    soloQueueCounters: [
      { champion: "Morgana", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da Blitzcrank için en iyi counter.", laneAdvantage: "Black Shield dominant.", watchOut: "Blitzcrank grab açık olmadığında fırsat var.", buildHint: "Imperial Mandate, Redemption" },
      { champion: "Lulu", difficulty: "easy", tier: "A", reasonWhy: "Polymorph grab'i keser.", laneAdvantage: "ADC koruması.", watchOut: "Blitzcrank grab CD takip et.", buildHint: "Moonstone Renewer, Ardent Censer" },
    ],
    tips: ["Blitzcrank grab CD ~20 saniye, bitmişken agresif ol.", "Blitzcrank W hız boost grab setup için kullanır.", "Blitzcrank ult passive lightning sürpriz AoE."],
    patchNote: NOTE,
  },

  "Brand": {
    topCounters: [
      { champion: "Soraka", difficulty: "medium", tier: "S", reasonWhy: "Sürekli healing Brand'ın DoT hasarını dengeler.", laneAdvantage: "Silence + heal ADC'yi her Brand combo'sundan kurtarır.", watchOut: "Brand W stun + passive ablaze burst ani.", buildHint: "Moonstone Renewer, Chemtech Putrifier" },
      { champion: "Lulu", difficulty: "medium", tier: "A", reasonWhy: "Polymorph Brand'ın combo zincirini keser.", laneAdvantage: "Kalkan hasar azaltır.", watchOut: "Brand ablaze stack 3'te hasar artar.", buildHint: "Moonstone Renewer, Ardent Censer" },
      { champion: "Morgana", difficulty: "medium", tier: "A", reasonWhy: "Black Shield Brand'ın CC'sini bloklar.", laneAdvantage: "Q kök Brand'ı immobilize eder.", watchOut: "Brand R bounce çok AoE.", buildHint: "Imperial Mandate, Chemtech Putrifier" },
    ],
    easyCounters: [
      { champion: "Soraka", difficulty: "easy", tier: "S", reasonWhy: "En kolay Brand counter'ı.", laneAdvantage: "Healing DoT'u dengeler.", watchOut: "Brand ablaze burst.", buildHint: "Moonstone Renewer, Chemtech Putrifier" },
      { champion: "Lulu", difficulty: "easy", tier: "A", reasonWhy: "Polymorph combo'yu keser.", laneAdvantage: "Kalkan koruma.", watchOut: "Brand W stun.", buildHint: "Moonstone Renewer, Ardent Censer" },
    ],
    soloQueueCounters: [
      { champion: "Soraka", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da Brand için en iyi counter.", laneAdvantage: "Healing dominant.", watchOut: "Brand ablaze stack kontrolü.", buildHint: "Moonstone Renewer, Redemption" },
      { champion: "Janna", difficulty: "medium", tier: "A", reasonWhy: "Disengage Brand engage'ini bozar.", laneAdvantage: "R itmesi Brand combo'sunu keser.", watchOut: "Brand W stun.", buildHint: "Shurelya's Battlesong, Locket of the Iron Solari" },
    ],
    tips: ["Brand ablaze 3 stack'de burst hasarı artar.", "Brand R bounce gruba giriyor, dağılın.", "Brand W stun sadece ablaze düşmana çalışır."],
    patchNote: NOTE,
  },

  "Janna": {
    topCounters: [
      { champion: "Leona", difficulty: "hard", tier: "S", reasonWhy: "All-in engage Janna'nın disengage stilini bozar.", laneAdvantage: "Stun + tanklık Janna R'ına rağmen fight eder.", watchOut: "Janna R itmesi Leona engage'ini iptal eder.", buildHint: "Locket of the Iron Solari, Zeke's Convergence" },
      { champion: "Nautilus", difficulty: "medium", tier: "A", reasonWhy: "Hook + CC Janna'nın hareket avantajını iptal eder.", laneAdvantage: "Passive root + hook Janna için sorun.", watchOut: "Janna W yavaşlatma Nautilus'u zorlar.", buildHint: "Locket of the Iron Solari, Warmog's Armor" },
      { champion: "Blitzcrank", difficulty: "medium", tier: "A", reasonWhy: "Hook Janna'yı uzaktan yakalar.", laneAdvantage: "Grab + knock combo Janna için tehlikeli.", watchOut: "Janna E kalkan grab'i azaltır.", buildHint: "Locket of the Iron Solari, Knight's Vow" },
    ],
    easyCounters: [
      { champion: "Leona", difficulty: "medium", tier: "S", reasonWhy: "En kolay Janna counter'ı.", laneAdvantage: "Tanklık + engage.", watchOut: "Janna R engage'ini iptal eder.", buildHint: "Locket of the Iron Solari, Zeke's Convergence" },
      { champion: "Nautilus", difficulty: "easy", tier: "A", reasonWhy: "Hook Janna için sorun.", laneAdvantage: "CC chain.", watchOut: "Janna W yavaşlatır.", buildHint: "Locket of the Iron Solari, Warmog's Armor" },
    ],
    soloQueueCounters: [
      { champion: "Leona", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Janna için en iyi counter.", laneAdvantage: "Engage gücü yüksek.", watchOut: "Janna R her engage'i iptal eder.", buildHint: "Locket of the Iron Solari, Zeke's Convergence" },
      { champion: "Blitzcrank", difficulty: "medium", tier: "A", reasonWhy: "Hook Janna'yı yakalar.", laneAdvantage: "Grab ani.", buildHint: "Locket of the Iron Solari, Knight's Vow", watchOut: "Janna E kalkan grab'i zayıflatır." },
    ],
    tips: ["Janna R aktifken yakınlarda durma, itilirsin.", "Janna E kalkan hasar azaltır.", "Janna W yavaşlatma tile yönelimiyle çalışır."],
    patchNote: NOTE,
  },

  "Karma": {
    topCounters: [
      { champion: "Nautilus", difficulty: "medium", tier: "S", reasonWhy: "Hook + CC Karma'nın güvenli poke stilini bozar.", laneAdvantage: "Passive root + hook Karma için sorun.", watchOut: "Karma E kalkan + Q slow.", buildHint: "Locket of the Iron Solari, Warmog's Armor" },
      { champion: "Leona", difficulty: "medium", tier: "A", reasonWhy: "All-in engage Karma'nın poke stilini bozar.", laneAdvantage: "Stun + tanklık Karma'yı overwhelm eder.", watchOut: "Karma E kalkan hasar azaltır.", buildHint: "Locket of the Iron Solari, Zeke's Convergence" },
      { champion: "Blitzcrank", difficulty: "medium", tier: "A", reasonWhy: "Hook Karma'yı yakalar.", laneAdvantage: "Grab ani Karma için sorun.", watchOut: "Karma E kalkan grab'i zayıflatır.", buildHint: "Locket of the Iron Solari, Knight's Vow" },
    ],
    easyCounters: [
      { champion: "Nautilus", difficulty: "easy", tier: "S", reasonWhy: "En kolay Karma counter'ı.", laneAdvantage: "CC chain.", watchOut: "Karma poke çok güçlüdür.", buildHint: "Locket of the Iron Solari, Warmog's Armor" },
      { champion: "Leona", difficulty: "easy", tier: "A", reasonWhy: "Engage gücü.", laneAdvantage: "All-in.", watchOut: "Karma E kalkan.", buildHint: "Locket of the Iron Solari, Zeke's Convergence" },
    ],
    soloQueueCounters: [
      { champion: "Leona", difficulty: "easy", tier: "A", reasonWhy: "Solo queue'da Karma için iyi counter.", laneAdvantage: "Engage dominant.", watchOut: "Karma poke sağlığı düşürür.", buildHint: "Locket of the Iron Solari, Zeke's Convergence" },
      { champion: "Nautilus", difficulty: "medium", tier: "A", reasonWhy: "CC chain.", laneAdvantage: "Hook.", watchOut: "Karma E kalkan.", buildHint: "Locket of the Iron Solari, Warmog's Armor" },
    ],
    tips: ["Karma mantra'sı empowered ability, CD'sini takip et.", "Karma Q slow + R combo çok güçlüdür.", "Karma erken poke gücü yüksek, health bar izle."],
    patchNote: NOTE,
  },

  "Leona": {
    topCounters: [
      { champion: "Morgana", difficulty: "medium", tier: "S", reasonWhy: "Black Shield Leona'nın tüm CC zincirini bloklar.", laneAdvantage: "Q kök ile Leona'yı immobilize eder.", watchOut: "Leona Q+E+W combo Black Shield'ı tüketir.", buildHint: "Imperial Mandate, Chemtech Putrifier" },
      { champion: "Lulu", difficulty: "medium", tier: "A", reasonWhy: "Polymorph Leona'nın combo'sunu keser.", laneAdvantage: "W hız + kalkan ADC'yi korur.", watchOut: "Leona all-in çok güçlüdür.", buildHint: "Moonstone Renewer, Ardent Censer" },
      { champion: "Soraka", difficulty: "medium", tier: "A", reasonWhy: "Heal sustain Leona all-in'lerini dengeler.", laneAdvantage: "Silence Leona'nın combo'sunu keser.", watchOut: "Leona stun aktifken Soraka silence anlamsız.", buildHint: "Moonstone Renewer, Redemption" },
    ],
    easyCounters: [
      { champion: "Morgana", difficulty: "easy", tier: "S", reasonWhy: "En kolay Leona counter'ı.", laneAdvantage: "Black Shield her CC'yi engeller.", watchOut: "Leona Q stun ani.", buildHint: "Imperial Mandate, Redemption" },
      { champion: "Soraka", difficulty: "easy", tier: "A", reasonWhy: "Sustain Leona all-in'lerini dengeler.", laneAdvantage: "Heal.", watchOut: "Leona stun.", buildHint: "Moonstone Renewer, Chemtech Putrifier" },
    ],
    soloQueueCounters: [
      { champion: "Morgana", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da Leona için en iyi counter.", laneAdvantage: "Black Shield dominant.", watchOut: "Leona all-in çok hızlı.", buildHint: "Imperial Mandate, Redemption" },
      { champion: "Lulu", difficulty: "medium", tier: "A", reasonWhy: "Polymorph combo'yu durdurur.", laneAdvantage: "ADC koruması.", watchOut: "Leona Q stun.", buildHint: "Moonstone Renewer, Ardent Censer" },
    ],
    tips: ["Leona Q stun passive sunlight etiketini tüketir.", "Leona W armor + MR aktifken hasar azalır.", "Leona R solar flare uzak menzilli stun + slow."],
    patchNote: NOTE,
  },

  "Lulu": {
    topCounters: [
      { champion: "Nautilus", difficulty: "medium", tier: "S", reasonWhy: "Hook + CC chain Lulu'nun hareket avantajını iptal eder.", laneAdvantage: "Passive root + CC Lulu için sorun.", watchOut: "Lulu W polymorph Nautilus engage'ini keser.", buildHint: "Locket of the Iron Solari, Warmog's Armor" },
      { champion: "Leona", difficulty: "medium", tier: "A", reasonWhy: "All-in engage Lulu'nun poke stilini bozar.", laneAdvantage: "Stun + tanklık Lulu'yu overwhelm eder.", watchOut: "Lulu W polymorph Leona'yı dönüştürür.", buildHint: "Locket of the Iron Solari, Zeke's Convergence" },
      { champion: "Thresh", difficulty: "medium", tier: "A", reasonWhy: "Hook Lulu'yu uzaktan yakalar.", laneAdvantage: "Chain CC Lulu için sorun.", watchOut: "Lulu E kalkan + R büyüme güçlü.", buildHint: "Locket of the Iron Solari, Knight's Vow" },
    ],
    easyCounters: [
      { champion: "Nautilus", difficulty: "easy", tier: "A", reasonWhy: "En kolay Lulu counter'ı.", laneAdvantage: "CC chain.", watchOut: "Lulu W polymorph.", buildHint: "Locket of the Iron Solari, Warmog's Armor" },
      { champion: "Leona", difficulty: "easy", tier: "A", reasonWhy: "Engage gücü.", laneAdvantage: "All-in.", watchOut: "Lulu poke güçlüdür.", buildHint: "Locket of the Iron Solari, Zeke's Convergence" },
    ],
    soloQueueCounters: [
      { champion: "Leona", difficulty: "easy", tier: "A", reasonWhy: "Solo queue'da Lulu için iyi counter.", laneAdvantage: "Engage.", watchOut: "Lulu W polymorph.", buildHint: "Locket of the Iron Solari, Zeke's Convergence" },
      { champion: "Nautilus", difficulty: "medium", tier: "A", reasonWhy: "Hook Lulu için sorun.", laneAdvantage: "CC chain.", watchOut: "Lulu R Nautilus CC'sini iptal eder.", buildHint: "Locket of the Iron Solari, Warmog's Armor" },
    ],
    tips: ["Lulu W polymorph CCdurur, engage öncesi kullan.", "Lulu E kalkan + R ADC'ye kullanılır.", "Lulu pix E hem kendine hem hedefe uygulanabilir."],
    patchNote: NOTE,
  },

  "Milio": {
    topCounters: [
      { champion: "Leona", difficulty: "medium", tier: "S", reasonWhy: "All-in engage Milio'nun güvenli heal stilini bozar.", laneAdvantage: "Stun + tanklık Milio'yu overwhelm eder.", watchOut: "Milio R CC temizleme çok güçlüdür.", buildHint: "Locket of the Iron Solari, Zeke's Convergence" },
      { champion: "Nautilus", difficulty: "medium", tier: "A", reasonWhy: "Hook + CC Milio için sorun.", laneAdvantage: "Passive root.", watchOut: "Milio R tüm CC'yi temizler.", buildHint: "Locket of the Iron Solari, Warmog's Armor" },
      { champion: "Blitzcrank", difficulty: "medium", tier: "A", reasonWhy: "Hook Milio'yu yakalar.", laneAdvantage: "Grab ani.", watchOut: "Milio R grab sonrası CC'yi temizler.", buildHint: "Locket of the Iron Solari, Knight's Vow" },
    ],
    easyCounters: [
      { champion: "Leona", difficulty: "easy", tier: "S", reasonWhy: "En kolay Milio counter'ı.", laneAdvantage: "Engage.", watchOut: "Milio R CC temizleme.", buildHint: "Locket of the Iron Solari, Zeke's Convergence" },
      { champion: "Nautilus", difficulty: "easy", tier: "A", reasonWhy: "CC chain.", laneAdvantage: "Hook.", watchOut: "Milio R.", buildHint: "Locket of the Iron Solari, Warmog's Armor" },
    ],
    soloQueueCounters: [
      { champion: "Leona", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da Milio için en iyi counter.", laneAdvantage: "Engage gücü.", watchOut: "Milio R CC temizler.", buildHint: "Locket of the Iron Solari, Zeke's Convergence" },
      { champion: "Blitzcrank", difficulty: "medium", tier: "A", reasonWhy: "Hook.", laneAdvantage: "Grab.", watchOut: "Milio R temizleme.", buildHint: "Locket of the Iron Solari, Knight's Vow" },
    ],
    tips: ["Milio R tüm CC efektlerini temizler, CDR varken dikkatli.", "Milio E ateş kalkan hasar azaltır.", "Milio Q tuş takip eder."],
    patchNote: NOTE,
  },

  "Morgana": {
    topCounters: [
      { champion: "Soraka", difficulty: "medium", tier: "S", reasonWhy: "Sustain heal Morgana'nın DoT Q damage'ını dengeler.", laneAdvantage: "Silence Morgana spell spam'ini keser.", watchOut: "Morgana Q root + W torment combo ani.", buildHint: "Moonstone Renewer, Chemtech Putrifier" },
      { champion: "Lulu", difficulty: "medium", tier: "A", reasonWhy: "Polymorph Morgana'yı Q atmadan keser.", laneAdvantage: "W hız + kalkan Morgana pool'undan kaçar.", watchOut: "Morgana Q root uzun CD'ye sahip değil.", buildHint: "Moonstone Renewer, Ardent Censer" },
      { champion: "Janna", difficulty: "medium", tier: "A", reasonWhy: "Disengage Morgana'nın engage combo'sunu iptal eder.", laneAdvantage: "R itmesi Morgana Q engage'ini bozar.", watchOut: "Morgana Black Shield kendi ally'larına da uygulanır.", buildHint: "Shurelya's Battlesong, Locket of the Iron Solari" },
    ],
    easyCounters: [
      { champion: "Soraka", difficulty: "easy", tier: "S", reasonWhy: "En kolay Morgana counter'ı.", laneAdvantage: "Sustain healing.", watchOut: "Morgana Q root.", buildHint: "Moonstone Renewer, Redemption" },
      { champion: "Lulu", difficulty: "easy", tier: "A", reasonWhy: "Polymorph Q'yu keser.", laneAdvantage: "Kalkan + hareket.", watchOut: "Morgana R ult AoE.", buildHint: "Moonstone Renewer, Ardent Censer" },
    ],
    soloQueueCounters: [
      { champion: "Soraka", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da Morgana için en iyi counter.", laneAdvantage: "Sustain.", watchOut: "Morgana Q root.", buildHint: "Moonstone Renewer, Chemtech Putrifier" },
      { champion: "Janna", difficulty: "medium", tier: "A", reasonWhy: "Disengage Morgana engage'ini bozar.", laneAdvantage: "R itmesi.", watchOut: "Morgana Black Shield kendi takımını da korur.", buildHint: "Shurelya's Battlesong, Locket of the Iron Solari" },
    ],
    tips: ["Morgana Q minyondan geçmez, minyon arkasında dur.", "Morgana Black Shield CC'yi bloklar, CD takip et.", "Morgana R kanal esnasında düşman kaçabilir."],
    patchNote: NOTE,
  },

  "Nami": {
    topCounters: [
      { champion: "Nautilus", difficulty: "medium", tier: "S", reasonWhy: "Hook + CC chain Nami'nin kite stilini bozar.", laneAdvantage: "Passive root Nami için sorun.", watchOut: "Nami W double bounce heal + hasar.", buildHint: "Locket of the Iron Solari, Warmog's Armor" },
      { champion: "Leona", difficulty: "medium", tier: "A", reasonWhy: "All-in engage Nami'nin poke stilini bozar.", laneAdvantage: "CC chain Nami için sorun.", watchOut: "Nami W bounce Leona'yı yavaşlatır.", buildHint: "Locket of the Iron Solari, Zeke's Convergence" },
      { champion: "Thresh", difficulty: "medium", tier: "A", reasonWhy: "Hook Nami'yi uzaktan yakalar.", laneAdvantage: "Chain CC Nami için sorun.", watchOut: "Nami Q stun dalgası.", buildHint: "Locket of the Iron Solari, Knight's Vow" },
    ],
    easyCounters: [
      { champion: "Leona", difficulty: "easy", tier: "A", reasonWhy: "En kolay Nami counter'ı.", laneAdvantage: "Engage gücü.", watchOut: "Nami W heal.", buildHint: "Locket of the Iron Solari, Zeke's Convergence" },
      { champion: "Nautilus", difficulty: "easy", tier: "A", reasonWhy: "CC chain.", laneAdvantage: "Hook.", watchOut: "Nami Q dalgası.", buildHint: "Locket of the Iron Solari, Warmog's Armor" },
    ],
    soloQueueCounters: [
      { champion: "Leona", difficulty: "easy", tier: "A", reasonWhy: "Solo queue'da Nami için iyi counter.", laneAdvantage: "Engage.", watchOut: "Nami W double bounce.", buildHint: "Locket of the Iron Solari, Zeke's Convergence" },
      { champion: "Nautilus", difficulty: "medium", tier: "A", reasonWhy: "Hook.", laneAdvantage: "CC chain.", watchOut: "Nami Q dalgası.", buildHint: "Locket of the Iron Solari, Warmog's Armor" },
    ],
    tips: ["Nami Q dalga tek hedefli, yana hareket et.", "Nami W iki kez zıplar, ikinci zıplamayı öngör.", "Nami R tsunami büyük AoE, dağılın."],
    patchNote: NOTE,
  },

  "Nautilus": {
    topCounters: [
      { champion: "Morgana", difficulty: "medium", tier: "S", reasonWhy: "Black Shield Nautilus'un tüm CC zincirini bloklar.", laneAdvantage: "Q kök Nautilus'u immobilize eder.", watchOut: "Nautilus hook Black Shield'ı tüketir, passive root'a dikkat.", buildHint: "Imperial Mandate, Chemtech Putrifier" },
      { champion: "Lulu", difficulty: "medium", tier: "A", reasonWhy: "Polymorph Nautilus engage'ini keser.", laneAdvantage: "W hız + kalkan ADC'yi korur.", watchOut: "Nautilus hook + R combo.", buildHint: "Moonstone Renewer, Ardent Censer" },
      { champion: "Thresh", difficulty: "medium", tier: "A", reasonWhy: "Fener + hook Nautilus engage counter engage.", laneAdvantage: "E geri itmesi Nautilus hook'unu iptal eder.", watchOut: "Nautilus hook Thresh için tehlikeli.", buildHint: "Locket of the Iron Solari, Knight's Vow" },
    ],
    easyCounters: [
      { champion: "Morgana", difficulty: "easy", tier: "S", reasonWhy: "En kolay Nautilus counter'ı.", laneAdvantage: "Black Shield her CC'yi engeller.", watchOut: "Nautilus passive root.", buildHint: "Imperial Mandate, Redemption" },
      { champion: "Lulu", difficulty: "easy", tier: "A", reasonWhy: "Polymorph engage'i keser.", laneAdvantage: "ADC koruması.", watchOut: "Nautilus hook ani.", buildHint: "Moonstone Renewer, Ardent Censer" },
    ],
    soloQueueCounters: [
      { champion: "Morgana", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da Nautilus için en iyi counter.", laneAdvantage: "Black Shield dominant.", watchOut: "Nautilus hook + passive root.", buildHint: "Imperial Mandate, Redemption" },
      { champion: "Lulu", difficulty: "medium", tier: "A", reasonWhy: "Polymorph dominant.", laneAdvantage: "ADC koruması.", watchOut: "Nautilus R ult CC.", buildHint: "Moonstone Renewer, Ardent Censer" },
    ],
    tips: ["Nautilus passive root her AA'dan sonra çalışır.", "Nautilus hook minyondan geçer.", "Nautilus R ult knockup chain CC."],
    patchNote: NOTE,
  },

  "Pyke": {
    topCounters: [
      { champion: "Lulu", difficulty: "medium", tier: "S", reasonWhy: "Polymorph Pyke'ın R execute'unu keser.", laneAdvantage: "W hız + kalkan Pyke için sorun.", watchOut: "Pyke E stab ani.", buildHint: "Moonstone Renewer, Ardent Censer" },
      { champion: "Soraka", difficulty: "medium", tier: "A", reasonWhy: "Heal Pyke'ın bleed passive'ini dengeler.", laneAdvantage: "Silence Pyke combo'sunu keser.", watchOut: "Pyke R execute Soraka'yı öldürür.", buildHint: "Moonstone Renewer, Redemption" },
      { champion: "Morgana", difficulty: "medium", tier: "A", reasonWhy: "Black Shield Pyke Q CC'sini bloklar.", laneAdvantage: "Q kök Pyke'ı immobilize eder.", watchOut: "Pyke R execute Morgana'ya da gelir.", buildHint: "Imperial Mandate, Chemtech Putrifier" },
    ],
    easyCounters: [
      { champion: "Lulu", difficulty: "easy", tier: "S", reasonWhy: "En kolay Pyke counter'ı.", laneAdvantage: "Polymorph R'ı keser.", watchOut: "Pyke E stab.", buildHint: "Moonstone Renewer, Ardent Censer" },
      { champion: "Soraka", difficulty: "easy", tier: "A", reasonWhy: "Heal bleed'i dengeler.", laneAdvantage: "Silence combo'yu keser.", watchOut: "Pyke R execute.", buildHint: "Moonstone Renewer, Redemption" },
    ],
    soloQueueCounters: [
      { champion: "Lulu", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da Pyke için en iyi counter.", laneAdvantage: "Polymorph R'ı keser.", watchOut: "Pyke E stab ani.", buildHint: "Moonstone Renewer, Ardent Censer" },
      { champion: "Soraka", difficulty: "easy", tier: "A", reasonWhy: "Sustain.", laneAdvantage: "Heal.", watchOut: "Pyke R execute.", buildHint: "Moonstone Renewer, Chemtech Putrifier" },
    ],
    tips: ["Pyke R execute belirli HP altındakilere çalışır.", "Pyke passive HP yerine AD kazanır, tank build yapamaz.", "Pyke E stab combo'dan önce immobilize eder."],
    patchNote: NOTE,
  },

  "Renata Glasc": {
    topCounters: [
      { champion: "Morgana", difficulty: "medium", tier: "S", reasonWhy: "Black Shield Renata'nın CC+kemo zincirini bloklar.", laneAdvantage: "Q kök Renata'yı immobilize eder.", watchOut: "Renata W revive mekanizması güçlüdür.", buildHint: "Imperial Mandate, Chemtech Putrifier" },
      { champion: "Soraka", difficulty: "medium", tier: "A", reasonWhy: "Sustain Renata'nın DoT kemo hasarını dengeler.", laneAdvantage: "Silence kemo combo'sunu keser.", watchOut: "Renata R hostile berserk çok tehlikeli.", buildHint: "Moonstone Renewer, Redemption" },
      { champion: "Lulu", difficulty: "medium", tier: "A", reasonWhy: "Polymorph Renata engage'ini keser.", laneAdvantage: "Kalkan + hareket.", watchOut: "Renata W revive ADC'yi geri getirir.", buildHint: "Moonstone Renewer, Ardent Censer" },
    ],
    easyCounters: [
      { champion: "Morgana", difficulty: "easy", tier: "S", reasonWhy: "En kolay Renata counter'ı.", laneAdvantage: "Black Shield CC'yi bloklar.", watchOut: "Renata W revive.", buildHint: "Imperial Mandate, Redemption" },
      { champion: "Soraka", difficulty: "easy", tier: "A", reasonWhy: "Sustain.", laneAdvantage: "Heal.", watchOut: "Renata R berserk.", buildHint: "Moonstone Renewer, Chemtech Putrifier" },
    ],
    soloQueueCounters: [
      { champion: "Morgana", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da Renata için en iyi counter.", laneAdvantage: "Black Shield.", watchOut: "Renata W revive.", buildHint: "Imperial Mandate, Redemption" },
      { champion: "Soraka", difficulty: "easy", tier: "A", reasonWhy: "Sustain.", laneAdvantage: "Heal.", watchOut: "Renata R berserk.", buildHint: "Moonstone Renewer, Redemption" },
    ],
    tips: ["Renata R berserk friendly fire yapar, dağılın.", "Renata W revive mekanizması ADC'yi geri getirir.", "Renata Q root + W combo powerfully."],
    patchNote: NOTE,
  },

  "Senna": {
    topCounters: [
      { champion: "Leona", difficulty: "medium", tier: "S", reasonWhy: "All-in engage Senna'nın güvenli poke stilini bozar.", laneAdvantage: "Stun + tanklık Senna için sorun.", watchOut: "Senna R global shield her yerden gelir.", buildHint: "Locket of the Iron Solari, Zeke's Convergence" },
      { champion: "Nautilus", difficulty: "medium", tier: "A", reasonWhy: "Hook Senna'yı yakalar.", laneAdvantage: "CC chain.", watchOut: "Senna Q root + hasar.", buildHint: "Locket of the Iron Solari, Warmog's Armor" },
      { champion: "Thresh", difficulty: "medium", tier: "A", reasonWhy: "Hook + CC chain Senna için sorun.", laneAdvantage: "Chain CC Senna poke'unu engeller.", watchOut: "Senna R global her yerden gelir.", buildHint: "Locket of the Iron Solari, Knight's Vow" },
    ],
    easyCounters: [
      { champion: "Leona", difficulty: "easy", tier: "S", reasonWhy: "En kolay Senna counter'ı.", laneAdvantage: "Engage.", watchOut: "Senna R global.", buildHint: "Locket of the Iron Solari, Zeke's Convergence" },
      { champion: "Nautilus", difficulty: "easy", tier: "A", reasonWhy: "Hook.", laneAdvantage: "CC chain.", watchOut: "Senna Q root.", buildHint: "Locket of the Iron Solari, Warmog's Armor" },
    ],
    soloQueueCounters: [
      { champion: "Leona", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da Senna için en iyi counter.", laneAdvantage: "Engage.", watchOut: "Senna R global.", buildHint: "Locket of the Iron Solari, Zeke's Convergence" },
      { champion: "Blitzcrank", difficulty: "medium", tier: "A", reasonWhy: "Hook Senna'yı yakalar.", laneAdvantage: "Grab.", watchOut: "Senna Q root.", buildHint: "Locket of the Iron Solari, Knight's Vow" },
    ],
    tips: ["Senna stack'leri ruh toplarından gelir, öldürülen düşmanlardan.", "Senna R global shield + hasar her yerden.", "Senna W mist shroud Senna'yı gizler."],
    patchNote: NOTE,
  },

  "Sona": {
    topCounters: [
      { champion: "Leona", difficulty: "hard", tier: "S", reasonWhy: "All-in engage Sona'nın çok kırılgan yapısını ezer.", laneAdvantage: "Stun + tanklık Sona için kabus.", watchOut: "Sona R crescendo geniş alan stun.", buildHint: "Locket of the Iron Solari, Zeke's Convergence" },
      { champion: "Nautilus", difficulty: "medium", tier: "A", reasonWhy: "Hook + CC Sona'yı yakalar.", laneAdvantage: "Passive root.", watchOut: "Sona R geniş stun.", buildHint: "Locket of the Iron Solari, Warmog's Armor" },
      { champion: "Blitzcrank", difficulty: "hard", tier: "A", reasonWhy: "Hook Sona'yı anında öldürür.", laneAdvantage: "Grab ani.", watchOut: "Sona R stun geniş.", buildHint: "Locket of the Iron Solari, Knight's Vow" },
    ],
    easyCounters: [
      { champion: "Leona", difficulty: "easy", tier: "S", reasonWhy: "En kolay Sona counter'ı.", laneAdvantage: "Engage.", watchOut: "Sona R geniş stun.", buildHint: "Locket of the Iron Solari, Zeke's Convergence" },
      { champion: "Nautilus", difficulty: "easy", tier: "A", reasonWhy: "Hook.", laneAdvantage: "CC chain.", watchOut: "Sona passive aura.", buildHint: "Locket of the Iron Solari, Warmog's Armor" },
    ],
    soloQueueCounters: [
      { champion: "Leona", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da Sona için en iyi counter.", laneAdvantage: "Engage.", watchOut: "Sona R crescendo.", buildHint: "Locket of the Iron Solari, Zeke's Convergence" },
      { champion: "Blitzcrank", difficulty: "medium", tier: "A", reasonWhy: "Hook Sona'yı öldürür.", laneAdvantage: "Grab.", watchOut: "Sona R.", buildHint: "Locket of the Iron Solari, Knight's Vow" },
    ],
    tips: ["Sona çok kırılgan, tek ability öldürebilir.", "Sona aura efektleri kısa menzil gerektirir.", "Sona R crescendo geniş alan, dağılın."],
    patchNote: NOTE,
  },

  "Soraka": {
    topCounters: [
      { champion: "Leona", difficulty: "medium", tier: "S", reasonWhy: "All-in engage Soraka'nın heal stilini bozar.", laneAdvantage: "Stun + tanklık Soraka için sorun.", watchOut: "Soraka R global heal her yerden.", buildHint: "Locket of the Iron Solari, Zeke's Convergence" },
      { champion: "Nautilus", difficulty: "medium", tier: "A", reasonWhy: "Hook + CC Soraka'yı yakalar.", laneAdvantage: "Passive root.", watchOut: "Soraka R global.", buildHint: "Locket of the Iron Solari, Warmog's Armor" },
      { champion: "Zyra", difficulty: "medium", tier: "A", reasonWhy: "Grevious wounds + poke Soraka'nın heal'ini azaltır.", laneAdvantage: "Plant poke Soraka'yı zorlar.", watchOut: "Soraka silence Zyra combo'sunu keser.", buildHint: "Liandry's Anguish, Chemtech Putrifier" },
    ],
    easyCounters: [
      { champion: "Leona", difficulty: "easy", tier: "S", reasonWhy: "En kolay Soraka counter'ı.", laneAdvantage: "Engage.", watchOut: "Soraka R global.", buildHint: "Locket of the Iron Solari, Zeke's Convergence" },
      { champion: "Zyra", difficulty: "easy", tier: "A", reasonWhy: "Grevious wounds heal'i azaltır.", laneAdvantage: "Plant poke.", watchOut: "Soraka silence.", buildHint: "Liandry's Anguish, Chemtech Putrifier" },
    ],
    soloQueueCounters: [
      { champion: "Leona", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da Soraka için en iyi counter.", laneAdvantage: "Engage.", watchOut: "Soraka R global.", buildHint: "Locket of the Iron Solari, Zeke's Convergence" },
      { champion: "Zyra", difficulty: "medium", tier: "A", reasonWhy: "Grevious wounds + poke.", laneAdvantage: "Plant control.", watchOut: "Soraka silence R combo.", buildHint: "Liandry's Anguish, Chemtech Putrifier" },
    ],
    tips: ["Soraka R global heal, Grievous Wounds ile etkisizleştir.", "Soraka Q silence + heal kullanır.", "Soraka E silence Soraka'nın kendini çekemez."],
    patchNote: NOTE,
  },

  "Thresh": {
    topCounters: [
      { champion: "Morgana", difficulty: "medium", tier: "S", reasonWhy: "Black Shield Thresh'in tüm CC zincirini bloklar.", laneAdvantage: "Q kök ile Thresh'i immobilize eder.", watchOut: "Thresh hook'u Black Shield tüketir, E'ye dikkat.", buildHint: "Imperial Mandate, Zhonya's Hourglass" },
      { champion: "Nautilus", difficulty: "medium", tier: "A", reasonWhy: "Hook + passive root ile Thresh'in CC zinciriyle yarışır.", laneAdvantage: "Her level'de Thresh'e karşı hook ile kill tehdit eder.", watchOut: "Thresh'in hook menzilinde durmaktan kaçın.", buildHint: "Locket of the Iron Solari, Warmog's Armor" },
      { champion: "Blitzcrank", difficulty: "hard", tier: "A", reasonWhy: "Rocket grab Thresh'ten daha uzun menzilli ve anında.", laneAdvantage: "İlk grab ADC'yi öldürme potansiyeli çok yüksek.", watchOut: "Thresh lantern ile ADC'nin kaçmasını sağlayabilir.", buildHint: "Locket of the Iron Solari, Knight's Vow" },
    ],
    easyCounters: [
      { champion: "Morgana", difficulty: "easy", tier: "S", reasonWhy: "Black Shield en kolay ve en etkili Thresh counter'ıdır.", laneAdvantage: "Güvenli sustain ve poke.", watchOut: "Thresh fener atmak yerine E kullanabilir.", buildHint: "Imperial Mandate, Chemtech Putrifier" },
      { champion: "Sona", difficulty: "easy", tier: "B", reasonWhy: "Heal poke Thresh'in agresif stilini dengeler.", laneAdvantage: "Passive power chord.", watchOut: "Thresh hook'una yakalanırsa Sona ölür.", buildHint: "Moonstone Renewer, Ardent Censer" },
    ],
    soloQueueCounters: [
      { champion: "Leona", difficulty: "medium", tier: "A", reasonWhy: "Yüksek engage gücü Thresh'in poke stilini ezer.", laneAdvantage: "All-in baskısı Thresh'i savunmaya zorlar.", watchOut: "Thresh'in E geri itmesi Leona engage'ini kesebilir.", buildHint: "Locket of the Iron Solari, Zeke's Convergence" },
      { champion: "Morgana", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da en güvenilir Thresh counter'ıdır.", laneAdvantage: "ADC'yi Black Shield ile her hook'tan korur.", watchOut: "Thresh hook CD'sini takip et.", buildHint: "Imperial Mandate, Redemption" },
    ],
    tips: ["Thresh hook menzilini ezberle, bu menzilde durmaktan kaçın.", "Thresh lantern teamsate'e geçiş sağlar, hook sonrası reaksiyon ver.", "Thresh E geri itmesi engage girişimini kesebilir."],
    patchNote: NOTE,
  },

  "Zyra": {
    topCounters: [
      { champion: "Soraka", difficulty: "medium", tier: "S", reasonWhy: "Sustain Zyra'nın plant hasar DoT'unu dengeler.", laneAdvantage: "Silence Zyra R combo'sunu keser.", watchOut: "Zyra R knockup geniş alan.", buildHint: "Moonstone Renewer, Chemtech Putrifier" },
      { champion: "Lulu", difficulty: "medium", tier: "A", reasonWhy: "Polymorph Zyra combo'sunu keser.", laneAdvantage: "Kalkan + hareket.", watchOut: "Zyra plant field çok tehlikeli.", buildHint: "Moonstone Renewer, Ardent Censer" },
      { champion: "Morgana", difficulty: "medium", tier: "A", reasonWhy: "Black Shield Zyra R CC'sini bloklar.", laneAdvantage: "Q kök Zyra'yı immobilize eder.", watchOut: "Zyra plant spawn Morgana'yı zehirler.", buildHint: "Imperial Mandate, Chemtech Putrifier" },
    ],
    easyCounters: [
      { champion: "Soraka", difficulty: "easy", tier: "S", reasonWhy: "En kolay Zyra counter'ı.", laneAdvantage: "Sustain.", watchOut: "Zyra plant damage.", buildHint: "Moonstone Renewer, Redemption" },
      { champion: "Morgana", difficulty: "easy", tier: "A", reasonWhy: "Black Shield Zyra R'ını bloklar.", laneAdvantage: "Q kök.", watchOut: "Zyra plant field.", buildHint: "Imperial Mandate, Chemtech Putrifier" },
    ],
    soloQueueCounters: [
      { champion: "Soraka", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da Zyra için en iyi counter.", laneAdvantage: "Sustain.", watchOut: "Zyra R knockup.", buildHint: "Moonstone Renewer, Chemtech Putrifier" },
      { champion: "Lulu", difficulty: "medium", tier: "A", reasonWhy: "Polymorph combo'yu keser.", laneAdvantage: "ADC koruması.", watchOut: "Zyra plant zone.", buildHint: "Moonstone Renewer, Ardent Censer" },
    ],
    tips: ["Zyra plant'ları prioritize et, temizle.", "Zyra R knockup altında durma.", "Zyra E snare + R knockup combo."],
    patchNote: NOTE,
  },
};
