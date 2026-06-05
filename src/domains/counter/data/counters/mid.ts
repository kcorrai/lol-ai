import type { GeneralCounterResult } from "../../types/counter.types";

type RoleData = Omit<GeneralCounterResult, "champion" | "role" | "generatedAt">;

const NOTE = "Bu veriler manuel olarak girilmiştir. Patch güncellemelerini yansıtmayabilir.";

export const MID_COUNTERS: Record<string, RoleData> = {
  "Ahri": {
    topCounters: [
      { champion: "Zed", difficulty: "hard", tier: "S", reasonWhy: "Shadow mekanikleri Ahri'nin Charm'ından kaçmasını sağlar.", laneAdvantage: "Burst potansiyeli Ahri'nin düşük savunmasını cezalandırır.", watchOut: "Ahri'nin üç R şarjı varken geri çekil.", buildHint: "Serylda's Grudge, Serpent's Fang" },
      { champion: "Galio", difficulty: "medium", tier: "A", reasonWhy: "Büyü direnci pasifi Ahri'nin hasarını önemli ölçüde azaltır.", laneAdvantage: "W ve E Ahri'nin combo'sunu engeller.", watchOut: "Ahri haritada gözükmezken dikkatli ol.", buildHint: "Locket of the Iron Solari, Zhonya's Hourglass" },
      { champion: "Kassadin", difficulty: "medium", tier: "A", reasonWhy: "MR pasifi Ahri combo'sundan az etkilenir.", laneAdvantage: "Level 6 sonrası Ahri roamlarını takip eder.", watchOut: "Charm yemeden pozisyon al.", buildHint: "Rod of Ages, Zhonya's Hourglass" },
    ],
    easyCounters: [
      { champion: "Malzahar", difficulty: "easy", tier: "A", reasonWhy: "Wave push Ahri'yi tower'a mahkum eder ve roamlarını engeller.", laneAdvantage: "E + ult combo Ahri'nin kaçış seçeneklerini sıfırlar.", watchOut: "E aktifken menzil dışına çıkmasına izin verme.", buildHint: "Shadowflame, Void Staff" },
      { champion: "Lux", difficulty: "easy", tier: "B", reasonWhy: "Uzun menzilli poke ile Ahri'yi sürekli baskı altında tutar.", laneAdvantage: "Güvenli poke ve wave kontrolü.", watchOut: "Ahri R mobilite avantajını hesaba kat.", buildHint: "Luden's Tempest, Shadowflame" },
    ],
    soloQueueCounters: [
      { champion: "Veigar", difficulty: "medium", tier: "A", reasonWhy: "Event Horizon Ahri'nin tüm mobilite seçeneklerini iptal eder.", laneAdvantage: "R'ı kullandıktan sonra cage koyarsan Ahri anında ölür.", watchOut: "Level 6 öncesi agresif Ahri all-in'lerinden kaçın.", buildHint: "Luden's Tempest, Shadowflame" },
      { champion: "Sylas", difficulty: "medium", tier: "A", reasonWhy: "Ahri'nin Ultimate'ını çalarak kill baskısı kurar.", laneAdvantage: "Ahri ult kullandıktan sonra agresif ol.", watchOut: "Ahri sağ ult'larıyla Sylas'tan kaçabilir.", buildHint: "Trinity Force, Rabadon's Deathcap" },
    ],
    tips: ["Ahri'nin üç R şarjını takip et — hepsi bitmişken agresif ol.", "Charm yemekten kaçınmak için minyon arkasında dur.", "Ahri yan koridora roam yapmadan önce ward koy ve takımını uyar."],
    patchNote: NOTE,
  },

  "Akali": {
    topCounters: [
      { champion: "Zed", difficulty: "hard", tier: "S", reasonWhy: "Zed'in mobility Akali'nin shroud gizlilik avantajına karşı koyar.", laneAdvantage: "Shadow ile Akali shroud içinde bile yakalanır.", watchOut: "Akali R erken kullanımı kaçış için saklar.", buildHint: "Serylda's Grudge, Edge of Night" },
      { champion: "Galio", difficulty: "easy", tier: "A", reasonWhy: "MR pasifi ve CC chain Akali'nin all-in combo'sunu durdurur.", laneAdvantage: "Taunt Akali'nin shroud içinde bile çalışır.", watchOut: "Akali R2 burst ani gelir.", buildHint: "Abyssal Mask, Gargoyle Stoneplate" },
      { champion: "Lissandra", difficulty: "medium", tier: "A", reasonWhy: "Self ult veya Akali'ye ult Akali'nin burst window'unu kapatır.", laneAdvantage: "E slide + CC chain Akali'yi durdurur.", watchOut: "Akali R1 shroud öncesi combo bekle.", buildHint: "Rod of Ages, Zhonya's Hourglass" },
    ],
    easyCounters: [
      { champion: "Malzahar", difficulty: "easy", tier: "A", reasonWhy: "R ult Akali'yi kilitler, Zhonya ile burst'ten kurtulunur.", laneAdvantage: "Wave push Akali'yi tower'a zorlar.", watchOut: "Akali shroud Malzahar'ın ult menzilini zorlaştırır.", buildHint: "Shadowflame, Zhonya's Hourglass" },
      { champion: "Galio", difficulty: "easy", tier: "A", reasonWhy: "MR ve CC Akali için büyük sorun.", laneAdvantage: "Taunt shroud içinde bile çalışır.", watchOut: "Akali burst çok hızlıdır.", buildHint: "Abyssal Mask, Gargoyle Stoneplate" },
    ],
    soloQueueCounters: [
      { champion: "Malzahar", difficulty: "easy", tier: "A", reasonWhy: "Solo queue'da Akali için en kolay counter.", laneAdvantage: "Cage + ult + Zhonya kombinasyonu.", watchOut: "Akali shroud Malzahar E'sini zorlaştırır.", buildHint: "Luden's Tempest, Zhonya's Hourglass" },
      { champion: "Lissandra", difficulty: "medium", tier: "A", reasonWhy: "Self ult Akali burst'ünü tamamen sıfırlar.", laneAdvantage: "CC chain Akali'yi durdurur.", watchOut: "Akali R2 hızlıdır, ult zamanlaması kritik.", buildHint: "Rod of Ages, Zhonya's Hourglass" },
    ],
    tips: ["Akali shroud içindeyken agresif olma, görünür değildir.", "Akali Q hareket ettikten sonra passive mark oluşur, hareket et.", "Akali R1 shroud saklamak için R2 burst için bekler."],
    patchNote: NOTE,
  },

  "Annie": {
    topCounters: [
      { champion: "Zed", difficulty: "medium", tier: "S", reasonWhy: "Shadow mekanikleri Annie'nin stun combo'sundan kaçar.", laneAdvantage: "Zed burst Annie'yi one-shot eder.", watchOut: "Annie flash W stun sürpriz yapar.", buildHint: "Serylda's Grudge, Edge of Night" },
      { champion: "Ahri", difficulty: "medium", tier: "A", reasonWhy: "Mobility Annie'nin kısa menzil baskısını atlatır.", laneAdvantage: "Charm Annie'yi stun hazırken de durdurur.", watchOut: "Annie stun + Tibbers ani burst.", buildHint: "Luden's Tempest, Shadowflame" },
      { champion: "LeBlanc", difficulty: "medium", tier: "A", reasonWhy: "Dash LeBlanc Annie'nin stun menzilini atlatır.", laneAdvantage: "Burst Annie'yi quick kill eder.", watchOut: "Annie Tibbers fear alanı geniştir.", buildHint: "Luden's Tempest, Shadowflame" },
    ],
    easyCounters: [
      { champion: "Ahri", difficulty: "easy", tier: "A", reasonWhy: "Mobility Annie'ye karşı güvenli oynamayı sağlar.", laneAdvantage: "Charm Annie stun hazırken yakalanır.", watchOut: "Annie stun kombosu her zaman var.", buildHint: "Luden's Tempest, Rabadon's Deathcap" },
      { champion: "Lissandra", difficulty: "easy", tier: "A", reasonWhy: "Self ult Annie Tibbers burst'ünü sıfırlar.", laneAdvantage: "E slide Annie'nin stun menzilinden kaçar.", watchOut: "Annie stun sürprizi çok tehlikelidir.", buildHint: "Rod of Ages, Zhonya's Hourglass" },
    ],
    soloQueueCounters: [
      { champion: "Zed", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Annie'yi en iyi durdurur.", laneAdvantage: "Burst Annie'yi öldürür.", watchOut: "Annie Tibbers burst çok hızlı.", buildHint: "Serylda's Grudge, Shadowflame" },
      { champion: "Ahri", difficulty: "easy", tier: "A", reasonWhy: "Mobility Annie'ye karşı en güvenli seçimdir.", laneAdvantage: "Roam gücü Annie'nin baskısına karşı.", watchOut: "Annie stun stack'ini her zaman say.", buildHint: "Luden's Tempest, Rabadon's Deathcap" },
    ],
    tips: ["Annie stun stack'ini say — 4 stack sonraki ability stun atar.", "Annie passive stun CD yoktur, her Q bir stack verir.", "Annie Tibbers aktifken korku alanı güçlüdür, uzak dur."],
    patchNote: NOTE,
  },

  "Aurelion Sol": {
    topCounters: [
      { champion: "Zed", difficulty: "medium", tier: "S", reasonWhy: "All-in dive Aurelion Sol'un uzak mesafe oyununu bozar.", laneAdvantage: "Shadow Zed'i AuSol yakın mesafeye getirir.", watchOut: "AuSol Q stun uzak mesafede tehlikelidir.", buildHint: "Serylda's Grudge, Edge of Night" },
      { champion: "LeBlanc", difficulty: "medium", tier: "A", reasonWhy: "Burst LeBlanc AuSol'u hızlı öldürür.", laneAdvantage: "Chain CC AuSol'u bir yerde kilitler.", watchOut: "AuSol late game çok güçlü olur.", buildHint: "Luden's Tempest, Shadowflame" },
      { champion: "Katarina", difficulty: "medium", tier: "A", reasonWhy: "Mobility AuSol'un poke stilini geçersiz kılar.", laneAdvantage: "Reset combo AuSol'u overwhelm eder.", watchOut: "AuSol Q stun burst öncesi gelir.", buildHint: "Night Harvester, Rabadon's Deathcap" },
    ],
    easyCounters: [
      { champion: "Zed", difficulty: "easy", tier: "S", reasonWhy: "AuSol için en kolay counter.", laneAdvantage: "Burst AuSol'u öldürür.", watchOut: "AuSol Q stun uzaktan tehlikeli.", buildHint: "Serylda's Grudge, Edge of Night" },
      { champion: "Katarina", difficulty: "easy", tier: "A", reasonWhy: "Mobility ve reset AuSol'a karşı güçlü.", laneAdvantage: "Reset combo AuSol için kabus.", watchOut: "AuSol stun her zaman var.", buildHint: "Night Harvester, Shadowflame" },
    ],
    soloQueueCounters: [
      { champion: "Zed", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da AuSol'u en etkili durdurur.", laneAdvantage: "Burst AuSol'u öldürür.", watchOut: "AuSol late game snowball çok tehlikeli.", buildHint: "Serylda's Grudge, Shadowflame" },
      { champion: "LeBlanc", difficulty: "medium", tier: "A", reasonWhy: "Burst + chain CC AuSol için zor.", laneAdvantage: "Erken kill baskısı.", watchOut: "AuSol late game kaçınılmazdır.", buildHint: "Luden's Tempest, Rabadon's Deathcap" },
    ],
    tips: ["AuSol Q stun menzili çok uzundur, minyon arkasında dur.", "AuSol stacking çok güçlüdür, erken öldür.", "AuSol slow zone R aktifken uzak dur."],
    patchNote: NOTE,
  },

  "Cassiopeia": {
    topCounters: [
      { champion: "Zed", difficulty: "medium", tier: "S", reasonWhy: "Shadow dash Cassiopeia'nın Q poison'ından kaçar.", laneAdvantage: "Burst Cassiopeia'yı hızlı öldürür.", watchOut: "Cassiopeia R ult petrification Zed'i durdurur.", buildHint: "Serylda's Grudge, Edge of Night" },
      { champion: "LeBlanc", difficulty: "medium", tier: "A", reasonWhy: "Mobility Cassiopeia'nın DoT stilini bozar.", laneAdvantage: "Chain CC Cassiopeia'yı kilitler.", watchOut: "Cassiopeia E twitch hızlı.", buildHint: "Luden's Tempest, Shadowflame" },
      { champion: "Talon", difficulty: "medium", tier: "A", reasonWhy: "Mobility + burst Cassiopeia'yı hızlı öldürür.", laneAdvantage: "Dash combo Cassiopeia'yı yakalar.", watchOut: "Cassiopeia R ult flash combo tehlikeli.", buildHint: "Duskblade, Edge of Night" },
    ],
    easyCounters: [
      { champion: "Zed", difficulty: "easy", tier: "S", reasonWhy: "En etkili Cassiopeia counter'ı.", laneAdvantage: "Burst öldürür.", watchOut: "Cassiopeia R Zed'i dondurur.", buildHint: "Serylda's Grudge, Edge of Night" },
      { champion: "LeBlanc", difficulty: "easy", tier: "A", reasonWhy: "Dash Cassiopeia'nın poke'undan kaçar.", laneAdvantage: "Chain CC etkili.", watchOut: "Cassiopeia E spam çok hasar verir.", buildHint: "Luden's Tempest, Shadowflame" },
    ],
    soloQueueCounters: [
      { champion: "Zed", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Cassiopeia'yı en iyi durdurur.", laneAdvantage: "Burst hedef.", watchOut: "Cassiopeia R petrification.", buildHint: "Serylda's Grudge, Shadowflame" },
      { champion: "Talon", difficulty: "medium", tier: "A", reasonWhy: "Burst combo Cassiopeia'yı overwhelm eder.", laneAdvantage: "Mobility ve roam güçlü.", watchOut: "Cassiopeia R + Q zone kontrol.", buildHint: "Duskblade, Edge of Night" },
    ],
    tips: ["Cassiopeia R bakış yönüne göre çalışır, yan dönerek geç.", "Cassiopeia poisoned düşmana E twin fang kullanır.", "Cassiopeia mobility yoktur, gap close şampiyon seç."],
    patchNote: NOTE,
  },

  "Corki": {
    topCounters: [
      { champion: "Zed", difficulty: "medium", tier: "S", reasonWhy: "All-in dive Corki'nin safe poke stilini bozar.", laneAdvantage: "Shadow Corki'yi baskı altına alır.", watchOut: "Corki W dash kaçış sağlar.", buildHint: "Serylda's Grudge, Edge of Night" },
      { champion: "LeBlanc", difficulty: "medium", tier: "A", reasonWhy: "Burst LeBlanc Corki'yi hızlı öldürür.", laneAdvantage: "Chain CC Corki'yi kilitler.", watchOut: "Corki R rockets uzak mesafede.", buildHint: "Luden's Tempest, Shadowflame" },
      { champion: "Akali", difficulty: "medium", tier: "A", reasonWhy: "Dive + burst Corki'nin poke stilini geçersiz kılar.", laneAdvantage: "Shroud Corki'nin görüşünü kısıtlar.", watchOut: "Corki W emergency kaçış.", buildHint: "Night Harvester, Shadowflame" },
    ],
    easyCounters: [
      { champion: "Zed", difficulty: "easy", tier: "S", reasonWhy: "Corki için en kolay counter.", laneAdvantage: "Burst Corki'yi öldürür.", watchOut: "Corki W emergency dash.", buildHint: "Serylda's Grudge, Edge of Night" },
      { champion: "Fizz", difficulty: "easy", tier: "A", reasonWhy: "E dodge Corki'nin poke'undan kaçar.", laneAdvantage: "All-in baskısı güçlü.", watchOut: "Corki R rockets uzak menzili.", buildHint: "Lich Bane, Shadowflame" },
    ],
    soloQueueCounters: [
      { champion: "Zed", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Corki için en iyi counter.", laneAdvantage: "Burst hedef.", watchOut: "Corki The Package engage belirleyicidir.", buildHint: "Serylda's Grudge, Shadowflame" },
      { champion: "LeBlanc", difficulty: "medium", tier: "A", reasonWhy: "Chain CC Corki için sorun.", laneAdvantage: "Erken kill baskısı.", watchOut: "Corki W dash sürpriz.", buildHint: "Luden's Tempest, Rabadon's Deathcap" },
    ],
    tips: ["Corki The Package kullandığında uzak dur, AoE hasar büyük.", "Corki rockets hasar türü karma (AD+magic).", "Corki W dash tek kaçış mekanizması, dikkatli kullan."],
    patchNote: NOTE,
  },

  "Fizz": {
    topCounters: [
      { champion: "Zed", difficulty: "medium", tier: "A", reasonWhy: "Zed erken Level 3 baskısı Fizz'i zorlar.", laneAdvantage: "Shadow dash Fizz'in E dodge'undan önce gelebilir.", watchOut: "Fizz E pole stick her darbeyi geçersiz kılar.", buildHint: "Serylda's Grudge, Serpent's Fang" },
      { champion: "Ahri", difficulty: "medium", tier: "A", reasonWhy: "Charm Fizz'i yakalamak için en etkili CC'dir.", laneAdvantage: "Charm + burst Fizz'i öldürür.", watchOut: "Fizz E pole tüm darbelerden kaçınır.", buildHint: "Luden's Tempest, Rabadon's Deathcap" },
      { champion: "Lissandra", difficulty: "medium", tier: "S", reasonWhy: "CC chain Fizz'in all-in combo'sunu durdurur.", laneAdvantage: "Self ult Fizz burst'ünü sıfırlar.", watchOut: "Fizz shark R geniş alanda çarpar.", buildHint: "Rod of Ages, Zhonya's Hourglass" },
    ],
    easyCounters: [
      { champion: "Ahri", difficulty: "easy", tier: "A", reasonWhy: "Charm Fizz'i yakalamak için en etkili yöntemdir.", laneAdvantage: "Poke + mobility güvenli.", watchOut: "Fizz E her darbeyi iptal eder.", buildHint: "Luden's Tempest, Rabadon's Deathcap" },
      { champion: "Syndra", difficulty: "easy", tier: "A", reasonWhy: "Poke + stun Fizz'i güvenli öldürür.", laneAdvantage: "Q poke Fizz'i sürekli zorlar.", watchOut: "Fizz E dodge Syndra stun'ını iptal eder.", buildHint: "Luden's Tempest, Shadowflame" },
    ],
    soloQueueCounters: [
      { champion: "Lissandra", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Fizz'i en iyi counter'layan şampiyon.", laneAdvantage: "CC chain + self ult Fizz burst'ünü sıfırlar.", watchOut: "Fizz R shark geniş alanda.", buildHint: "Rod of Ages, Zhonya's Hourglass" },
      { champion: "Ahri", difficulty: "easy", tier: "A", reasonWhy: "Mobility + charm Fizz için sorun.", laneAdvantage: "Güvenli poke imkânı.", watchOut: "Fizz E aktifken hasar verme.", buildHint: "Luden's Tempest, Rabadon's Deathcap" },
    ],
    tips: ["Fizz E aktifken hiçbir hasar çarpmaz — bu 0.75 sn sürer.", "Fizz R shark yönlendirilir, yana koş.", "Fizz erken seviyede zayıf, Level 6 öncesinde baskıla."],
    patchNote: NOTE,
  },

  "Galio": {
    topCounters: [
      { champion: "Zed", difficulty: "medium", tier: "A", reasonWhy: "AD physical damage Galio'nun MR pasifini bypass eder.", laneAdvantage: "Shadow + burst Galio için sorun.", watchOut: "Galio W taunt tehlikelidir.", buildHint: "Serylda's Grudge, Last Whisper" },
      { champion: "Fizz", difficulty: "medium", tier: "A", reasonWhy: "AP burst Galio'nun MR stack'ini geçebilir.", laneAdvantage: "E dodge Galio taunt'undan kaçar.", watchOut: "Galio R global engage.", buildHint: "Lich Bane, Shadowflame" },
      { champion: "Viktor", difficulty: "medium", tier: "A", reasonWhy: "Sürekli poke Viktor Galio'yu etkisiz kılar.", laneAdvantage: "Lazor + E zone Galio'yu zorlar.", watchOut: "Galio R global team fight belirleyici.", buildHint: "Luden's Tempest, Rabadon's Deathcap" },
    ],
    easyCounters: [
      { champion: "Zed", difficulty: "easy", tier: "A", reasonWhy: "AD damage Galio MR'ını bypass eder.", laneAdvantage: "Burst güçlü.", watchOut: "Galio W taunt ani.", buildHint: "Serylda's Grudge, Serpent's Fang" },
      { champion: "Fizz", difficulty: "easy", tier: "A", reasonWhy: "E dodge Galio CC'sinden kaçar.", laneAdvantage: "All-in baskısı.", watchOut: "Galio R global tehlike.", buildHint: "Lich Bane, Shadowflame" },
    ],
    soloQueueCounters: [
      { champion: "Zed", difficulty: "medium", tier: "A", reasonWhy: "Solo queue'da Galio için en iyi counter.", laneAdvantage: "AD bypass.", watchOut: "Galio R global presence.", buildHint: "Serylda's Grudge, Shadowflame" },
      { champion: "Viktor", difficulty: "medium", tier: "A", reasonWhy: "Poke Galio'yu zorlar.", laneAdvantage: "Sürekli hasar.", watchOut: "Galio W taunt lane'de.", buildHint: "Luden's Tempest, Rabadon's Deathcap" },
    ],
    tips: ["Galio W taunt aktifken hasar vurma.", "Galio R castı çok uzun, interrupt et.", "Galio MR build ile AP hasar azalır, AD seç."],
    patchNote: NOTE,
  },

  "Kassadin": {
    topCounters: [
      { champion: "LeBlanc", difficulty: "hard", tier: "S", reasonWhy: "LeBlanc erken hasarı Kassadin'in zayıf pre-6 dönemini cezalandırır.", laneAdvantage: "Chain CC Kassadin'i erken defalarca öldürür.", watchOut: "Kassadin Level 16 çok güçlüdür.", buildHint: "Luden's Tempest, Shadowflame" },
      { champion: "Vex", difficulty: "medium", tier: "A", reasonWhy: "Fear Kassadin'in R riftwalk'ını tetikleyince devreye girer.", laneAdvantage: "Poke + fear Kassadin için zor.", watchOut: "Kassadin R'ı birden çok kez kullanabilir.", buildHint: "Luden's Tempest, Shadowflame" },
      { champion: "Zoe", difficulty: "hard", tier: "A", reasonWhy: "Paddle Star poke Kassadin'in farm sürecini zorlaştırır.", laneAdvantage: "Uyku + büyük hasar Kassadin erken için kabus.", watchOut: "Kassadin Level 6 sonrası atlatabilir.", buildHint: "Luden's Tempest, Shadowflame" },
    ],
    easyCounters: [
      { champion: "LeBlanc", difficulty: "medium", tier: "S", reasonWhy: "Kassadin için en kolay ve en etkili counter.", laneAdvantage: "Erken kill baskısı.", watchOut: "Kassadin Level 16 unstoppable.", buildHint: "Luden's Tempest, Rabadon's Deathcap" },
      { champion: "Vex", difficulty: "easy", tier: "A", reasonWhy: "Fear Kassadin dash'ini keser.", laneAdvantage: "Poke güvenli.", watchOut: "Kassadin R her yere gider.", buildHint: "Luden's Tempest, Shadowflame" },
    ],
    soloQueueCounters: [
      { champion: "LeBlanc", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Kassadin için en iyi counter.", laneAdvantage: "Erken dominans.", watchOut: "Kassadin late game durdurulmaz.", buildHint: "Luden's Tempest, Rabadon's Deathcap" },
      { champion: "Zoe", difficulty: "medium", tier: "A", reasonWhy: "Poke Kassadin'in erken zayıf dönemini sömürür.", laneAdvantage: "Uyku + burst güçlü.", watchOut: "Kassadin Level 6 escape.", buildHint: "Luden's Tempest, Shadowflame" },
    ],
    tips: ["Kassadin Level 1-5 çok zayıf, bu dönemi maksimize et.", "Kassadin R her kullanımda %130 mana artar, erken fight yap.", "Kassadin Level 16 triple rift + hex durdurulmaz olur."],
    patchNote: NOTE,
  },

  "Katarina": {
    topCounters: [
      { champion: "Kassadin", difficulty: "medium", tier: "A", reasonWhy: "MR pasifi Katarina'nın büyü hasarını azaltır.", laneAdvantage: "Level 6 sonrası Kassadin Katarina'yı baskılar.", watchOut: "Katarina erken seviyede Kassadin'e baskı kurar.", buildHint: "Rod of Ages, Zhonya's Hourglass" },
      { champion: "Diana", difficulty: "medium", tier: "A", reasonWhy: "Pull + ult combo Katarina'nın reset döngüsünü kırar.", laneAdvantage: "All-in baskısı Katarina'yı overwhelm eder.", watchOut: "Katarina reset yapmaya başlamadan CC'yi zamanla.", buildHint: "Zhonya's Hourglass, Rabadon's Deathcap" },
      { champion: "Leona", difficulty: "easy", tier: "S", reasonWhy: "CC zinciri Katarina'nın tüm dash seçeneklerini durdurur.", laneAdvantage: "W shield + CC Katarina combo'sunu keser.", watchOut: "Katarina bıçak atarak dagger üzerine E kullanabilir.", buildHint: "Locket of the Iron Solari, Thornmail" },
    ],
    easyCounters: [
      { champion: "Malzahar", difficulty: "easy", tier: "A", reasonWhy: "Cage + ult combo Katarina'yı kilitler.", laneAdvantage: "Wave push Katarina'yı tower'a zorlar.", watchOut: "Katarina E cage'den kaçabilir.", buildHint: "Zhonya's Hourglass, Shadowflame" },
      { champion: "Galio", difficulty: "easy", tier: "A", reasonWhy: "W taunt Katarina reset'ini durdurur.", laneAdvantage: "Taunt timing Katarina R'ını keser.", watchOut: "Katarina dagger reset hızı çok yüksek.", buildHint: "Abyssal Mask, Gargoyle Stoneplate" },
    ],
    soloQueueCounters: [
      { champion: "Malzahar", difficulty: "easy", tier: "A", reasonWhy: "Solo queue'da Katarina'nın en kolay counter'ı.", laneAdvantage: "Cage + ult + Zhonya kombinasyonu.", watchOut: "Katarina E ile cage'den çıkabilir.", buildHint: "Luden's Tempest, Zhonya's Hourglass" },
      { champion: "Diana", difficulty: "medium", tier: "A", reasonWhy: "Engage gücü ve reset kesme güçlü.", laneAdvantage: "All-in Katarina'yı ezer.", watchOut: "Katarina erken seviyede Diana'ya baskı kurar.", buildHint: "Riftmaker, Zhonya's Hourglass" },
    ],
    tips: ["Katarina'nın dagger'larını pickup yapmasını engelle.", "CC zincirini R başlamadan önce kullan.", "Katarina itemsiz ilk 15 dakika zayıftır."],
    patchNote: NOTE,
  },

  "LeBlanc": {
    topCounters: [
      { champion: "Zed", difficulty: "hard", tier: "A", reasonWhy: "AD damage LeBlanc'ın MR stack'ini bypass eder.", laneAdvantage: "Shadow burst LeBlanc'ı yakalar.", watchOut: "LeBlanc W dash chain CC bozar.", buildHint: "Serylda's Grudge, Edge of Night" },
      { champion: "Lissandra", difficulty: "medium", tier: "A", reasonWhy: "CC chain LeBlanc'ın mobility avantajını kısıtlar.", laneAdvantage: "Self ult LeBlanc burst'ünü sıfırlar.", watchOut: "LeBlanc W dash çok hızlıdır.", buildHint: "Rod of Ages, Zhonya's Hourglass" },
      { champion: "Malzahar", difficulty: "medium", tier: "S", reasonWhy: "Malzahar R LeBlanc'ı kilitler, Zhonya ile survive.", laneAdvantage: "Wave push LeBlanc'ın roam baskısını engeller.", watchOut: "LeBlanc W dash Malzahar E'sini atlatır.", buildHint: "Shadowflame, Zhonya's Hourglass" },
    ],
    easyCounters: [
      { champion: "Malzahar", difficulty: "easy", tier: "S", reasonWhy: "LeBlanc için en kolay counter.", laneAdvantage: "Cage + ult LeBlanc'ı kilitler.", watchOut: "LeBlanc W dash hızlıdır.", buildHint: "Luden's Tempest, Zhonya's Hourglass" },
      { champion: "Vex", difficulty: "easy", tier: "A", reasonWhy: "Fear LeBlanc dash'ini cezalandırır.", laneAdvantage: "Poke güvenli.", watchOut: "LeBlanc chain CC bozar.", buildHint: "Luden's Tempest, Shadowflame" },
    ],
    soloQueueCounters: [
      { champion: "Malzahar", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da LeBlanc için en iyi counter.", laneAdvantage: "Cage + ult kombonu.", watchOut: "LeBlanc roam baskısı güçlüdür.", buildHint: "Luden's Tempest, Zhonya's Hourglass" },
      { champion: "Lissandra", difficulty: "medium", tier: "A", reasonWhy: "CC chain LeBlanc mobility'sini kısıtlar.", laneAdvantage: "Self ult burst'ü sıfırlar.", watchOut: "LeBlanc erken burst çok tehlikelidir.", buildHint: "Rod of Ages, Zhonya's Hourglass" },
    ],
    tips: ["LeBlanc W'nin dönüş noktasına dikkat et.", "LeBlanc R her ability'sini kopyalar, farklı combo'lar kullanır.", "LeBlanc chain CC bozar, tek CC yetersizdir."],
    patchNote: NOTE,
  },

  "Lissandra": {
    topCounters: [
      { champion: "Zed", difficulty: "medium", tier: "A", reasonWhy: "AD damage Lissandra'nın MR stack'ini bypass eder.", laneAdvantage: "Shadow + burst Lissandra'yı hızlı öldürür.", watchOut: "Lissandra E glide + CC chain ani.", buildHint: "Serylda's Grudge, Edge of Night" },
      { champion: "Fizz", difficulty: "medium", tier: "A", reasonWhy: "E dodge Lissandra CC'sinden kaçar.", laneAdvantage: "All-in baskısı Lissandra için sorun.", watchOut: "Lissandra self ult Fizz burst'ünü sıfırlar.", buildHint: "Lich Bane, Shadowflame" },
      { champion: "LeBlanc", difficulty: "hard", tier: "A", reasonWhy: "Mobility Lissandra'nın CC menzilini atlatır.", laneAdvantage: "Burst LeBlanc Lissandra'yı hızlı öldürür.", watchOut: "Lissandra self ult LeBlanc burst'ünü iptal eder.", buildHint: "Luden's Tempest, Rabadon's Deathcap" },
    ],
    easyCounters: [
      { champion: "Zed", difficulty: "easy", tier: "A", reasonWhy: "AD bypass en kolay counter.", laneAdvantage: "Burst Lissandra'yı öldürür.", watchOut: "Lissandra self ult Zed combo'sunu iptal eder.", buildHint: "Serylda's Grudge, Edge of Night" },
      { champion: "Fizz", difficulty: "easy", tier: "A", reasonWhy: "E dodge Lissandra için sorun.", laneAdvantage: "All-in Lissandra'yı geçer.", watchOut: "Lissandra CC chain.", buildHint: "Lich Bane, Shadowflame" },
    ],
    soloQueueCounters: [
      { champion: "Zed", difficulty: "medium", tier: "A", reasonWhy: "Solo queue'da Lissandra için en iyi counter.", laneAdvantage: "Burst güçlü.", watchOut: "Lissandra self ult Zed combo'sunu iptal eder.", buildHint: "Serylda's Grudge, Shadowflame" },
      { champion: "LeBlanc", difficulty: "medium", tier: "A", reasonWhy: "Mobility Lissandra CC'sini aşar.", laneAdvantage: "Burst erken kill.", watchOut: "Lissandra self ult LeBlanc'ı durdurur.", buildHint: "Luden's Tempest, Rabadon's Deathcap" },
    ],
    tips: ["Lissandra self ult aktifken hasar verme.", "Lissandra E glide path'ini tahmin et.", "Lissandra CC chain çok uzundur, tek target CC yeterli değil."],
    patchNote: NOTE,
  },

  "Lux": {
    topCounters: [
      { champion: "Zed", difficulty: "medium", tier: "S", reasonWhy: "All-in Zed Lux'ın güvenli poke stilini bozar.", laneAdvantage: "Shadow combo Lux'ı anında öldürür.", watchOut: "Lux Q snare + R ani burst.", buildHint: "Serylda's Grudge, Edge of Night" },
      { champion: "Fizz", difficulty: "medium", tier: "A", reasonWhy: "E dodge Lux snare + lazor'dan kaçar.", laneAdvantage: "All-in baskısı Lux'ı zorlnur.", watchOut: "Lux R uzun menzilli burst.", buildHint: "Lich Bane, Shadowflame" },
      { champion: "Akali", difficulty: "medium", tier: "A", reasonWhy: "Shroud Lux'ın Q + R menzilinden gizler.", laneAdvantage: "All-in Lux için sorun.", watchOut: "Lux R geniş hasar verir.", buildHint: "Night Harvester, Shadowflame" },
    ],
    easyCounters: [
      { champion: "Zed", difficulty: "easy", tier: "S", reasonWhy: "Lux için en kolay counter.", laneAdvantage: "Shadow burst öldürür.", watchOut: "Lux Q snare + R kombonu.", buildHint: "Serylda's Grudge, Shadowflame" },
      { champion: "Akali", difficulty: "easy", tier: "A", reasonWhy: "Shroud + dash Lux CC'sinden kaçar.", laneAdvantage: "Dive güçlü.", watchOut: "Lux R uzak menzil.", buildHint: "Night Harvester, Shadowflame" },
    ],
    soloQueueCounters: [
      { champion: "Zed", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Lux için en iyi counter.", laneAdvantage: "Burst güçlü.", watchOut: "Lux R global menzil.", buildHint: "Serylda's Grudge, Edge of Night" },
      { champion: "Fizz", difficulty: "medium", tier: "A", reasonWhy: "E dodge Lux kit'ini geçersiz kılar.", laneAdvantage: "All-in baskısı.", watchOut: "Lux Q snare bekle.", buildHint: "Lich Bane, Shadowflame" },
    ],
    tips: ["Lux Q çift kişi snare'i olabilir, minyon arkasında dur.", "Lux R CDR ile çok sık gelir, pasif illuminate'ı izle.", "Lux immobile'dir, gap close şampiyon seç."],
    patchNote: NOTE,
  },

  "Malzahar": {
    topCounters: [
      { champion: "Fizz", difficulty: "medium", tier: "S", reasonWhy: "E dodge Malzahar'ın ult + cage combo'sundan kaçar.", laneAdvantage: "All-in Malzahar'ı overwhelm eder.", watchOut: "Malzahar R Fizz'i kilitler, E'yi önceden kullan.", buildHint: "Lich Bane, Shadowflame" },
      { champion: "Zed", difficulty: "medium", tier: "A", reasonWhy: "Shadow Malzahar ult'unu Zhonya'sız geçersiz kılar.", laneAdvantage: "Burst Malzahar'ı hızlı öldürür.", watchOut: "Malzahar R Zed'i kilitler, Zhonya olmadan öldürücü.", buildHint: "Serylda's Grudge, Edge of Night" },
      { champion: "Kassadin", difficulty: "medium", tier: "A", reasonWhy: "MR pasifi Malzahar'ın hasarını azaltır.", laneAdvantage: "R ile Malzahar cage'ini atlayabilir.", watchOut: "Malzahar R Level 6'dan önce zayıf dönemde.", buildHint: "Rod of Ages, Zhonya's Hourglass" },
    ],
    easyCounters: [
      { champion: "Fizz", difficulty: "easy", tier: "S", reasonWhy: "Malzahar için en kolay counter.", laneAdvantage: "E her CC'yi dodge eder.", watchOut: "Malzahar R Fizz E bitmişken.", buildHint: "Lich Bane, Shadowflame" },
      { champion: "Kassadin", difficulty: "easy", tier: "A", reasonWhy: "MR Malzahar hasar azaltır.", laneAdvantage: "Level 6 sonrası Kassadin baskılar.", watchOut: "Malzahar erken güçlüdür.", buildHint: "Rod of Ages, Zhonya's Hourglass" },
    ],
    soloQueueCounters: [
      { champion: "Fizz", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Malzahar için en iyi counter.", laneAdvantage: "E dodge her abilityyi geçer.", watchOut: "Malzahar ult Fizz E'siz öldürür.", buildHint: "Lich Bane, Shadowflame" },
      { champion: "Kassadin", difficulty: "medium", tier: "A", reasonWhy: "MR + late scale Malzahar için sorun.", laneAdvantage: "Late game ort.", watchOut: "Malzahar erken çok baskılıdır.", buildHint: "Rod of Ages, Void Staff" },
    ],
    tips: ["Malzahar ult kanalını interrupt etmek için CC kullan.", "Malzahar void swarm minyonları silah olarak kullanır.", "Malzahar Q silence + E DoT + R ult combo sırası."],
    patchNote: NOTE,
  },

  "Orianna": {
    topCounters: [
      { champion: "Zed", difficulty: "medium", tier: "S", reasonWhy: "Dive Orianna'nın güvenli ball poke stilini bozar.", laneAdvantage: "Shadow burst Orianna'yı öldürür.", watchOut: "Orianna R shockwave ball pozisyonu kritik.", buildHint: "Serylda's Grudge, Edge of Night" },
      { champion: "LeBlanc", difficulty: "medium", tier: "A", reasonWhy: "Mobility + burst Orianna için sorun.", laneAdvantage: "Chain CC Orianna'yı durdurur.", watchOut: "Orianna R ball team fight kazandırır.", buildHint: "Luden's Tempest, Rabadon's Deathcap" },
      { champion: "Akali", difficulty: "medium", tier: "A", reasonWhy: "Shroud + dive Orianna'nın poke stilini engeller.", laneAdvantage: "All-in Orianna'yı zorlnur.", watchOut: "Orianna Q + W chip hasar sürekli.", buildHint: "Night Harvester, Shadowflame" },
    ],
    easyCounters: [
      { champion: "Zed", difficulty: "easy", tier: "S", reasonWhy: "Orianna için en kolay counter.", laneAdvantage: "Dive burst güçlü.", watchOut: "Orianna R shockwave geniş.", buildHint: "Serylda's Grudge, Shadowflame" },
      { champion: "Akali", difficulty: "easy", tier: "A", reasonWhy: "Shroud Orianna'nın ball track'ini bozar.", laneAdvantage: "All-in baskısı güçlü.", watchOut: "Orianna R ball pozisyonu.", buildHint: "Night Harvester, Shadowflame" },
    ],
    soloQueueCounters: [
      { champion: "Zed", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Orianna için en iyi counter.", laneAdvantage: "Burst güçlü.", watchOut: "Orianna R team fight belirleyici.", buildHint: "Serylda's Grudge, Shadowflame" },
      { champion: "LeBlanc", difficulty: "medium", tier: "A", reasonWhy: "Burst + CC Orianna'yı durdurur.", laneAdvantage: "Chain CC güçlü.", watchOut: "Orianna R bir anda team fight kazandırır.", buildHint: "Luden's Tempest, Rabadon's Deathcap" },
    ],
    tips: ["Orianna topu takip et, top konumuna göre R gelir.", "Orianna W shield aktifken hasar azalır.", "Orianna ball proximity poke yapar, ball'dan uzak dur."],
    patchNote: NOTE,
  },

  "Ryze": {
    topCounters: [
      { champion: "Zed", difficulty: "medium", tier: "S", reasonWhy: "AD damage Ryze'ın MR build'ini bypass eder.", laneAdvantage: "Shadow burst Ryze'ı öldürür.", watchOut: "Ryze E root sürpriz gelir.", buildHint: "Serylda's Grudge, Edge of Night" },
      { champion: "LeBlanc", difficulty: "medium", tier: "A", reasonWhy: "Burst LeBlanc Ryze'ı erken öldürür.", laneAdvantage: "Chain CC Ryze mana yönetimini bozar.", watchOut: "Ryze passive flux chain hasar.", buildHint: "Luden's Tempest, Rabadon's Deathcap" },
      { champion: "Kassadin", difficulty: "medium", tier: "A", reasonWhy: "MR pasifi Ryze hasarını azaltır.", laneAdvantage: "Late game scale Ryze'dan bile güçlü.", watchOut: "Ryze E root + W instant kill.", buildHint: "Rod of Ages, Zhonya's Hourglass" },
    ],
    easyCounters: [
      { champion: "Zed", difficulty: "easy", tier: "S", reasonWhy: "Ryze için en kolay counter.", laneAdvantage: "AD bypass burst güçlü.", watchOut: "Ryze E root ani gelir.", buildHint: "Serylda's Grudge, Edge of Night" },
      { champion: "Ahri", difficulty: "easy", tier: "A", reasonWhy: "Charm + mobility Ryze için sorun.", laneAdvantage: "Charm + burst güçlü.", watchOut: "Ryze DPS çok yüksek.", buildHint: "Luden's Tempest, Rabadon's Deathcap" },
    ],
    soloQueueCounters: [
      { champion: "Zed", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Ryze için en iyi counter.", laneAdvantage: "AD burst güçlü.", watchOut: "Ryze late game DPS çok yüksek.", buildHint: "Serylda's Grudge, Shadowflame" },
      { champion: "Kassadin", difficulty: "medium", tier: "A", reasonWhy: "MR + scale Ryze'a karşı güçlü.", laneAdvantage: "Late game scale.", watchOut: "Ryze erken çok baskılıdır.", buildHint: "Rod of Ages, Void Staff" },
    ],
    tips: ["Ryze Q flux mark üzerinde hasar artırır.", "Ryze R group teleport çok büyük teamfight baskısı.", "Ryze mana yönetimi önemlidir, erken hasar vermek zorlaşır."],
    patchNote: NOTE,
  },

  "Syndra": {
    topCounters: [
      { champion: "Zed", difficulty: "medium", tier: "A", reasonWhy: "Shadow Syndra'nın Q sphere poke'undan kaçar.", laneAdvantage: "Burst Syndra'yı öldürür.", watchOut: "Syndra E stun + Q combo ani burst.", buildHint: "Serylda's Grudge, Edge of Night" },
      { champion: "Fizz", difficulty: "medium", tier: "S", reasonWhy: "E dodge Syndra'nın tüm poke + CC'sinden kaçar.", laneAdvantage: "All-in Syndra için büyük sorun.", watchOut: "Syndra Q sphere pool burst yapar.", buildHint: "Lich Bane, Shadowflame" },
      { champion: "LeBlanc", difficulty: "medium", tier: "A", reasonWhy: "Mobility Syndra'nın kısa menzil sphere kontrolünü aşar.", laneAdvantage: "Chain CC Syndra'yı durdurur.", watchOut: "Syndra R spheres one-shot.", buildHint: "Luden's Tempest, Rabadon's Deathcap" },
    ],
    easyCounters: [
      { champion: "Fizz", difficulty: "easy", tier: "S", reasonWhy: "Syndra için en kolay counter.", laneAdvantage: "E dodge tüm poke'u geçersiz kılar.", watchOut: "Syndra R spheres one-shot.", buildHint: "Lich Bane, Shadowflame" },
      { champion: "LeBlanc", difficulty: "easy", tier: "A", reasonWhy: "Mobility Syndra'yı zorlnur.", laneAdvantage: "Chain CC güçlü.", watchOut: "Syndra stun + burst kombosu.", buildHint: "Luden's Tempest, Rabadon's Deathcap" },
    ],
    soloQueueCounters: [
      { champion: "Fizz", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Syndra için en iyi counter.", laneAdvantage: "E dodge her abilityyi iptal eder.", watchOut: "Syndra R one-shot her zaman.", buildHint: "Lich Bane, Shadowflame" },
      { champion: "Zed", difficulty: "medium", tier: "A", reasonWhy: "AD bypass + burst Syndra için sorun.", laneAdvantage: "Shadow burst güçlü.", watchOut: "Syndra E stun sürpriz.", buildHint: "Serylda's Grudge, Shadowflame" },
    ],
    tips: ["Syndra R spheres 7+ sphere ile one-shot seviyesine çıkar.", "Syndra Q + W sphere biriktirme çok hasar verir.", "Syndra E stun sphere pozisyonundan gelir."],
    patchNote: NOTE,
  },

  "Twisted Fate": {
    topCounters: [
      { champion: "Zed", difficulty: "medium", tier: "S", reasonWhy: "All-in baskısı Twisted Fate'in güvenli poke stilini bozar.", laneAdvantage: "Shadow burst Twisted Fate'i öldürür.", watchOut: "TF gold card stun + R global.", buildHint: "Serylda's Grudge, Edge of Night" },
      { champion: "LeBlanc", difficulty: "medium", tier: "A", reasonWhy: "Burst LeBlanc TF'yi hızlı öldürür.", laneAdvantage: "Chain CC TF'yi kilitler.", watchOut: "TF R global presence tehlikeli.", buildHint: "Luden's Tempest, Rabadon's Deathcap" },
      { champion: "Talon", difficulty: "medium", tier: "A", reasonWhy: "R roam Talon TF'nin global roam avantajını engeller.", laneAdvantage: "Burst TF için sorun.", watchOut: "TF gold card stun combo.", buildHint: "Duskblade, Edge of Night" },
    ],
    easyCounters: [
      { champion: "Zed", difficulty: "easy", tier: "S", reasonWhy: "TF için en kolay counter.", laneAdvantage: "Burst güçlü.", watchOut: "TF gold card stun ani.", buildHint: "Serylda's Grudge, Edge of Night" },
      { champion: "Katarina", difficulty: "easy", tier: "A", reasonWhy: "Mobility + reset TF için sorun.", laneAdvantage: "Reset combo TF'yi ezer.", watchOut: "TF R global teleport.", buildHint: "Night Harvester, Shadowflame" },
    ],
    soloQueueCounters: [
      { champion: "Zed", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da TF için en iyi counter.", laneAdvantage: "Burst güçlü.", watchOut: "TF R global her an tehlikeli.", buildHint: "Serylda's Grudge, Shadowflame" },
      { champion: "Talon", difficulty: "medium", tier: "A", reasonWhy: "R roam TF'nin global baskısına karşı.", laneAdvantage: "Roam counter güçlü.", watchOut: "TF gold card stun combo.", buildHint: "Duskblade, Edge of Night" },
    ],
    tips: ["TF gold card CD olmayan W'de kaçma fırsatı kullan.", "TF R cast süresi uzun, ward ile pozisyon al.", "TF mana bağımlıdır, erken fight yap."],
    patchNote: NOTE,
  },

  "Veigar": {
    topCounters: [
      { champion: "Zed", difficulty: "medium", tier: "S", reasonWhy: "AD damage Veigar'ın AP shield'ını bypass eder.", laneAdvantage: "Shadow burst Veigar'ı one-shot eder.", watchOut: "Veigar cage + R one-shot tehlikeli.", buildHint: "Serylda's Grudge, Edge of Night" },
      { champion: "LeBlanc", difficulty: "medium", tier: "A", reasonWhy: "Mobility Veigar'ın cage menzilini atlatır.", laneAdvantage: "Chain CC Veigar'ı kilitler.", watchOut: "Veigar cage + ult instant öldürücü.", buildHint: "Luden's Tempest, Rabadon's Deathcap" },
      { champion: "Fizz", difficulty: "medium", tier: "A", reasonWhy: "E dodge Veigar cage'den kaçar.", laneAdvantage: "All-in Veigar için büyük sorun.", watchOut: "Veigar late game AP çok yüksek.", buildHint: "Lich Bane, Shadowflame" },
    ],
    easyCounters: [
      { champion: "Zed", difficulty: "easy", tier: "S", reasonWhy: "Veigar için en kolay counter.", laneAdvantage: "AD bypass one-shot.", watchOut: "Veigar cage sürpriz.", buildHint: "Serylda's Grudge, Edge of Night" },
      { champion: "Ahri", difficulty: "easy", tier: "A", reasonWhy: "Mobility + charm Veigar için sorun.", laneAdvantage: "Charm + burst güçlü.", watchOut: "Veigar cage + R late game öldürücü.", buildHint: "Luden's Tempest, Rabadon's Deathcap" },
    ],
    soloQueueCounters: [
      { champion: "Zed", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Veigar için en iyi counter.", laneAdvantage: "AD burst güçlü.", watchOut: "Veigar cage + R late game one-shot.", buildHint: "Serylda's Grudge, Shadowflame" },
      { champion: "Fizz", difficulty: "medium", tier: "A", reasonWhy: "E dodge Veigar kit'ini geçersiz kılar.", laneAdvantage: "All-in baskısı.", watchOut: "Veigar cage ward koy.", buildHint: "Lich Bane, Shadowflame" },
    ],
    tips: ["Veigar cage kenarlarında stun'lar, ortasında dur.", "Veigar stack Q ile sonsuz AP kazanır, erken öldür.", "Veigar AP shield R gelen hasarı azaltır."],
    patchNote: NOTE,
  },

  "Viktor": {
    topCounters: [
      { champion: "Zed", difficulty: "medium", tier: "S", reasonWhy: "Dive Zed Viktor'ın güvenli poke stilini bozar.", laneAdvantage: "Shadow burst Viktor'ı öldürür.", watchOut: "Viktor E gravity field stun ani.", buildHint: "Serylda's Grudge, Edge of Night" },
      { champion: "LeBlanc", difficulty: "medium", tier: "A", reasonWhy: "Burst LeBlanc Viktor'ı erken öldürür.", laneAdvantage: "Chain CC Viktor'ı kilitler.", watchOut: "Viktor lazor poke çok güçlüdür.", buildHint: "Luden's Tempest, Rabadon's Deathcap" },
      { champion: "Akali", difficulty: "medium", tier: "A", reasonWhy: "Dive + shroud Viktor'ın poke stilini engeller.", laneAdvantage: "All-in Viktor için sorun.", watchOut: "Viktor E gravity stun zone.", buildHint: "Night Harvester, Shadowflame" },
    ],
    easyCounters: [
      { champion: "Zed", difficulty: "easy", tier: "S", reasonWhy: "Viktor için en kolay counter.", laneAdvantage: "Burst güçlü.", watchOut: "Viktor E stun.", buildHint: "Serylda's Grudge, Shadowflame" },
      { champion: "Fizz", difficulty: "easy", tier: "A", reasonWhy: "E dodge Viktor poke'undan kaçar.", laneAdvantage: "All-in baskısı.", watchOut: "Viktor E gravity field.", buildHint: "Lich Bane, Shadowflame" },
    ],
    soloQueueCounters: [
      { champion: "Zed", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Viktor için en iyi counter.", laneAdvantage: "Burst güçlü.", watchOut: "Viktor geç oyun çok güçlü.", buildHint: "Serylda's Grudge, Shadowflame" },
      { champion: "LeBlanc", difficulty: "medium", tier: "A", reasonWhy: "Burst + CC Viktor için sorun.", laneAdvantage: "Erken kill baskısı.", watchOut: "Viktor lazor poke çok tehlikeli.", buildHint: "Luden's Tempest, Rabadon's Deathcap" },
    ],
    tips: ["Viktor E gravity field aktifken içinde dur.", "Viktor upgrade sırası: Q > E > R önerilir.", "Viktor lazor uzun çizgi hasar verir, yana adım at."],
    patchNote: NOTE,
  },

  "Vex": {
    topCounters: [
      { champion: "Zed", difficulty: "medium", tier: "S", reasonWhy: "AD damage Vex'in AP kit'ini bypass eder.", laneAdvantage: "Shadow burst Vex'i öldürür.", watchOut: "Vex fear passive dash sonrası çalışır.", buildHint: "Serylda's Grudge, Edge of Night" },
      { champion: "Akali", difficulty: "medium", tier: "A", reasonWhy: "Shroud Vex'in fear passive'ini tetiklemeden yaklaşır.", laneAdvantage: "Shroud + dive Vex için sorun.", watchOut: "Vex E shield + fear combo ani.", buildHint: "Night Harvester, Shadowflame" },
      { champion: "Fizz", difficulty: "medium", tier: "A", reasonWhy: "E dodge Vex'in fear passive'ini geçer.", laneAdvantage: "All-in Vex için büyük sorun.", watchOut: "Vex Q slow + E shield.", buildHint: "Lich Bane, Shadowflame" },
    ],
    easyCounters: [
      { champion: "Zed", difficulty: "easy", tier: "S", reasonWhy: "Vex için en kolay counter.", laneAdvantage: "AD bypass burst.", watchOut: "Vex fear passive'ini tetikleme.", buildHint: "Serylda's Grudge, Edge of Night" },
      { champion: "Akali", difficulty: "easy", tier: "A", reasonWhy: "Shroud Vex fear'ını geçer.", laneAdvantage: "Dive güçlü.", watchOut: "Vex E shield ani.", buildHint: "Night Harvester, Shadowflame" },
    ],
    soloQueueCounters: [
      { champion: "Zed", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Vex için en iyi counter.", laneAdvantage: "AD burst güçlü.", watchOut: "Vex fear passive yönet.", buildHint: "Serylda's Grudge, Shadowflame" },
      { champion: "Katarina", difficulty: "medium", tier: "A", reasonWhy: "Mobility reset Vex fear'ını sürekli tetikler ama reset kazanır.", laneAdvantage: "Reset combo Vex'i ezer.", watchOut: "Vex fear passive her dash sonrası.", buildHint: "Night Harvester, Rabadon's Deathcap" },
    ],
    tips: ["Vex fear passive dash/jump sonrası aktif olur, dash kullanma.", "Vex E shield hasar azaltır.", "Vex R takip eder, kaçmak zordur."],
    patchNote: NOTE,
  },

  "Yasuo": {
    topCounters: [
      { champion: "Malphite", difficulty: "easy", tier: "S", reasonWhy: "Zırh pasifi Yasuo'nun tüm AD hasarını bloke eder.", laneAdvantage: "Passive kalkan + yüksek zırh ile kazanır.", watchOut: "Yasuo ult Malphite R'ı tetikler.", buildHint: "Frozen Heart, Sunfire Aegis" },
      { champion: "Renekton", difficulty: "medium", tier: "A", reasonWhy: "Stun Yasuo'nun Windwall'ını geçer.", laneAdvantage: "Stun ile Yasuo'yu yerinde kilitler.", watchOut: "Yasuo Q3 Whirlwind'e dikkat et.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Pantheon", difficulty: "medium", tier: "A", reasonWhy: "W CC Yasuo'yu durdurur, Windwall'ı bloke edemez.", laneAdvantage: "Stun sonrası full combo.", watchOut: "Yasuo 3Q sonrası Whirlwind.", buildHint: "Trinity Force, Sterak's Gage" },
    ],
    easyCounters: [
      { champion: "Malphite", difficulty: "easy", tier: "S", reasonWhy: "Yasuo için en kolay ve etkili counter.", laneAdvantage: "Her trade'i kazanır.", watchOut: "Yasuo Windwall Q3 knockup.", buildHint: "Frozen Heart, Thornmail" },
      { champion: "Garen", difficulty: "easy", tier: "B", reasonWhy: "Silence Yasuo'nun Q ve E'sini keser.", laneAdvantage: "Q silence sonrası spin.", watchOut: "Yasuo Q3 Whirlwind Garen silence'ını aşar.", buildHint: "Stridebreaker, Mortal Reminder" },
    ],
    soloQueueCounters: [
      { champion: "Annie", difficulty: "easy", tier: "A", reasonWhy: "Stun + burst Yasuo'yu Windwall kullanamadan öldürür.", laneAdvantage: "4 stack stun hazırsa Yasuo anında ölür.", watchOut: "Tibbers aktifken Yasuo'dan uzak dur.", buildHint: "Luden's Tempest, Rabadon's Deathcap" },
      { champion: "Renekton", difficulty: "medium", tier: "A", reasonWhy: "Stun Windwall'ı geçer, snowball durdurur.", laneAdvantage: "Erken agresiflik şarttır.", watchOut: "Yasuo 2 item sonrası çok güçlü.", buildHint: "Ravenous Hydra, Black Cleaver" },
    ],
    tips: ["Yasuo'nun Windwall açıkken agresif ol, cooldown'da saldır.", "Minyon wave'ini freeze et, Yasuo CS almakta zorlanır.", "Zırh item'ları önceliklendir — Yasuo tamamen AD çalışır."],
    patchNote: NOTE,
  },

  "Yone": {
    topCounters: [
      { champion: "Malphite", difficulty: "easy", tier: "S", reasonWhy: "R knockup + zırh Yone'un tüm AD hasarını sıfırlar.", laneAdvantage: "Her seviyede Yone'yu ezer.", watchOut: "Yone E soul split kaçışı var.", buildHint: "Frozen Heart, Sunfire Aegis" },
      { champion: "Lissandra", difficulty: "medium", tier: "A", reasonWhy: "CC chain Yone'un E soul split'ini durdurur.", laneAdvantage: "Self ult + CC Yone burst'ünü sıfırlar.", watchOut: "Yone Q3 tornado tahmin edilemez.", buildHint: "Rod of Ages, Zhonya's Hourglass" },
      { champion: "Vex", difficulty: "medium", tier: "A", reasonWhy: "Fear passive Yone'un her dash'ini cezalandırır.", laneAdvantage: "Poke + fear Yone için kabus.", watchOut: "Yone E soul return kaçış.", buildHint: "Luden's Tempest, Shadowflame" },
    ],
    easyCounters: [
      { champion: "Malphite", difficulty: "easy", tier: "S", reasonWhy: "Yone için en kolay counter.", laneAdvantage: "Her trade kazanır.", watchOut: "Yone E soul split var.", buildHint: "Frozen Heart, Warmog's Armor" },
      { champion: "Vex", difficulty: "easy", tier: "A", reasonWhy: "Fear her Yone dash'ini cezalandırır.", laneAdvantage: "Poke + fear güçlü.", watchOut: "Yone Q3 tornado uzaktan gelir.", buildHint: "Luden's Tempest, Shadowflame" },
    ],
    soloQueueCounters: [
      { champion: "Malphite", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da Yone için en güvenli counter.", laneAdvantage: "R knockup + team fight value.", watchOut: "Yone R soul bind tehlikeli.", buildHint: "Frozen Heart, Warmog's Armor" },
      { champion: "Lissandra", difficulty: "medium", tier: "A", reasonWhy: "CC chain Yone'u her zaman durdurur.", laneAdvantage: "Self ult burst sıfırlar.", watchOut: "Yone E soul split kaçışı.", buildHint: "Rod of Ages, Zhonya's Hourglass" },
    ],
    tips: ["Yone E soul split aktifken Yone zayıflıyor — takip et.", "Yone Q3 tornado minyon knockup sayılır, uzakta dur.", "Yone R soul bind bitmeden engage et."],
    patchNote: NOTE,
  },

  "Zed": {
    topCounters: [
      { champion: "Lissandra", difficulty: "medium", tier: "S", reasonWhy: "Self ult Zed'in hasar combo'sunu sıfırlar.", laneAdvantage: "E slide + CC chain Zed'i durdurur.", watchOut: "Zed W shadow ile yaklaşmayı bekle.", buildHint: "Rod of Ages, Zhonya's Hourglass" },
      { champion: "Malzahar", difficulty: "easy", tier: "A", reasonWhy: "Zhonya'lı Malzahar Zed ult'ını golden stasis ile geçersiz kılar.", laneAdvantage: "Wave push Zed'i roam'dan engeller.", watchOut: "Zed invade'den kaçın.", buildHint: "Shadowflame, Zhonya's Hourglass" },
      { champion: "Fizz", difficulty: "hard", tier: "A", reasonWhy: "E dodge Zed'in tüm spelllerini iptal eder.", laneAdvantage: "E ile Zed'in tüm combo'sunu evade eder.", watchOut: "Zed Level 2'de çok güçlü.", buildHint: "Lich Bane, Shadowflame" },
    ],
    easyCounters: [
      { champion: "Malzahar", difficulty: "easy", tier: "A", reasonWhy: "Zhonya + Zed ult kombinasyonu mükemmel.", laneAdvantage: "Wave push Zed'i baskılar.", watchOut: "Zed Malzahar ult E'yi iptal edebilir.", buildHint: "Luden's Tempest, Zhonya's Hourglass" },
      { champion: "Anivia", difficulty: "medium", tier: "B", reasonWhy: "Egg passive Zed'in one-shot planını engeller.", laneAdvantage: "Passive ile ölümden döner.", watchOut: "Egg fazında Zed saldırmayı bırakmaz.", buildHint: "Rod of Ages, Zhonya's Hourglass" },
    ],
    soloQueueCounters: [
      { champion: "Lissandra", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Zed'i en etkili engelleyen şampiyondur.", laneAdvantage: "Self ult Zed combo'sunu tamamen sıfırlar.", watchOut: "Zed W atmadan önce baskı kurar.", buildHint: "Rod of Ages, Shadowflame" },
      { champion: "Galio", difficulty: "easy", tier: "A", reasonWhy: "W taunt + R global Zed için sorun.", laneAdvantage: "Team'e global yardım sağlar.", watchOut: "Zed full AD, zırh al.", buildHint: "Abyssal Mask, Gargoyle Stoneplate" },
    ],
    tips: ["Zed ult atarken Zhonya kullan, hasar iptal olur.", "Zed shadow'larının yerini takip et, shadow'a Q+E ile combo tamamlar.", "Zed Level 6 öncesi öldürülebilir, erken agresiflik şarttır."],
    patchNote: NOTE,
  },

  "Zoe": {
    topCounters: [
      { champion: "Zed", difficulty: "medium", tier: "S", reasonWhy: "Shadow Zoe'nin uyku combo'sundan hızla yaklaşır.", laneAdvantage: "Burst uyku açıkken Zoe'yi öldürür.", watchOut: "Zoe E uyku geniş alanda.", buildHint: "Serylda's Grudge, Edge of Night" },
      { champion: "LeBlanc", difficulty: "medium", tier: "A", reasonWhy: "Mobility Zoe'nin paddle star takibinden kaçar.", laneAdvantage: "Burst Zoe'yi öldürür.", watchOut: "Zoe E uyku LeBlanc'ı durdurur.", buildHint: "Luden's Tempest, Rabadon's Deathcap" },
      { champion: "Fizz", difficulty: "medium", tier: "A", reasonWhy: "E dodge Zoe'nin E uyku'sundan kaçar.", laneAdvantage: "All-in Zoe için büyük sorun.", watchOut: "Zoe Q paddle star geniş alan.", buildHint: "Lich Bane, Shadowflame" },
    ],
    easyCounters: [
      { champion: "Fizz", difficulty: "easy", tier: "A", reasonWhy: "Zoe için en kolay counter.", laneAdvantage: "E dodge uyku'dan kaçar.", watchOut: "Zoe Q burst çok yüksek.", buildHint: "Lich Bane, Shadowflame" },
      { champion: "LeBlanc", difficulty: "easy", tier: "A", reasonWhy: "Mobility Zoe poke'undan kaçar.", laneAdvantage: "Burst güçlü.", watchOut: "Zoe E uyku LeBlanc'ı durdurur.", buildHint: "Luden's Tempest, Rabadon's Deathcap" },
    ],
    soloQueueCounters: [
      { champion: "Zed", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Zoe için en iyi counter.", laneAdvantage: "Shadow burst güçlü.", watchOut: "Zoe uyku her yerden gelir.", buildHint: "Serylda's Grudge, Shadowflame" },
      { champion: "Kassadin", difficulty: "medium", tier: "A", reasonWhy: "MR + late scale Zoe'ye karşı güçlü.", laneAdvantage: "Late game ort.", watchOut: "Zoe erken baskı çok tehlikeli.", buildHint: "Rod of Ages, Void Staff" },
    ],
    tips: ["Zoe E uyku sonrası uyanırken çok hasar alırsın.", "Zoe Q paddle star yön değiştirir, düz koşma.", "Zoe W summoner spell steal ile flash kullanabilir."],
    patchNote: NOTE,
  },
};
