import type { GeneralCounterResult } from "../../types/counter.types";

type RoleData = Omit<GeneralCounterResult, "champion" | "role" | "generatedAt">;

const NOTE = "Bu veriler manuel olarak girilmiştir. Patch güncellemelerini yansıtmayabilir.";

export const BOT_COUNTERS: Record<string, RoleData> = {
  "Aphelios": {
    topCounters: [
      { champion: "Draven", difficulty: "hard", tier: "S", reasonWhy: "Draven erken baskısı Aphelios'un silah rotasyonunu öğrenmesine izin vermez.", laneAdvantage: "Axes hasar Aphelios'un herhangi bir silah setini ezer.", watchOut: "Aphelios Infernum (ateş) AoE konumlama bilmek gerekir.", buildHint: "Collector, Infinity Edge" },
      { champion: "Caitlyn", difficulty: "medium", tier: "A", reasonWhy: "Uzun menzil Aphelios'un kısa menzil silahlarını geçersiz kılar.", laneAdvantage: "Headshot her Aphelios silah değişiminde tick verir.", watchOut: "Aphelios Crescendum (bumerang) kısa menzilde çok güçlü.", buildHint: "Kraken Slayer, Rapid Firecannon" },
      { champion: "Miss Fortune", difficulty: "medium", tier: "A", reasonWhy: "Love Tap poke Aphelios'un zayıf erken oyununu cezalandırır.", laneAdvantage: "Double Up + E slow combo güçlü.", watchOut: "Aphelios Gravitum (mor) slow + root.", buildHint: "Kraken Slayer, Serylda's Grudge" },
    ],
    easyCounters: [
      { champion: "Miss Fortune", difficulty: "easy", tier: "A", reasonWhy: "En kolay Aphelios counter'ı.", laneAdvantage: "Erken poke dominant.", watchOut: "Aphelios silah seçimi öğren.", buildHint: "Kraken Slayer, Lord Dominik's Regards" },
      { champion: "Caitlyn", difficulty: "easy", tier: "A", reasonWhy: "Menzil avantajı Aphelios'u zorlar.", laneAdvantage: "Güvenli poke.", watchOut: "Aphelios Crescendum çok güçlü.", buildHint: "Kraken Slayer, Rapid Firecannon" },
    ],
    soloQueueCounters: [
      { champion: "Draven", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Aphelios için en iyi counter.", laneAdvantage: "Erken kill baskısı.", watchOut: "Aphelios silah rotasyonu.", buildHint: "Collector, Infinity Edge" },
      { champion: "Miss Fortune", difficulty: "easy", tier: "A", reasonWhy: "Poke stili kolay oynanır.", laneAdvantage: "Erken dominans.", watchOut: "Aphelios root kombosu.", buildHint: "Kraken Slayer, Serylda's Grudge" },
    ],
    tips: ["Aphelios 5 farklı silah döngüsü var, kırmızı/mor/mavi kombinasyonlarını öğren.", "Aphelios Crescendum (bumerang) çok kısa menzilde en güçlü.", "Aphelios Gravitum root + başka silah combo'su tehlikelidir."],
    patchNote: NOTE,
  },

  "Ashe": {
    topCounters: [
      { champion: "Draven", difficulty: "hard", tier: "S", reasonWhy: "Draven erken burst Ashe'in kite stilini bozar.", laneAdvantage: "Axes hasar Ashe'i erken eridir.", watchOut: "Ashe R global stun her yerden gelir.", buildHint: "Collector, Infinity Edge" },
      { champion: "Miss Fortune", difficulty: "medium", tier: "A", reasonWhy: "Love Tap Ashe'in poke'undan daha fazla hasar verir.", laneAdvantage: "Double Up combo güçlü.", watchOut: "Ashe R stun MF engage bozar.", buildHint: "Kraken Slayer, Serylda's Grudge" },
      { champion: "Lucian", difficulty: "medium", tier: "A", reasonWhy: "E dodge Ashe slow'undan kaçar, erken agresiflik güçlü.", laneAdvantage: "Short burst cycle Ashe için sorun.", watchOut: "Ashe R global range.", buildHint: "The Collector, Essence Reaver" },
    ],
    easyCounters: [
      { champion: "Miss Fortune", difficulty: "easy", tier: "A", reasonWhy: "En kolay Ashe counter'ı.", laneAdvantage: "Poke + combo güçlü.", watchOut: "Ashe R global stun.", buildHint: "Kraken Slayer, Lord Dominik's Regards" },
      { champion: "Draven", difficulty: "medium", tier: "S", reasonWhy: "Burst Ashe'i erken öldürür.", laneAdvantage: "Erken kill baskısı.", watchOut: "Ashe R global.", buildHint: "Collector, Infinity Edge" },
    ],
    soloQueueCounters: [
      { champion: "Draven", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Ashe için en iyi counter.", laneAdvantage: "Erken kill.", watchOut: "Ashe R global her an.", buildHint: "Collector, Kraken Slayer" },
      { champion: "Lucian", difficulty: "medium", tier: "A", reasonWhy: "Erken agresiflik Ashe'i zorlnur.", laneAdvantage: "E dodge slow'dan kaçar.", watchOut: "Ashe late kite güçlü.", buildHint: "Collector, Essence Reaver" },
    ],
    tips: ["Ashe Q empowered attack slow verirken hasar ver.", "Ashe R global menzil, geri çekildiğinde bile gelir.", "Ashe kite stili vardır, gap close şampiyonu seç."],
    patchNote: NOTE,
  },

  "Caitlyn": {
    topCounters: [
      { champion: "Draven", difficulty: "hard", tier: "S", reasonWhy: "Draven erken all-in baskısı Caitlyn'in güvenli poke stilini bozar.", laneAdvantage: "Axes hasar Headshot'u geçer.", watchOut: "Caitlyn trap + Q snare kombosu.", buildHint: "Collector, Infinity Edge" },
      { champion: "Sivir", difficulty: "medium", tier: "A", reasonWhy: "E spell shield Caitlyn'in Q + headshot poke'unu engeller.", laneAdvantage: "Spell shield her poke'u bloklar.", watchOut: "Caitlyn trap ward'ı geçer.", buildHint: "Kraken Slayer, Ravenous Hydra" },
      { champion: "Miss Fortune", difficulty: "medium", tier: "A", reasonWhy: "Love Tap Caitlyn poke'una eşit yanıt verir.", laneAdvantage: "Double Up + poke güçlü.", watchOut: "Caitlyn trap headshot combo.", buildHint: "Kraken Slayer, Serylda's Grudge" },
    ],
    easyCounters: [
      { champion: "Sivir", difficulty: "easy", tier: "A", reasonWhy: "Caitlyn için en kolay counter.", laneAdvantage: "Spell shield tüm poke'u bloklar.", watchOut: "Caitlyn trap görmezden gelme.", buildHint: "Kraken Slayer, Ravenous Hydra" },
      { champion: "Miss Fortune", difficulty: "easy", tier: "A", reasonWhy: "Poke Caitlyn'e eşit veya daha güçlü.", laneAdvantage: "Double Up combo.", watchOut: "Caitlyn net immobilize eder.", buildHint: "Kraken Slayer, Lord Dominik's Regards" },
    ],
    soloQueueCounters: [
      { champion: "Draven", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Caitlyn için en iyi counter.", laneAdvantage: "Erken kill.", watchOut: "Caitlyn headshot + trap.", buildHint: "Collector, Infinity Edge" },
      { champion: "Miss Fortune", difficulty: "easy", tier: "A", reasonWhy: "Güvenli seçim.", laneAdvantage: "Poke + combo.", watchOut: "Caitlyn trap ward'ı geçer.", buildHint: "Kraken Slayer, Serylda's Grudge" },
    ],
    tips: ["Caitlyn trap üzerinde headshot daha çok hasar verir.", "Caitlyn net önce immobilize, sonra gelir.", "Caitlyn menzil en uzun ADC, kısa menzil avantajını iyi kullan."],
    patchNote: NOTE,
  },

  "Draven": {
    topCounters: [
      { champion: "Caitlyn", difficulty: "medium", tier: "A", reasonWhy: "Headshot uzak menzilde Draven axes toplama'sını zorlaştırır.", laneAdvantage: "Menzil avantajı Draven axes'ini hareket ettirir.", watchOut: "Draven axes stack çok güçlüdür.", buildHint: "Kraken Slayer, Rapid Firecannon" },
      { champion: "Sivir", difficulty: "medium", tier: "A", reasonWhy: "Spell shield Draven'ın Q axes'ini bloklar.", laneAdvantage: "E hem axes'i hem Q'yu bloklar.", watchOut: "Draven erken baskı çok güçlüdür.", buildHint: "Kraken Slayer, Ravenous Hydra" },
      { champion: "Miss Fortune", difficulty: "medium", tier: "A", reasonWhy: "Double Up Draven axes konumunu rahatsız eder.", laneAdvantage: "Sürekli poke Draven için sorun.", watchOut: "Draven tüm lane baskılar.", buildHint: "Kraken Slayer, Serylda's Grudge" },
    ],
    easyCounters: [
      { champion: "Sivir", difficulty: "easy", tier: "A", reasonWhy: "Draven için en kolay counter.", laneAdvantage: "E her axes'i bloklar.", watchOut: "Draven stacks büyürse.", buildHint: "Kraken Slayer, Ravenous Hydra" },
      { champion: "Caitlyn", difficulty: "easy", tier: "B", reasonWhy: "Menzil Draven axes'ini rahatsız eder.", laneAdvantage: "Headshot poke.", watchOut: "Draven erken çok agresif.", buildHint: "Kraken Slayer, Rapid Firecannon" },
    ],
    soloQueueCounters: [
      { champion: "Caitlyn", difficulty: "medium", tier: "A", reasonWhy: "Solo queue'da Draven için iyi counter.", laneAdvantage: "Menzil avantajı.", watchOut: "Draven erken snowball.", buildHint: "Kraken Slayer, Rapid Firecannon" },
      { champion: "Sivir", difficulty: "easy", tier: "A", reasonWhy: "E spell shield Draven axes'ini geçersiz kılar.", laneAdvantage: "Wave clear + spell shield.", watchOut: "Draven stack'ı büyüdükçe tehlikeli.", buildHint: "Kraken Slayer, Ravenous Hydra" },
    ],
    tips: ["Draven axes alanını tahmin et, oraya hareket et.", "Draven W hız boost axes toplamak için kullanır.", "Draven stack'leri düşürülünce sıfırlanır, hayatta kal."],
    patchNote: NOTE,
  },

  "Ezreal": {
    topCounters: [
      { champion: "Draven", difficulty: "hard", tier: "S", reasonWhy: "Draven'ın erken hasar baskısı Ezreal'i Q poke edemeden zonlar.", laneAdvantage: "Axes passive dominant lane baskısı sağlar.", watchOut: "Ezreal'in E blink'i Draven'ın engage'inden kaçabilir.", buildHint: "Collector, Infinity Edge" },
      { champion: "Miss Fortune", difficulty: "medium", tier: "A", reasonWhy: "Love Tap + Double Up Ezreal'in poke'una oranla çok daha fazla hasar verir.", laneAdvantage: "Ezreal pokelarına eşit hasarla döner.", watchOut: "Ezreal Q'su uzak mesafede isabetli.", buildHint: "Kraken Slayer, Serylda's Grudge" },
      { champion: "Varus", difficulty: "medium", tier: "A", reasonWhy: "Uzun menzilli Q poke Ezreal'den daha isabetli. R ile Ezreal'in blink öncesi kilitler.", laneAdvantage: "R chain CC sonrası tüm takım Ezreal'e düşer.", watchOut: "Ezreal E blink'i erken kullanmadan R atma.", buildHint: "Trinity Force, Kraken Slayer" },
    ],
    easyCounters: [
      { champion: "Miss Fortune", difficulty: "easy", tier: "A", reasonWhy: "Agresif hasar çıkışı Ezreal'i overwhelm eder.", laneAdvantage: "E movespeed ile Ezreal'i kovalayabilir.", watchOut: "Ezreal Q uzak mesafede isabetli.", buildHint: "Kraken Slayer, Rapid Firecannon" },
      { champion: "Sivir", difficulty: "easy", tier: "B", reasonWhy: "E spell shield Ezreal'in Q'sunu bloklar.", laneAdvantage: "Spell shield her Ezreal Q'sunu geçersiz kılar.", watchOut: "Ezreal R uzak mesafeden gelebilir.", buildHint: "Kraken Slayer, Ravenous Hydra" },
    ],
    soloQueueCounters: [
      { champion: "Draven", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Ezreal'i en güçlü baskılayan ADC'dir.", laneAdvantage: "Snowball gücü yüksek, öncü avantaj şart.", watchOut: "Stack'leri boşa harcama.", buildHint: "Collector, Kraken Slayer" },
      { champion: "Caitlyn", difficulty: "easy", tier: "A", reasonWhy: "Menzil avantajı Ezreal'in kite stiline karşı güvenli poke sağlar.", laneAdvantage: "Headshot mekaniği sürekli pasif hasar üretir.", watchOut: "Ezreal R global menzilde gelir.", buildHint: "Kraken Slayer, Rapid Firecannon" },
    ],
    tips: ["Ezreal E'siz kaldığında agresif ol, CD ~19 saniye.", "Ezreal'in R'ı 1 saniyelik cast süresi var, yürürken zap.", "Ezreal full build çok güçlü, erken önde olmak şarttır."],
    patchNote: NOTE,
  },

  "Jhin": {
    topCounters: [
      { champion: "Draven", difficulty: "hard", tier: "S", reasonWhy: "Draven erken burst Jhin'in 4 atış döngüsünü bozar.", laneAdvantage: "Axes Jhin reload süresini cezalandırır.", watchOut: "Jhin W root ani gelir.", buildHint: "Collector, Infinity Edge" },
      { champion: "Lucian", difficulty: "medium", tier: "A", reasonWhy: "Mobility Jhin'in kısa menzil baskısını aşar.", laneAdvantage: "E dash Jhin W'sinden kaçar.", watchOut: "Jhin 4. atış çok yüksek hasar.", buildHint: "Collector, Essence Reaver" },
      { champion: "Miss Fortune", difficulty: "medium", tier: "A", reasonWhy: "Poke Jhin reload süresinde baskı yapar.", laneAdvantage: "Double Up + E slow combo.", watchOut: "Jhin R uzak menzil.", buildHint: "Kraken Slayer, Serylda's Grudge" },
    ],
    easyCounters: [
      { champion: "Miss Fortune", difficulty: "easy", tier: "A", reasonWhy: "Jhin için en kolay counter.", laneAdvantage: "Poke + combo.", watchOut: "Jhin 4. atış crit.", buildHint: "Kraken Slayer, Lord Dominik's Regards" },
      { champion: "Draven", difficulty: "medium", tier: "S", reasonWhy: "Burst Jhin için sorun.", laneAdvantage: "Erken kill.", watchOut: "Jhin W root.", buildHint: "Collector, Infinity Edge" },
    ],
    soloQueueCounters: [
      { champion: "Draven", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Jhin için en iyi counter.", laneAdvantage: "Erken kill.", watchOut: "Jhin R uzaktan öldürür.", buildHint: "Collector, Infinity Edge" },
      { champion: "Miss Fortune", difficulty: "easy", tier: "A", reasonWhy: "Güvenli seçim.", laneAdvantage: "Poke + combo.", watchOut: "Jhin W root sürpriz.", buildHint: "Kraken Slayer, Serylda's Grudge" },
    ],
    tips: ["Jhin reload süresinde agresif ol (4. atış sonrası).", "Jhin W root minyon chain'i geçer.", "Jhin R 4 atış, son atış crit + yavaşlama."],
    patchNote: NOTE,
  },

  "Jinx": {
    topCounters: [
      { champion: "Draven", difficulty: "hard", tier: "S", reasonWhy: "Draven'ın erken hasar baskısı Jinx'in skalasını engeller.", laneAdvantage: "Axes passive ile level 1'den kill baskısı oluşturur.", watchOut: "Jinx level 6 ultiyle her yerden kill atabilir.", buildHint: "Collector, Essence Reaver" },
      { champion: "Miss Fortune", difficulty: "medium", tier: "A", reasonWhy: "Love Tap passive ile Jinx'e oranla çok daha fazla poke hasarı verir.", laneAdvantage: "Double Up + E slow combo ile Jinx erken kazanılamaz.", watchOut: "Jinx'in Chompers trap'larından kaçın.", buildHint: "Kraken Slayer, Lord Dominik's Regards" },
      { champion: "Caitlyn", difficulty: "medium", tier: "A", reasonWhy: "En uzun menzilli ADC olarak Jinx'e güvenli poke imkânı verir.", laneAdvantage: "Headshot mechanic ile her minyon kill'de Jinx'e tick vurur.", watchOut: "Jinx'in Q rocket modu, Caitlyn'den daha uzun menzile ulaşır.", buildHint: "Kraken Slayer, Rapid Firecannon" },
    ],
    easyCounters: [
      { champion: "Miss Fortune", difficulty: "easy", tier: "A", reasonWhy: "Yüksek poke hasarı ve güçlü lane baskısı.", laneAdvantage: "Support ile iyi synergy, lane kill baskısı yüksek.", watchOut: "Jinx'in Zap E ile slowed kalırsan MF'in E'si çarpar.", buildHint: "Kraken Slayer, Serylda's Grudge" },
      { champion: "Lucian", difficulty: "medium", tier: "A", reasonWhy: "Kısa menzili agresif pashole mekanizmasıyla Jinx'i erken baskılar.", laneAdvantage: "E dash ile Jinx'in W slow'undan kaçar.", watchOut: "Jinx level 6 sonrası hasar baskısı ciddi artar.", buildHint: "The Collector, Essence Reaver" },
    ],
    soloQueueCounters: [
      { champion: "Draven", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Jinx'i ezdiren en etkili ADC.", laneAdvantage: "Erken kill almak Draven için oyunu kazandırır.", watchOut: "Stack toplarken agresifliği dengele.", buildHint: "Collector, Infinity Edge" },
      { champion: "Caitlyn", difficulty: "easy", tier: "A", reasonWhy: "Güvenli kite ve poke stili solo queue'da kolay oynanır.", laneAdvantage: "Tower range avantajı ile Headshot baskısı güçlü.", watchOut: "Jinx rocket'ının menzilini Caitlyn menziliyle karıştırma.", buildHint: "Kraken Slayer, Rapid Firecannon" },
    ],
    tips: ["Jinx immobile'dir — engage'den önce support CC'sini bekle.", "Jinx'in Q Minigun/Rocket değiştirmesi gecikmeli, bu sürede hasar ver.", "Jinx 2 item sonrası çok güçlenir, öncesinde önde ol."],
    patchNote: NOTE,
  },

  "Kai'Sa": {
    topCounters: [
      { champion: "Caitlyn", difficulty: "medium", tier: "S", reasonWhy: "Uzun menzil Kai'Sa'nın erken farm sürecini zorlaştırır.", laneAdvantage: "Headshot poke Kai'Sa'yı eriten.", watchOut: "Kai'Sa E invisible dive ani gelir.", buildHint: "Kraken Slayer, Rapid Firecannon" },
      { champion: "Draven", difficulty: "hard", tier: "A", reasonWhy: "Erken burst Kai'Sa'nın skale sürecini engeller.", laneAdvantage: "Axes hasar Kai'Sa için sorun.", watchOut: "Kai'Sa R armor dive tehlikeli.", buildHint: "Collector, Infinity Edge" },
      { champion: "Miss Fortune", difficulty: "medium", tier: "A", reasonWhy: "Poke stili Kai'Sa'yı eriten.", laneAdvantage: "Double Up + E slow güçlü.", watchOut: "Kai'Sa W charged uzun menzil.", buildHint: "Kraken Slayer, Serylda's Grudge" },
    ],
    easyCounters: [
      { champion: "Caitlyn", difficulty: "easy", tier: "S", reasonWhy: "Kai'Sa için en kolay counter.", laneAdvantage: "Menzil avantajı.", watchOut: "Kai'Sa E invisible.", buildHint: "Kraken Slayer, Rapid Firecannon" },
      { champion: "Miss Fortune", difficulty: "easy", tier: "A", reasonWhy: "Poke Kai'Sa için sorun.", laneAdvantage: "Double Up.", watchOut: "Kai'Sa 2 item güçlüdür.", buildHint: "Kraken Slayer, Serylda's Grudge" },
    ],
    soloQueueCounters: [
      { champion: "Draven", difficulty: "medium", tier: "A", reasonWhy: "Solo queue'da Kai'Sa için iyi counter.", laneAdvantage: "Erken baskı.", watchOut: "Kai'Sa R dive.", buildHint: "Collector, Infinity Edge" },
      { champion: "Caitlyn", difficulty: "easy", tier: "S", reasonWhy: "En güvenli seçim.", laneAdvantage: "Menzil avantajı.", watchOut: "Kai'Sa E invisible.", buildHint: "Kraken Slayer, Rapid Firecannon" },
    ],
    tips: ["Kai'Sa E invisible dive öncesi yavaşlatma/root ile önle.", "Kai'Sa W uzun cast, interrupt et.", "Kai'Sa 2 item spike çok güçlü, erken önde ol."],
    patchNote: NOTE,
  },

  "Lucian": {
    topCounters: [
      { champion: "Caitlyn", difficulty: "medium", tier: "S", reasonWhy: "Uzun menzil Lucian'ın kısa menzil döngüsünü geçersiz kılar.", laneAdvantage: "Headshot her Lucian E'sinde tick.", watchOut: "Lucian E dash ani engage.", buildHint: "Kraken Slayer, Rapid Firecannon" },
      { champion: "Miss Fortune", difficulty: "medium", tier: "A", reasonWhy: "Double Up Lucian'ın poke döngüsüne karşılık verir.", laneAdvantage: "E movespeed Lucian kovalayabilir.", watchOut: "Lucian E dash + burst ani.", buildHint: "Kraken Slayer, Serylda's Grudge" },
      { champion: "Draven", difficulty: "hard", tier: "A", reasonWhy: "Erken burst Lucian'ın erken baskısına karşı koyar.", laneAdvantage: "Axes hasar Lucian için sorun.", watchOut: "Lucian E dash Draven'ı aşar.", buildHint: "Collector, Infinity Edge" },
    ],
    easyCounters: [
      { champion: "Caitlyn", difficulty: "easy", tier: "S", reasonWhy: "Lucian için en kolay counter.", laneAdvantage: "Menzil avantajı.", watchOut: "Lucian E dash gap close.", buildHint: "Kraken Slayer, Rapid Firecannon" },
      { champion: "Miss Fortune", difficulty: "easy", tier: "A", reasonWhy: "Poke Lucian'a karşı güçlü.", laneAdvantage: "Double Up.", watchOut: "Lucian E dash.", buildHint: "Kraken Slayer, Lord Dominik's Regards" },
    ],
    soloQueueCounters: [
      { champion: "Caitlyn", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da Lucian için en iyi counter.", laneAdvantage: "Menzil avantajı.", watchOut: "Lucian erken güçlü.", buildHint: "Kraken Slayer, Rapid Firecannon" },
      { champion: "Jinx", difficulty: "medium", tier: "A", reasonWhy: "Jinx outscales Lucian güçlü.", laneAdvantage: "Late game Jinx baskın.", watchOut: "Lucian erken öldürebilir.", buildHint: "Kraken Slayer, Runaan's Hurricane" },
    ],
    tips: ["Lucian E dash + Q pasif empowered attack combo.", "Lucian R kullanırken hareket etmez, CC ile interrupt.", "Lucian erken dominant ama geç oyun zayıflar."],
    patchNote: NOTE,
  },

  "Miss Fortune": {
    topCounters: [
      { champion: "Lucian", difficulty: "medium", tier: "S", reasonWhy: "E dodge MF'in R ult'unu keser, erken agresiflik güçlü.", laneAdvantage: "E dash in-out MF için sorun.", watchOut: "MF E movespeed Lucian'ı kovalayabilir.", buildHint: "Collector, Essence Reaver" },
      { champion: "Sivir", difficulty: "medium", tier: "A", reasonWhy: "E spell shield MF'in R ulti'sini bloklar.", laneAdvantage: "Her MF Q double up bloklanabilir.", watchOut: "MF poke hasar çok yüksek.", buildHint: "Kraken Slayer, Ravenous Hydra" },
      { champion: "Draven", difficulty: "medium", tier: "A", reasonWhy: "Axes hasar MF poke'undan daha fazla.", laneAdvantage: "Erken kill baskısı.", watchOut: "MF movespeed Draven kovalayabilir.", buildHint: "Collector, Infinity Edge" },
    ],
    easyCounters: [
      { champion: "Sivir", difficulty: "easy", tier: "A", reasonWhy: "MF için en kolay counter.", laneAdvantage: "E spell shield R'ı bloklar.", watchOut: "MF poke hasar yüksek.", buildHint: "Kraken Slayer, Ravenous Hydra" },
      { champion: "Lucian", difficulty: "easy", tier: "S", reasonWhy: "E dodge R'ı keser.", laneAdvantage: "Erken agresiflik.", watchOut: "MF movespeed.", buildHint: "Collector, Essence Reaver" },
    ],
    soloQueueCounters: [
      { champion: "Sivir", difficulty: "easy", tier: "A", reasonWhy: "Solo queue'da MF için en kolay counter.", laneAdvantage: "E MF R'ı bloklar.", watchOut: "MF poke.", buildHint: "Kraken Slayer, Ravenous Hydra" },
      { champion: "Lucian", difficulty: "medium", tier: "S", reasonWhy: "Erken dominans MF'i baskılar.", laneAdvantage: "Erken kill.", watchOut: "MF poke + R.", buildHint: "Collector, Essence Reaver" },
    ],
    tips: ["MF R kanal edilir, interrupt et.", "MF Love Tap aynı hedefe sıfırlanır, hareket et.", "MF movespeed pasifi aktif, stationary durmaz."],
    patchNote: NOTE,
  },

  "Samira": {
    topCounters: [
      { champion: "Caitlyn", difficulty: "medium", tier: "S", reasonWhy: "Uzun menzil Samira'nın kısa menzil W parry stilini geçersiz kılar.", laneAdvantage: "Headshot poke Samira için sorun.", watchOut: "Samira W her mermili şeyi parry eder.", buildHint: "Kraken Slayer, Rapid Firecannon" },
      { champion: "Draven", difficulty: "hard", tier: "A", reasonWhy: "Erken burst Samira'nın snowball sürecini engeller.", laneAdvantage: "Axes hasar Samira W'sinden önce gelir.", watchOut: "Samira W parry Draven axes'ini bloklar.", buildHint: "Collector, Infinity Edge" },
      { champion: "Miss Fortune", difficulty: "medium", tier: "A", reasonWhy: "Poke Samira için sorun.", laneAdvantage: "Double Up + movespeed.", watchOut: "Samira W parry MF Q'sunu bloklar.", buildHint: "Kraken Slayer, Serylda's Grudge" },
    ],
    easyCounters: [
      { champion: "Caitlyn", difficulty: "easy", tier: "S", reasonWhy: "Samira için en kolay counter.", laneAdvantage: "Menzil avantajı.", watchOut: "Samira W parry mermileri bloklar.", buildHint: "Kraken Slayer, Rapid Firecannon" },
      { champion: "Miss Fortune", difficulty: "easy", tier: "A", reasonWhy: "Poke Samira için sorun.", laneAdvantage: "Double Up.", watchOut: "Samira W parry.", buildHint: "Kraken Slayer, Lord Dominik's Regards" },
    ],
    soloQueueCounters: [
      { champion: "Draven", difficulty: "medium", tier: "A", reasonWhy: "Erken burst Samira için sorun.", laneAdvantage: "Erken kill.", watchOut: "Samira W parry.", buildHint: "Collector, Infinity Edge" },
      { champion: "Caitlyn", difficulty: "easy", tier: "S", reasonWhy: "Güvenli seçim.", laneAdvantage: "Menzil avantajı.", watchOut: "Samira R inferno trigger.", buildHint: "Kraken Slayer, Rapid Firecannon" },
    ],
    tips: ["Samira W parry projectile'ları bloklar, AA ile hasar ver.", "Samira R Inferno S stack gerektirir, öncesinde keser.", "Samira gap close çok güçlüdür, pozisyonu önemli."],
    patchNote: NOTE,
  },

  "Sivir": {
    topCounters: [
      { champion: "Draven", difficulty: "hard", tier: "S", reasonWhy: "Draven sürekli hasar Sivir'in E shield'ını tüketir.", laneAdvantage: "Axes hasar E shield'siz Sivir için tehlikelidir.", watchOut: "Sivir E spell shield CD'sini takip et.", buildHint: "Collector, Infinity Edge" },
      { champion: "Miss Fortune", difficulty: "medium", tier: "A", reasonWhy: "Sivir'in E'si MF Q double up'ı bloklar ama sustain yüksektir.", laneAdvantage: "Double Up + poke.", watchOut: "Sivir E shield CD 20 saniye.", buildHint: "Kraken Slayer, Serylda's Grudge" },
      { champion: "Caitlyn", difficulty: "medium", tier: "A", reasonWhy: "Menzil Sivir'in kısa menzil wave push'unu geçer.", laneAdvantage: "Headshot poke.", watchOut: "Sivir E Caitlyn Q'sunu bloklar.", buildHint: "Kraken Slayer, Rapid Firecannon" },
    ],
    easyCounters: [
      { champion: "Draven", difficulty: "medium", tier: "S", reasonWhy: "En etkili Sivir counter'ı.", laneAdvantage: "Sürekli hasar E'yi tüketir.", watchOut: "Sivir E blok timing.", buildHint: "Collector, Infinity Edge" },
      { champion: "Miss Fortune", difficulty: "easy", tier: "A", reasonWhy: "Poke güçlü.", laneAdvantage: "Double Up + E.", watchOut: "Sivir E Q'yu bloklar.", buildHint: "Kraken Slayer, Lord Dominik's Regards" },
    ],
    soloQueueCounters: [
      { champion: "Draven", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Sivir için en iyi counter.", laneAdvantage: "Sürekli hasar.", watchOut: "Sivir E timing kritik.", buildHint: "Collector, Infinity Edge" },
      { champion: "Lucian", difficulty: "medium", tier: "A", reasonWhy: "E dash Sivir için sorun.", laneAdvantage: "Erken agresiflik.", watchOut: "Sivir E blok.", buildHint: "Collector, Essence Reaver" },
    ],
    tips: ["Sivir E spell shield CD 20 saniye — E'yi boşa harcattıktan sonra all-in.", "Sivir W ricochet wave clear çok güçlüdür.", "Sivir R savaştan kaçmak için kullanır, engelle."],
    patchNote: NOTE,
  },

  "Smolder": {
    topCounters: [
      { champion: "Caitlyn", difficulty: "medium", tier: "S", reasonWhy: "Uzun menzil Smolder'ın erken farm sürecini zorlaştırır.", laneAdvantage: "Headshot poke Smolder'ı eritir.", watchOut: "Smolder E dash kaçış.", buildHint: "Kraken Slayer, Rapid Firecannon" },
      { champion: "Draven", difficulty: "hard", tier: "A", reasonWhy: "Erken burst Smolder'ın stack sürecini engeller.", laneAdvantage: "Axes hasar Smolder için sorun.", watchOut: "Smolder R tüm takımı etkiler.", buildHint: "Collector, Infinity Edge" },
      { champion: "Miss Fortune", difficulty: "medium", tier: "A", reasonWhy: "Poke Smolder'ın farm aşamasını zorlaştırır.", laneAdvantage: "Double Up + poke.", watchOut: "Smolder stack 225 büyük spike.", buildHint: "Kraken Slayer, Serylda's Grudge" },
    ],
    easyCounters: [
      { champion: "Caitlyn", difficulty: "easy", tier: "S", reasonWhy: "Smolder için en kolay counter.", laneAdvantage: "Menzil avantajı.", watchOut: "Smolder E dash.", buildHint: "Kraken Slayer, Rapid Firecannon" },
      { champion: "Miss Fortune", difficulty: "easy", tier: "A", reasonWhy: "Poke güçlü.", laneAdvantage: "Double Up.", watchOut: "Smolder R AoE.", buildHint: "Kraken Slayer, Serylda's Grudge" },
    ],
    soloQueueCounters: [
      { champion: "Draven", difficulty: "medium", tier: "A", reasonWhy: "Erken burst Smolder stack'ini durdurur.", laneAdvantage: "Erken kill.", watchOut: "Smolder R AoE.", buildHint: "Collector, Infinity Edge" },
      { champion: "Caitlyn", difficulty: "easy", tier: "S", reasonWhy: "Güvenli seçim.", laneAdvantage: "Menzil.", watchOut: "Smolder stack 225 büyük power spike.", buildHint: "Kraken Slayer, Rapid Firecannon" },
    ],
    tips: ["Smolder stack 225 büyük spike, öncesinde öldür.", "Smolder E dash kaçış mekanizması.", "Smolder R tüm alanı etkiler, dağılın."],
    patchNote: NOTE,
  },

  "Tristana": {
    topCounters: [
      { champion: "Caitlyn", difficulty: "medium", tier: "S", reasonWhy: "Erken menzil Tristana'nın kısa menzil reset döngüsünü zorlaştırır.", laneAdvantage: "Headshot + trap Tristana için sorun.", watchOut: "Tristana E bomb itme ani.", buildHint: "Kraken Slayer, Rapid Firecannon" },
      { champion: "Draven", difficulty: "hard", tier: "A", reasonWhy: "Erken burst Tristana için büyük sorun.", laneAdvantage: "Axes hasar Tristana'yı eriten.", watchOut: "Tristana W jump + E bomb combo.", buildHint: "Collector, Infinity Edge" },
      { champion: "Miss Fortune", difficulty: "medium", tier: "A", reasonWhy: "Poke Tristana'yı zorlar.", laneAdvantage: "Double Up + E slow.", watchOut: "Tristana W jump kaçış.", buildHint: "Kraken Slayer, Serylda's Grudge" },
    ],
    easyCounters: [
      { champion: "Caitlyn", difficulty: "easy", tier: "S", reasonWhy: "En kolay Tristana counter.", laneAdvantage: "Menzil avantajı.", watchOut: "Tristana W jump.", buildHint: "Kraken Slayer, Rapid Firecannon" },
      { champion: "Miss Fortune", difficulty: "easy", tier: "A", reasonWhy: "Poke.", laneAdvantage: "Double Up.", watchOut: "Tristana E bomb ani.", buildHint: "Kraken Slayer, Lord Dominik's Regards" },
    ],
    soloQueueCounters: [
      { champion: "Draven", difficulty: "medium", tier: "A", reasonWhy: "Erken burst.", laneAdvantage: "Erken kill.", watchOut: "Tristana W jump kaçış.", buildHint: "Collector, Infinity Edge" },
      { champion: "Caitlyn", difficulty: "easy", tier: "S", reasonWhy: "Güvenli.", laneAdvantage: "Menzil.", watchOut: "Tristana E bomb itme.", buildHint: "Kraken Slayer, Rapid Firecannon" },
    ],
    tips: ["Tristana E bomb biriken sıfırlamadan önce E'yi AL.", "Tristana W jump düşük HP'de kaçış.", "Tristana late game çok güçlü, erken önde ol."],
    patchNote: NOTE,
  },

  "Varus": {
    topCounters: [
      { champion: "Draven", difficulty: "hard", tier: "S", reasonWhy: "Draven erken baskı Varus'u rahat farm'dan keser.", laneAdvantage: "Axes dominant lane.", watchOut: "Varus R chain CC çok geniş.", buildHint: "Collector, Infinity Edge" },
      { champion: "Miss Fortune", difficulty: "medium", tier: "A", reasonWhy: "Poke Varus için sorun.", laneAdvantage: "Double Up.", watchOut: "Varus Q charge burst.", buildHint: "Kraken Slayer, Serylda's Grudge" },
      { champion: "Lucian", difficulty: "medium", tier: "A", reasonWhy: "Mobility Varus'un poke stilini geçer.", laneAdvantage: "E dash Varus Q'sundan kaçar.", watchOut: "Varus R chain CC ani.", buildHint: "Collector, Essence Reaver" },
    ],
    easyCounters: [
      { champion: "Miss Fortune", difficulty: "easy", tier: "A", reasonWhy: "En kolay Varus counter.", laneAdvantage: "Poke.", watchOut: "Varus R chain CC.", buildHint: "Kraken Slayer, Lord Dominik's Regards" },
      { champion: "Caitlyn", difficulty: "easy", tier: "A", reasonWhy: "Menzil avantajı.", laneAdvantage: "Headshot poke.", watchOut: "Varus Q charge yüksek hasar.", buildHint: "Kraken Slayer, Rapid Firecannon" },
    ],
    soloQueueCounters: [
      { champion: "Draven", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Varus için en iyi counter.", laneAdvantage: "Erken kill.", watchOut: "Varus R chain CC.", buildHint: "Collector, Kraken Slayer" },
      { champion: "Lucian", difficulty: "medium", tier: "A", reasonWhy: "Mobility.", laneAdvantage: "Erken agresiflik.", watchOut: "Varus R chain CC.", buildHint: "Collector, Essence Reaver" },
    ],
    tips: ["Varus Q charge'ı interrupt et, hasar azalır.", "Varus W blight stack 3'te hasar artar.", "Varus R chain CC warding ile pozisyon al."],
    patchNote: NOTE,
  },

  "Vayne": {
    topCounters: [
      { champion: "Draven", difficulty: "hard", tier: "S", reasonWhy: "Draven burst Vayne'in skale sürecinden önce öldürür.", laneAdvantage: "Axes hasar Vayne için sorun.", watchOut: "Vayne E duvar stun.", buildHint: "Collector, Infinity Edge" },
      { champion: "Caitlyn", difficulty: "medium", tier: "A", reasonWhy: "Menzil Vayne'in kısa menzil avantajını geçer.", laneAdvantage: "Headshot poke.", watchOut: "Vayne 2 item spike çok güçlü.", buildHint: "Kraken Slayer, Rapid Firecannon" },
      { champion: "Miss Fortune", difficulty: "medium", tier: "A", reasonWhy: "Erken poke Vayne'in farm sürecini zorlaştırır.", laneAdvantage: "Double Up + E slow.", watchOut: "Vayne E duvar stun + R invisible.", buildHint: "Kraken Slayer, Serylda's Grudge" },
    ],
    easyCounters: [
      { champion: "Miss Fortune", difficulty: "easy", tier: "A", reasonWhy: "En kolay Vayne counter.", laneAdvantage: "Erken poke.", watchOut: "Vayne E duvar.", buildHint: "Kraken Slayer, Lord Dominik's Regards" },
      { champion: "Caitlyn", difficulty: "easy", tier: "A", reasonWhy: "Menzil.", laneAdvantage: "Headshot.", watchOut: "Vayne 2 item sonrası.", buildHint: "Kraken Slayer, Rapid Firecannon" },
    ],
    soloQueueCounters: [
      { champion: "Draven", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Vayne için en iyi counter.", laneAdvantage: "Erken kill.", watchOut: "Vayne late game.", buildHint: "Collector, Infinity Edge" },
      { champion: "Caitlyn", difficulty: "easy", tier: "A", reasonWhy: "Güvenli.", laneAdvantage: "Menzil.", watchOut: "Vayne E duvar.", buildHint: "Kraken Slayer, Rapid Firecannon" },
    ],
    tips: ["Vayne E ile duvardan itmesi stun verir, duvardan uzak dur.", "Vayne R invisibility Q ile kaybolur.", "Vayne true damage 3 hit, kısa trade yap."],
    patchNote: NOTE,
  },

  "Xayah": {
    topCounters: [
      { champion: "Draven", difficulty: "hard", tier: "S", reasonWhy: "Draven erken burst Xayah'nın feather stacking'ini bozar.", laneAdvantage: "Axes hasar Xayah için sorun.", watchOut: "Xayah R invulnerable + feather tetik.", buildHint: "Collector, Infinity Edge" },
      { champion: "Caitlyn", difficulty: "medium", tier: "A", reasonWhy: "Menzil Xayah'nın feather yerleştirmesini zorlaştırır.", laneAdvantage: "Headshot poke.", watchOut: "Xayah W hız + feather kombonu.", buildHint: "Kraken Slayer, Rapid Firecannon" },
      { champion: "Miss Fortune", difficulty: "medium", tier: "A", reasonWhy: "Poke Xayah için sorun.", laneAdvantage: "Double Up.", watchOut: "Xayah R invulnerable MF R'ını iptal eder.", buildHint: "Kraken Slayer, Serylda's Grudge" },
    ],
    easyCounters: [
      { champion: "Miss Fortune", difficulty: "easy", tier: "A", reasonWhy: "En kolay Xayah counter.", laneAdvantage: "Poke.", watchOut: "Xayah R invulnerable.", buildHint: "Kraken Slayer, Lord Dominik's Regards" },
      { champion: "Caitlyn", difficulty: "easy", tier: "A", reasonWhy: "Menzil.", laneAdvantage: "Headshot.", watchOut: "Xayah feather root.", buildHint: "Kraken Slayer, Rapid Firecannon" },
    ],
    soloQueueCounters: [
      { champion: "Draven", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Xayah için en iyi counter.", laneAdvantage: "Erken kill.", watchOut: "Xayah R invulnerable.", buildHint: "Collector, Infinity Edge" },
      { champion: "Miss Fortune", difficulty: "easy", tier: "A", reasonWhy: "Güvenli.", laneAdvantage: "Poke + combo.", watchOut: "Xayah R MF R'ını iptal eder.", buildHint: "Kraken Slayer, Serylda's Grudge" },
    ],
    tips: ["Xayah R invulnerable MF R + Caitlyn headshot gibi şeyleri iptal eder.", "Xayah feather root kuyruğunu takip et.", "Xayah E tüm featherları geri çeker, gruba girme."],
    patchNote: NOTE,
  },

  "Ziggs": {
    topCounters: [
      { champion: "Draven", difficulty: "hard", tier: "S", reasonWhy: "Draven erken baskı Ziggs'in poke stilini bozar.", laneAdvantage: "Axes hasar Ziggs için sorun.", watchOut: "Ziggs Q bounce stun ani.", buildHint: "Collector, Infinity Edge" },
      { champion: "Caitlyn", difficulty: "medium", tier: "A", reasonWhy: "Menzil Ziggs'in poke'una eşit.", laneAdvantage: "Headshot + trap.", watchOut: "Ziggs Q stun.", buildHint: "Kraken Slayer, Rapid Firecannon" },
      { champion: "Miss Fortune", difficulty: "medium", tier: "A", reasonWhy: "Poke.", laneAdvantage: "Double Up.", watchOut: "Ziggs W mine instant kill.", buildHint: "Kraken Slayer, Serylda's Grudge" },
    ],
    easyCounters: [
      { champion: "Caitlyn", difficulty: "easy", tier: "A", reasonWhy: "Ziggs için en kolay counter.", laneAdvantage: "Menzil.", watchOut: "Ziggs W mine.", buildHint: "Kraken Slayer, Rapid Firecannon" },
      { champion: "Miss Fortune", difficulty: "easy", tier: "A", reasonWhy: "Poke.", laneAdvantage: "Double Up.", watchOut: "Ziggs Q stun.", buildHint: "Kraken Slayer, Lord Dominik's Regards" },
    ],
    soloQueueCounters: [
      { champion: "Draven", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Ziggs için en iyi counter.", laneAdvantage: "Erken kill.", watchOut: "Ziggs Q stun.", buildHint: "Collector, Infinity Edge" },
      { champion: "Caitlyn", difficulty: "easy", tier: "A", reasonWhy: "Güvenli.", laneAdvantage: "Menzil.", watchOut: "Ziggs W mine.", buildHint: "Kraken Slayer, Rapid Firecannon" },
    ],
    tips: ["Ziggs W mine koşarken patlayabilir, üzerinden atla.", "Ziggs Q üçüncü sekme en büyük hasar verir.", "Ziggs tower range'i R ile vurur, dikkatli ol."],
    patchNote: NOTE,
  },
};
