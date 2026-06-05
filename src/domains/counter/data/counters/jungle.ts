import type { GeneralCounterResult } from "../../types/counter.types";

type RoleData = Omit<GeneralCounterResult, "champion" | "role" | "generatedAt">;

const NOTE = "Bu veriler manuel olarak girilmiştir. Patch güncellemelerini yansıtmayabilir.";

export const JUNGLE_COUNTERS: Record<string, RoleData> = {
  "Amumu": {
    topCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Lee Sin erken invade ile Amumu'yu camp'larından kovar.", laneAdvantage: "Ward-hop mobility Amumu'ya karşı çok üstündür.", watchOut: "Amumu R AoE CC team fight'ta belirleyicidir.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Graves", difficulty: "medium", tier: "A", reasonWhy: "Zırh pen + burst Amumu'yu early gank öncesinde zayıflatır.", laneAdvantage: "Smoke Screen Amumu'nun Q bandage'ını engeller.", watchOut: "Amumu tank build sonrası Graves hasar yapamaz.", buildHint: "Kraken Slayer, Lord Dominik's Regards" },
      { champion: "Hecarim", difficulty: "medium", tier: "A", reasonWhy: "Hız avantajı ile Amumu'yu sürekli geç bırakır.", laneAdvantage: "Rampage + Spirit of Dread duel avantajı sağlar.", watchOut: "Amumu R Hecarim'i durdurur.", buildHint: "Trinity Force, Sterak's Gage" },
    ],
    easyCounters: [
      { champion: "Warwick", difficulty: "easy", tier: "A", reasonWhy: "Healing sustain ve erken duel gücü Amumu'yu geride bırakır.", laneAdvantage: "W passive düşük HP'de Amumu'yu izler.", watchOut: "Amumu R CC'si Warwick için tehlikeli.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Graves", difficulty: "easy", tier: "A", reasonWhy: "Early burst Amumu'ya zor zaman geçirir.", laneAdvantage: "Camp'ları hızlı temizler.", watchOut: "Amumu group fights'ta çok güçlüdür.", buildHint: "Kraken Slayer, Collector" },
    ],
    soloQueueCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Amumu'yu en güvenilir durdurur.", laneAdvantage: "Erken camp hakimiyeti.", watchOut: "Amumu R team fight'ta oyunu çevirebilir.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Hecarim", difficulty: "medium", tier: "A", reasonWhy: "Hız + AoE hasar Amumu'nun yavaş clear'ını cezalandırır.", laneAdvantage: "Objective control kolaylaşır.", watchOut: "Amumu dragon/baron kontrol için ward koy.", buildHint: "Trinity Force, Sterak's Gage" },
    ],
    tips: ["Amumu Q bandage menzilini öğren.", "Amumu ilk clear'ı yavaş, invade fırsatı kullan.", "Amumu R AoE CC team fight kazandırır, ward ile pozisyon al."],
    patchNote: NOTE,
  },

  "Diana": {
    topCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Lee Sin erken duel avantajı ile Diana'yı camp'larında döver.", laneAdvantage: "Ward-hop ile Diana'nın engage'inden kaçar.", watchOut: "Diana 6+ sonrası çok güçlü olur.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Rammus", difficulty: "easy", tier: "A", reasonWhy: "Zırh stack Diana'nın AD+AP hybrid hasarını absorbe eder.", laneAdvantage: "Taunt + thornmail Diana'ya karşı.", watchOut: "Diana orb combo burst yapabilir.", buildHint: "Sunfire Aegis, Thornmail" },
      { champion: "Vi", difficulty: "medium", tier: "A", reasonWhy: "R ile Diana'nın engage'ine counter eder.", laneAdvantage: "Tankier build Diana'nın burst'üne dayanır.", watchOut: "Diana passive empowered Q zap sürpriz yapar.", buildHint: "Trinity Force, Sterak's Gage" },
    ],
    easyCounters: [
      { champion: "Rammus", difficulty: "easy", tier: "A", reasonWhy: "En kolay Diana counter'ı.", laneAdvantage: "Zırh tüm hasar kaynaklarını azaltır.", watchOut: "Diana E pull camp'tan uzaklaştırabilir.", buildHint: "Sunfire Aegis, Frozen Heart" },
      { champion: "Warwick", difficulty: "easy", tier: "B", reasonWhy: "Sustain + CC Diana'yı zorlar.", laneAdvantage: "Healing duel avantajı sağlar.", watchOut: "Diana clear hızı yüksektir.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    soloQueueCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Diana'ya en iyi karşı çıkar.", laneAdvantage: "Erken presyon haritayı kontrol eder.", watchOut: "Diana 6+ level spike çok güçlü.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Warwick", difficulty: "easy", tier: "A", reasonWhy: "Sürekli healing ve CC ile duel kazanır.", laneAdvantage: "R ile Diana'yı kilitler.", watchOut: "Diana orb Q pull engage ani olabilir.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    tips: ["Diana Q shield olmadan çok zayıf, Q bitmişken agresif ol.", "Diana R sadece Q orb aktifken pull yapar.", "Diana camp'ları hızlı temizler, counter gank yap."],
    patchNote: NOTE,
  },

  "Ekko": {
    topCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Erken invade ve duel gücü Ekko'yu geride bırakır.", laneAdvantage: "Lee Sin ward-hop Ekko'nun W shield'ını geçer.", watchOut: "Ekko R zaman geri alma counter-gank için tehlikeli.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Rammus", difficulty: "easy", tier: "A", reasonWhy: "Zırh Ekko'nun hybrid hasarını absorbe eder.", laneAdvantage: "Taunt + thornmail Ekko duel'ini bozar.", watchOut: "Ekko W stasis shield zamanlaması kritik.", buildHint: "Sunfire Aegis, Thornmail" },
      { champion: "Warwick", difficulty: "easy", tier: "A", reasonWhy: "Healing sustain Ekko'nun burst'üne dayanır.", laneAdvantage: "R CC Ekko engage'ini kilitler.", watchOut: "Ekko R ile Warwick hasar etkisiz kalabilir.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    easyCounters: [
      { champion: "Rammus", difficulty: "easy", tier: "A", reasonWhy: "Ekko için en kolay counter'dır.", laneAdvantage: "Zırh tüm hasarı azaltır.", watchOut: "Ekko R stasis geçici invincibility.", buildHint: "Sunfire Aegis, Frozen Heart" },
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Erken agresiflik Ekko'yu ezer.", laneAdvantage: "Ward mobility Ekko'ya karşı üstün.", watchOut: "Ekko R tehlikeli kaçış sağlar.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    soloQueueCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Ekko'ya en iyi karşı çıkar.", laneAdvantage: "Erken camp hakimiyeti.", watchOut: "Ekko R counter-gank için saklar.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Vi", difficulty: "medium", tier: "A", reasonWhy: "R ile Ekko engage'ine counter eder.", laneAdvantage: "Tanky build Ekko burst'üne dayanır.", watchOut: "Ekko W E combo CC zinciri.", buildHint: "Trinity Force, Sterak's Gage" },
    ],
    tips: ["Ekko R kullandığında ghost konumuna hasar verme.", "Ekko W circular field orta kısmında stasis yapar.", "Ekko camp'larını hızlı temizler, karşı kampları kontrol et."],
    patchNote: NOTE,
  },

  "Elise": {
    topCounters: [
      { champion: "Hecarim", difficulty: "medium", tier: "S", reasonWhy: "Hecarim Elise'ten daha hızlı camp temizler ve erken objective alır.", laneAdvantage: "Speed + AoE duel gücü üstündür.", watchOut: "Elise stun + rappel erken invade engeller.", buildHint: "Trinity Force, Sterak's Gage" },
      { champion: "Warwick", difficulty: "easy", tier: "A", reasonWhy: "Sustain healing Elise'in burst combo'sunu dengeler.", laneAdvantage: "Healing duel avantajı sağlar.", watchOut: "Elise stun + E rappel kaçış güçlüdür.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Vi", difficulty: "medium", tier: "A", reasonWhy: "R CC Elise'in engage'ini durdurur.", laneAdvantage: "Tanky build Elise burst'üne dayanır.", watchOut: "Elise stun + cocoon CC zinciri.", buildHint: "Trinity Force, Sterak's Gage" },
    ],
    easyCounters: [
      { champion: "Warwick", difficulty: "easy", tier: "A", reasonWhy: "En kolay Elise counter'ı.", laneAdvantage: "Healing duel kazandırır.", watchOut: "Elise rappel kaçış sağlar.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Graves", difficulty: "easy", tier: "B", reasonWhy: "Burst Elise camp'larını geride bırakır.", laneAdvantage: "Camp temizleme hızı üstündür.", watchOut: "Elise erken gank baskısı güçlüdür.", buildHint: "Kraken Slayer, Collector" },
    ],
    soloQueueCounters: [
      { champion: "Hecarim", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Elise'e en iyi karşı çıkar.", laneAdvantage: "Hız ile objective'lere önce ulaşır.", watchOut: "Elise erken gank ağları çok etkilidir.", buildHint: "Trinity Force, Sterak's Gage" },
      { champion: "Warwick", difficulty: "easy", tier: "A", reasonWhy: "Sustain her Elise burst'ünü dengeler.", laneAdvantage: "Healing + CC güçlü.", watchOut: "Elise rappel Warwick R'ını geçersiz kılar.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    tips: ["Elise early game güçlüdür, erken objective kaybetme.", "Elise E rappel ile herhangi bir yerden kaçar.", "Elise geç oyunda güçsüzleşir, counter gank + objective ile baskı yap."],
    patchNote: NOTE,
  },

  "Evelynn": {
    topCounters: [
      { champion: "Warwick", difficulty: "medium", tier: "S", reasonWhy: "Warwick pasifi düşük HP'deki Evelynn'i görür, camouflage işe yaramaz.", laneAdvantage: "Sürekli lane baskısı ve sağlık yönetimi.", watchOut: "Evelynn W allure charm Warwick'i kilitler.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Lee Sin", difficulty: "medium", tier: "A", reasonWhy: "Erken invade Evelynn'in late game powerspike'ını engeller.", laneAdvantage: "Erken baskı ile Evelynn'i geride bırakır.", watchOut: "Evelynn R execute sürpriz one-shot.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Vi", difficulty: "medium", tier: "A", reasonWhy: "R ile Evelynn stealth'ten çıktığı anda kilitler.", laneAdvantage: "Tanky build Evelynn burst'üne dayanır.", watchOut: "Evelynn W charm Vi'yi yavaşlatır.", buildHint: "Trinity Force, Sterak's Gage" },
    ],
    easyCounters: [
      { champion: "Warwick", difficulty: "easy", tier: "S", reasonWhy: "Pasif Evelynn gizliliğini bypass eder.", laneAdvantage: "Evelynn kaçamaz.", watchOut: "Evelynn charm Warwick'i kısa süre durdurur.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Lee Sin", difficulty: "medium", tier: "A", reasonWhy: "Erken invade Evelynn'i geride bırakır.", laneAdvantage: "Erken agresiflik iyi sonuç verir.", watchOut: "Evelynn R tek hedef için öldürücü.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    soloQueueCounters: [
      { champion: "Warwick", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da Evelynn'e en iyi karşı çıkar.", laneAdvantage: "Pasif always-on Evelynn tracker.", watchOut: "Evelynn geç oyun one-shot baskısı.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Lee Sin", difficulty: "medium", tier: "A", reasonWhy: "Erken agresiflik Evelynn'i boğar.", laneAdvantage: "Erken camp hakimiyeti.", watchOut: "Evelynn charm + execute geç oyunda öldürür.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    tips: ["Evelynn Level 6'ya kadar camouflage yoktur, erken baskıla.", "Control ward ile Evelynn stealth'ini kır.", "Evelynn R execute HP eşiğinde çalışır, sağlıklıyken fight et."],
    patchNote: NOTE,
  },

  "Graves": {
    topCounters: [
      { champion: "Warwick", difficulty: "easy", tier: "S", reasonWhy: "Healing sustain Graves'in burst'üne dayanır, duel kazanır.", laneAdvantage: "Her 1v1 duelde Warwick kazanır.", watchOut: "Graves Smoke Screen CD bulmakta zorlanır.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Rammus", difficulty: "easy", tier: "S", reasonWhy: "Zırh Graves'in tüm AD hasarını absorbe eder.", laneAdvantage: "Taunt + thornmail Graves'i yavaşlatır.", watchOut: "Graves Q dash + burst tahmin edilemez.", buildHint: "Sunfire Aegis, Thornmail" },
      { champion: "Amumu", difficulty: "medium", tier: "A", reasonWhy: "Team fight AoE Graves'in bireysel baskısını geçersiz kılar.", laneAdvantage: "Amumu R + AoE team fight değeri yüksek.", watchOut: "Graves erken tempo kazanabilir.", buildHint: "Sunfire Aegis, Frozen Heart" },
    ],
    easyCounters: [
      { champion: "Rammus", difficulty: "easy", tier: "S", reasonWhy: "Graves için en kolay counter'dır.", laneAdvantage: "Zırh + taunt her duel kazandırır.", watchOut: "Graves Q animasyonu hızlıdır.", buildHint: "Sunfire Aegis, Thornmail" },
      { champion: "Warwick", difficulty: "easy", tier: "S", reasonWhy: "Sustain Graves'in burst'ünü dengeler.", laneAdvantage: "Duel avantajı her zaman var.", watchOut: "Graves stealth smoke + Q combo.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    soloQueueCounters: [
      { champion: "Amumu", difficulty: "easy", tier: "A", reasonWhy: "Solo queue'da Graves'e AoE CC ile karşı çıkar.", laneAdvantage: "Team fight değeri yüksek.", watchOut: "Graves erken camp avantajı.", buildHint: "Sunfire Aegis, Abyssal Mask" },
      { champion: "Warwick", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da Graves'i en güvenli durdurur.", laneAdvantage: "Duel avantajı.", watchOut: "Graves burst tahmin edilemez.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    tips: ["Graves'in ammo sistemi var, 2 atıştan sonra reload zamanında agresif ol.", "Graves E dash ile hızlı konumlanır.", "Graves Smoke Screen görüş iptal eder, içinde fight etme."],
    patchNote: NOTE,
  },

  "Hecarim": {
    topCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Lee Sin erken duel gücü ile Hecarim'i geride bırakır.", laneAdvantage: "Ward-hop mobility Hecarim'e karşı üstündür.", watchOut: "Hecarim R fear + ult engage baskısı.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Rammus", difficulty: "easy", tier: "A", reasonWhy: "Zırh Hecarim'in AD hasarını absorbe eder.", laneAdvantage: "Taunt + thornmail Hecarim'e karşı.", watchOut: "Hecarim R AoE fear engage.", buildHint: "Sunfire Aegis, Thornmail" },
      { champion: "Warwick", difficulty: "easy", tier: "A", reasonWhy: "Healing sustain Hecarim duel gücünü dengeler.", laneAdvantage: "Sürekli healing duel kazandırır.", watchOut: "Hecarim E knockback Warwick R'ını bölebilir.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    easyCounters: [
      { champion: "Rammus", difficulty: "easy", tier: "A", reasonWhy: "En kolay Hecarim counter'ı.", laneAdvantage: "Zırh her duel kazandırır.", watchOut: "Hecarim R sürpriz engage.", buildHint: "Sunfire Aegis, Frozen Heart" },
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Erken baskı Hecarim'i geride bırakır.", laneAdvantage: "Ward mobility Hecarim'den üstün.", watchOut: "Hecarim R fear çok uzun menzil.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    soloQueueCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Hecarim'e en iyi karşı çıkar.", laneAdvantage: "Erken camp kontrolü.", watchOut: "Hecarim split push çok etkilidir.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Vi", difficulty: "medium", tier: "A", reasonWhy: "R ile Hecarim engage'ine counter eder.", laneAdvantage: "Tanky build Hecarim hasarına dayanır.", watchOut: "Hecarim E knockback Vi R'ını bölebilir.", buildHint: "Trinity Force, Sterak's Gage" },
    ],
    tips: ["Hecarim R fear çok uzun menzili var, bekleme.", "Hecarim hızı çok yüksek, catch ward koy.", "Hecarim geç oyunda çok güçlü, erken kontrol şart."],
    patchNote: NOTE,
  },

  "Jarvan IV": {
    topCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Lee Sin erken duel avantajı ile Jarvan'ı geride bırakır.", laneAdvantage: "Ward-hop mobility Jarvan E+Q combo'sundan kaçar.", watchOut: "Jarvan R ring engage tehlikeli.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Warwick", difficulty: "easy", tier: "A", reasonWhy: "Sustain healing Jarvan'ın burst'ünü dengeler.", laneAdvantage: "Her duel Warwick kazanır.", watchOut: "Jarvan R+E+Q combo ani engage.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Nocturne", difficulty: "medium", tier: "A", reasonWhy: "Spell shield Jarvan'ın E+Q flag combo'sunu bloklar.", laneAdvantage: "R global ult harita baskısı sağlar.", watchOut: "Jarvan R içinde Nocturne R açık olmayabilir.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    easyCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "En etkili Jarvan counter'ı.", laneAdvantage: "Erken camp kontrolü.", watchOut: "Jarvan R + flash içinde kalan ölür.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Warwick", difficulty: "easy", tier: "A", reasonWhy: "Sustain duel kazandırır.", laneAdvantage: "Her 1v1'de Warwick kazanır.", watchOut: "Jarvan R ring escape için flash gerektirir.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    soloQueueCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Jarvan'a en iyi karşı çıkar.", laneAdvantage: "Erken presyon.", watchOut: "Jarvan gank baskısı güçlüdür.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Vi", difficulty: "medium", tier: "A", reasonWhy: "R engage Jarvan'a counter eder.", laneAdvantage: "Tanky build Jarvan burst'üne dayanır.", watchOut: "Jarvan R ring içinde tuzaklanma.", buildHint: "Trinity Force, Sterak's Gage" },
    ],
    tips: ["Jarvan E+Q knockup flash ile aşılabilir.", "Jarvan R ring içinde tuzaklanma, flash hazırla.", "Jarvan early game güçlü, counter camp yap."],
    patchNote: NOTE,
  },

  "Kayn": {
    topCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Erken invade Kayn'ın Reaper/Slayer dönüşümünü geciktirir.", laneAdvantage: "Ward-hop mobility Kayn'ın E duvar geçişine karşı.", watchOut: "Kayn Rhaast formu tank build ile güçlüdür.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Vi", difficulty: "medium", tier: "A", reasonWhy: "R ile Kayn engage'ini kilitler.", laneAdvantage: "Tanky build Kayn burst'üne dayanır.", watchOut: "Kayn E duvar geçişi Vi'nin takibini geçersiz kılar.", buildHint: "Trinity Force, Sterak's Gage" },
      { champion: "Warwick", difficulty: "easy", tier: "A", reasonWhy: "Sustain Kayn'ın her formuna karşı etkin.", laneAdvantage: "Healing duel avantajı.", watchOut: "Kayn Rhaast heal Warwick için sorun.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    easyCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Erken baskı Kayn için en zor şeydir.", laneAdvantage: "Camp kontrolü.", watchOut: "Kayn R ile herhangi bir yerden engage.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Warwick", difficulty: "easy", tier: "A", reasonWhy: "Sustain Kayn'ın her versiyonuna karşı güçlü.", laneAdvantage: "Duel kazanır.", watchOut: "Kayn E duvar geçişi Warwick'i aşar.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    soloQueueCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Kayn için en iyi counter'dır.", laneAdvantage: "Erken agresiflik Kayn'ı boğar.", watchOut: "Kayn Rhaast late game güçlüdür.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Vi", difficulty: "medium", tier: "A", reasonWhy: "R CC Kayn'a karşı etkili.", laneAdvantage: "Tanky build dayanıklıdır.", watchOut: "Kayn E her yerden kaçabilir.", buildHint: "Trinity Force, Sterak's Gage" },
    ],
    tips: ["Kayn Level 6 öncesi zayıftır, bu sürede baskıla.", "Kayn Rhaast formu için zırh, Shadow Assassin için MR al.", "Kayn E ile duvarlara girebilir, ward ile giriş noktalarını izle."],
    patchNote: NOTE,
  },

  "Kindred": {
    topCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Erken invade Kindred'ın mark camp'larını çalar.", laneAdvantage: "Ward-hop Kindred'ın kite'ından hızlıdır.", watchOut: "Kindred R ölüm engeli oyun değiştirir.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Graves", difficulty: "medium", tier: "A", reasonWhy: "Burst Kindred'ı camp'larında yakalar.", laneAdvantage: "Camp temizleme hızı Kindred'dan üstün.", watchOut: "Kindred W Wolf bite yüksek hasar verir.", buildHint: "Kraken Slayer, Lord Dominik's Regards" },
      { champion: "Hecarim", difficulty: "medium", tier: "A", reasonWhy: "Hız avantajı Kindred'ı sürekli geride bırakır.", laneAdvantage: "Objective'lere önce ulaşır.", watchOut: "Kindred R Hecarim'in ult engages'ini etkisizleştirir.", buildHint: "Trinity Force, Sterak's Gage" },
    ],
    easyCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Mark camp'larını çalmak Kindred için kabus.", laneAdvantage: "Erken camp hakimiyeti.", watchOut: "Kindred R her hayatı kurtarır.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Warwick", difficulty: "easy", tier: "A", reasonWhy: "Sustain Kindred'ın burst'üne dayanır.", laneAdvantage: "Duel avantajı sağlar.", watchOut: "Kindred R Warwick R'ı engeller.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    soloQueueCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Kindred'a en iyi karşı çıkar.", laneAdvantage: "Mark takibi + early invade.", watchOut: "Kindred R team fight sonucunu değiştirebilir.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Hecarim", difficulty: "medium", tier: "A", reasonWhy: "Hız Kindred'dan hızlı objective alır.", laneAdvantage: "Objective hızı üstündür.", watchOut: "Kindred R bitmek üzere olduğunda çık.", buildHint: "Trinity Force, Sterak's Gage" },
    ],
    tips: ["Kindred mark camp'larını steal et, powerspike'ını geciktir.", "Kindred R bittiğinde içindeki tüm düşmanları öldür.", "Kindred kite ağırlıklı, gap close şampiyon seç."],
    patchNote: NOTE,
  },

  "Lee Sin": {
    topCounters: [
      { champion: "Rammus", difficulty: "easy", tier: "S", reasonWhy: "Thornmail + Powerball ile Lee Sin'in AD burst'üne karşı mükemmeldir.", laneAdvantage: "Her 1v1 duel'de Rammus kazanır.", watchOut: "Lee Sin ward-hop ile Rammus'tan kaçabilir.", buildHint: "Sunfire Aegis, Thornmail" },
      { champion: "Warwick", difficulty: "easy", tier: "A", reasonWhy: "Sürekli healing ve CC ile Lee Sin duellerini kazanır.", laneAdvantage: "Warwick düşük HP'de daha da güçlenir.", watchOut: "Lee Sin Q uzak mesafeden poke edebilir.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Amumu", difficulty: "medium", tier: "A", reasonWhy: "AoE CC ve armor ile Lee Sin'in early game baskısını telafi eder.", laneAdvantage: "Team fight dominansı Lee Sin'in baskısını geçersiz kılar.", watchOut: "Lee Sin erken çok güçlü, ilk 15 dk kritik.", buildHint: "Sunfire Aegis, Abyssal Mask" },
    ],
    easyCounters: [
      { champion: "Rammus", difficulty: "easy", tier: "S", reasonWhy: "Lee Sin'in tüm AD stack'ini sıfırlar.", laneAdvantage: "Tüm 1v1 duellarında kazanır.", watchOut: "Lee Sin invade'lerinden camp protect et.", buildHint: "Thornmail, Frozen Heart" },
      { champion: "Nunu & Willump", difficulty: "easy", tier: "B", reasonWhy: "Snowball ile Lee Sin'i interrupt eder, Q healing ile dayanıklı.", laneAdvantage: "Objective control ve slow.", watchOut: "Lee Sin erken invade'de Nunu'yu öldürebilir.", buildHint: "Warmog's Armor, Turbo Chemtank" },
    ],
    soloQueueCounters: [
      { champion: "Amumu", difficulty: "easy", tier: "A", reasonWhy: "AoE ult ile team fight'ları tek başına kazanır.", laneAdvantage: "Dragon ve Baron control kolaylaşır.", watchOut: "Lee Sin erken drag almaya çalışır, ward koy.", buildHint: "Sunfire Aegis, Demonic Embrace" },
      { champion: "Vi", difficulty: "medium", tier: "A", reasonWhy: "R ile herhangi bir engage'i takip eder.", laneAdvantage: "Tankier build ile Lee Sin'in burst'üne dayanır.", watchOut: "Lee Sin erken camp invasion'larından korun.", buildHint: "Trinity Force, Sterak's Gage" },
    ],
    tips: ["Lee Sin early game çok güçlü, Dragon'a ward koy.", "Lee Sin ward-hop için ward kullanır, sweep ile kör et.", "Lee Sin'in R kick'i bir ally'ı uçurur, pozisyon al."],
    patchNote: NOTE,
  },

  "Lillia": {
    topCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Erken invade Lillia'nın slow farm stilini bozar.", laneAdvantage: "Ward-hop mobility Lillia'dan üstündür.", watchOut: "Lillia R uyku etkisi büyük fight'larda belirleyici.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Warwick", difficulty: "easy", tier: "A", reasonWhy: "Sustain healing Lillia'nın sürekli DoT hasarını dengeler.", laneAdvantage: "Her duel Warwick kazanır.", watchOut: "Lillia R sleep engage çok tehlikeli.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Graves", difficulty: "medium", tier: "A", reasonWhy: "Burst Lillia'nın camp'larını geçersiz kılar.", laneAdvantage: "Camp temizleme hızı üstündür.", watchOut: "Lillia passive hızı çok yüksek.", buildHint: "Kraken Slayer, Collector" },
    ],
    easyCounters: [
      { champion: "Warwick", difficulty: "easy", tier: "A", reasonWhy: "En kolay Lillia counter'ı.", laneAdvantage: "Duel avantajı her zaman.", watchOut: "Lillia R sleep geniş alan.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Erken baskı Lillia'yı boğar.", laneAdvantage: "Camp hakimiyeti.", watchOut: "Lillia kite + sleep combo güçlü.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    soloQueueCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Lillia için en iyi counter'dır.", laneAdvantage: "Erken agresiflik Lillia'yı durdurur.", watchOut: "Lillia R team fight game changer.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Warwick", difficulty: "easy", tier: "A", reasonWhy: "Sustain Lillia DoT'unu dengeler.", laneAdvantage: "Her duel Warwick kazanır.", watchOut: "Lillia kite hızı çok yüksek.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    tips: ["Lillia'nın passive hızı artarken kovalama.", "Lillia R uyku aktifken uyanan düşmana AoE hasar ver.", "Lillia camp'ları dönerek temizler, counter gank yapılabilir."],
    patchNote: NOTE,
  },

  "Nidalee": {
    topCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Erken invade Nidalee'nin spear poke stilini bozar.", laneAdvantage: "Hard invade ile Nidalee'yi geride bırakır.", watchOut: "Nidalee spear menzili çok uzundur.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Warwick", difficulty: "easy", tier: "A", reasonWhy: "Sustain healing Nidalee'nin burst combo'sunu dengeler.", laneAdvantage: "Duel her zaman Warwick lehine.", watchOut: "Nidalee cougar form combo çok hızlıdır.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Vi", difficulty: "medium", tier: "A", reasonWhy: "R ile Nidalee'yi cougar formunda kilitler.", laneAdvantage: "Tanky build Nidalee burst'üne dayanır.", watchOut: "Nidalee spear uzak mesafeden poke eder.", buildHint: "Trinity Force, Sterak's Gage" },
    ],
    easyCounters: [
      { champion: "Warwick", difficulty: "easy", tier: "A", reasonWhy: "En kolay Nidalee counter'ı.", laneAdvantage: "Sustain duel kazandırır.", watchOut: "Nidalee trap görüşü kısıtlar.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Erken invade Nidalee için kabus.", laneAdvantage: "Camp hakimiyeti.", watchOut: "Nidalee poke erken baskılıdır.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    soloQueueCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Nidalee'ye en iyi karşı çıkar.", laneAdvantage: "Erken presyon.", watchOut: "Nidalee spear menzilinden uzak dur.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Vi", difficulty: "medium", tier: "A", reasonWhy: "R CC Nidalee cougar formunu durdurur.", laneAdvantage: "Tanky build dayanıklıdır.", watchOut: "Nidalee spear uzak mesafeden tehlikelidir.", buildHint: "Trinity Force, Sterak's Gage" },
    ],
    tips: ["Nidalee spear minyonun arkasında geçmez, iyi pozisyon al.", "Nidalee trap'larını control ward ile ortadan kaldır.", "Nidalee cougar formuna geçerken tahmin edilebilir, CC kullan."],
    patchNote: NOTE,
  },

  "Nocturne": {
    topCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Erken duel gücü Nocturne'ü geride bırakır.", laneAdvantage: "Ward-hop Nocturne dagger spell shield'ını geçer.", watchOut: "Nocturne R global ult gece kör eder.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Hecarim", difficulty: "medium", tier: "A", reasonWhy: "Hız avantajı Nocturne'ün R engage baskısını dengeler.", laneAdvantage: "Objective'lere önce ulaşır.", watchOut: "Nocturne R gank baskısı güçlüdür.", buildHint: "Trinity Force, Sterak's Gage" },
      { champion: "Warwick", difficulty: "easy", tier: "A", reasonWhy: "Sustain healing Nocturne burst'üne dayanır.", laneAdvantage: "Her duel Warwick lehine.", watchOut: "Nocturne spell shield E abilitylerini bloklar.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    easyCounters: [
      { champion: "Warwick", difficulty: "easy", tier: "A", reasonWhy: "En kolay Nocturne counter'ı.", laneAdvantage: "Sustain duel avantajı.", watchOut: "Nocturne R gece herkes körleşir.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Erken baskı Nocturne'ü geride bırakır.", laneAdvantage: "Camp hakimiyeti.", watchOut: "Nocturne spell shield E'yi bloklar.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    soloQueueCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Nocturne'e en iyi karşı çıkar.", laneAdvantage: "Erken agresiflik.", watchOut: "Nocturne R gece baskısı her zaman var.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Hecarim", difficulty: "medium", tier: "A", reasonWhy: "Hız avantajı Nocturne'ü geride bırakır.", laneAdvantage: "Objective'lere önce ulaşır.", watchOut: "Nocturne global ult tehlikeli.", buildHint: "Trinity Force, Sterak's Gage" },
    ],
    tips: ["Nocturne R gece aktifken ward koy, konumlarını takip et.", "Nocturne spell shield E abilitylerini bloklar, AA ile hasar ver.", "Nocturne geç oyunda çok güçlüdür, erken önde ol."],
    patchNote: NOTE,
  },

  "Nunu & Willump": {
    topCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Erken invade Nunu'nun snowball'unu engeller.", laneAdvantage: "Ward-hop Nunu snowball'ından kaçar.", watchOut: "Nunu R charge çok geniş alan.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Graves", difficulty: "medium", tier: "A", reasonWhy: "Burst Nunu'yu camp'larında yakalar.", laneAdvantage: "Camp temizleme hızı üstündür.", watchOut: "Nunu Q monster yeme healing çok yüksek.", buildHint: "Kraken Slayer, Lord Dominik's Regards" },
      { champion: "Hecarim", difficulty: "medium", tier: "A", reasonWhy: "Hız avantajı Nunu'yu objective'lerde geçer.", laneAdvantage: "Objective hızı üstündür.", watchOut: "Nunu R channel yakın combat'ta engel.", buildHint: "Trinity Force, Sterak's Gage" },
    ],
    easyCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "En kolay Nunu counter'ı.", laneAdvantage: "Erken invade Nunu'yu geride bırakır.", watchOut: "Nunu Q healing çok yüksektir.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Graves", difficulty: "easy", tier: "A", reasonWhy: "Burst Nunu için sorun.", laneAdvantage: "Camp hızı üstündür.", watchOut: "Nunu R burst anlık hasar.", buildHint: "Kraken Slayer, Collector" },
    ],
    soloQueueCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Nunu'ya en iyi karşı çıkar.", laneAdvantage: "Erken presyon.", watchOut: "Nunu R channel kesilmezse büyük hasar.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Hecarim", difficulty: "medium", tier: "A", reasonWhy: "Hız avantajı.", laneAdvantage: "Objective kontrolünde üstün.", watchOut: "Nunu Q ormanda tanksız durma.", buildHint: "Trinity Force, Sterak's Gage" },
    ],
    tips: ["Nunu R channel interrupt etmek için CC kullan.", "Nunu Q healing ormanda yüksektir, sustain savaşına girme.", "Nunu objective başında bulunur, her zaman ward koy."],
    patchNote: NOTE,
  },

  "Rammus": {
    topCounters: [
      { champion: "Nidalee", difficulty: "medium", tier: "S", reasonWhy: "Uzak mesafe spear poke Rammus'u etkisiz kılar.", laneAdvantage: "Ranged poke Rammus'a yaklaşma fırsatı vermez.", watchOut: "Rammus Powerball ani engage yapar.", buildHint: "Zhonya's Hourglass, Shadowflame" },
      { champion: "Hecarim", difficulty: "medium", tier: "A", reasonWhy: "Hecarim AD değil Hecarim movement speed hasarı Rammus'a iyi skalalar.", laneAdvantage: "Hız avantajı Rammus'a karşı üstün.", watchOut: "Rammus taunt + ult Hecarim'i durdurur.", buildHint: "Trinity Force, Sterak's Gage" },
      { champion: "Warwick", difficulty: "easy", tier: "A", reasonWhy: "Magic damage Rammus'un zırh stack'ini bypass eder.", laneAdvantage: "Healing duel avantajı.", watchOut: "Rammus taunt Warwick'i durdurur.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    easyCounters: [
      { champion: "Hecarim", difficulty: "easy", tier: "A", reasonWhy: "En kolay Rammus counter'ı.", laneAdvantage: "Hız avantajı.", watchOut: "Rammus taunt çok tehlikelidir.", buildHint: "Trinity Force, Sterak's Gage" },
      { champion: "Warwick", difficulty: "easy", tier: "A", reasonWhy: "Magic damage Rammus'a karşı etkilidir.", laneAdvantage: "Sustain duel.", watchOut: "Rammus taunt Warwick'i durdurur.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    soloQueueCounters: [
      { champion: "Nidalee", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Rammus'u en etkili durduran şampiyondur.", laneAdvantage: "Spear poke güvenli.", watchOut: "Rammus Powerball ani engage.", buildHint: "Luden's Tempest, Shadowflame" },
      { champion: "Hecarim", difficulty: "easy", tier: "A", reasonWhy: "Hız + damage Rammus'u geride bırakır.", laneAdvantage: "Objective'lerde üstün.", watchOut: "Rammus taunt çok uzun.", buildHint: "Trinity Force, Sterak's Gage" },
    ],
    tips: ["Rammus Powerball aktifken engel koy önüne.", "Rammus taunt süresi 1.5-2.5 sn, bu sürede kaçmaya çalışma.", "Rammus'a karşı magic damage al, zırh işe yaramaz."],
    patchNote: NOTE,
  },

  "Shaco": {
    topCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Ward hakimiyeti Shaco'nun JitB tuzaklarını geçersiz kılar.", laneAdvantage: "Erken invade Shaco'yu camp'larında yakalar.", watchOut: "Shaco R clone kopyası kandırabilir.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Warwick", difficulty: "easy", tier: "A", reasonWhy: "Passive Shaco'nun düşük HP stealth'ini görür.", laneAdvantage: "Sustain healing duel avantajı.", watchOut: "Shaco fear deceive sürpriz yapar.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Vi", difficulty: "medium", tier: "A", reasonWhy: "R ile Shaco clone'undan gerçeği ayırt edebilir.", laneAdvantage: "Tanky build Shaco burst'üne dayanır.", watchOut: "Shaco E fear sürekli hasar engeller.", buildHint: "Trinity Force, Sterak's Gage" },
    ],
    easyCounters: [
      { champion: "Warwick", difficulty: "easy", tier: "A", reasonWhy: "En kolay Shaco counter'ı.", laneAdvantage: "Passive Shaco gizlilik işe yaramaz.", watchOut: "Shaco JitB fear sürekli baskı.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Ward sweep JitB tuzaklarını temizler.", laneAdvantage: "Erken invade etkili.", watchOut: "Shaco clone R aldatmacası.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    soloQueueCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Shaco için en iyi counter.", laneAdvantage: "Ward hakimiyeti + invade.", watchOut: "Shaco solo carry potansiyeli yüksek.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Warwick", difficulty: "easy", tier: "A", reasonWhy: "Passive Shaco'yu her zaman görür.", laneAdvantage: "Duel avantajı.", watchOut: "Shaco clone öldürmek yanlışsa çalıştığını anlarsın.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    tips: ["Shaco JitB tuzaklarını control ward ile temizle.", "Shaco R clone'unu öldürmek için — gerçeği HP'den anlarsın.", "Shaco Level 2'de backstab kritik, arkandan yaklaşmasına izin verme."],
    patchNote: NOTE,
  },

  "Vi": {
    topCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Lee Sin erken duel avantajı ile Vi'yi geride bırakır.", laneAdvantage: "Ward-hop mobility Vi'ye karşı üstün.", watchOut: "Vi R durdurulmaz CC'dir.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Rammus", difficulty: "easy", tier: "A", reasonWhy: "Zırh Vi'nin tüm AD hasarını absorbe eder.", laneAdvantage: "Taunt + thornmail Vi'ye karşı.", watchOut: "Vi R durdurulmaz engage.", buildHint: "Sunfire Aegis, Thornmail" },
      { champion: "Amumu", difficulty: "medium", tier: "A", reasonWhy: "AoE team fight Vi'nin single-target baskısını ezer.", laneAdvantage: "Amumu R AoE team fight belirleyicidir.", watchOut: "Vi R Vi'yi follow-up için kullan.", buildHint: "Sunfire Aegis, Frozen Heart" },
    ],
    easyCounters: [
      { champion: "Rammus", difficulty: "easy", tier: "A", reasonWhy: "En kolay Vi counter'ı.", laneAdvantage: "Zırh her duel kazandırır.", watchOut: "Vi R durdurulmaz, flash'ını sakla.", buildHint: "Sunfire Aegis, Thornmail" },
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Erken baskı Vi için zordur.", laneAdvantage: "Camp hakimiyeti.", watchOut: "Vi R ile her yerden engage.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    soloQueueCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Vi'ye en iyi karşı çıkar.", laneAdvantage: "Erken presyon.", watchOut: "Vi R durdurulmaz, CC ile cevap ver.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Amumu", difficulty: "easy", tier: "A", reasonWhy: "AoE CC Vi'nin single-target oyununu geçersiz kılar.", laneAdvantage: "Team fight belirleyicidir.", watchOut: "Vi R follow-up için değerli.", buildHint: "Sunfire Aegis, Abyssal Mask" },
    ],
    tips: ["Vi R durdurulmaz CC — Janna gibi knockback ile engage öncesi kes.", "Vi Q charge süresinde CC kullan.", "Vi E empowered Q yakın dövüşte çok yüksek hasar verir."],
    patchNote: NOTE,
  },

  "Viego": {
    topCounters: [
      { champion: "Warwick", difficulty: "medium", tier: "S", reasonWhy: "Passive Viego'nun düşük HP avantajını görür.", laneAdvantage: "Healing sustain duel avantajı.", watchOut: "Viego W mist walk gizlenme sürpriz yapar.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Lee Sin", difficulty: "medium", tier: "A", reasonWhy: "Erken invade Viego'nun possession farm'ını engeller.", laneAdvantage: "Erken camp hakimiyeti.", watchOut: "Viego possession ile buff alabilir.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Graves", difficulty: "medium", tier: "A", reasonWhy: "Burst Viego'yu camp'larında yakalar.", laneAdvantage: "Camp hızı üstündür.", watchOut: "Viego possession ful CC.", buildHint: "Kraken Slayer, Lord Dominik's Regards" },
    ],
    easyCounters: [
      { champion: "Warwick", difficulty: "easy", tier: "S", reasonWhy: "En kolay Viego counter'ı.", laneAdvantage: "Passive Viego'yu izler.", watchOut: "Viego W stealth sürpriz.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Lee Sin", difficulty: "medium", tier: "A", reasonWhy: "Erken baskı Viego'yu durdurur.", laneAdvantage: "Invade etkili.", watchOut: "Viego possession çok güçlüdür.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    soloQueueCounters: [
      { champion: "Warwick", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da Viego için en iyi counter.", laneAdvantage: "Passive her zaman güncelleme.", watchOut: "Viego possession oyunu tamamen değiştirir.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Lee Sin", difficulty: "medium", tier: "A", reasonWhy: "Erken agresiflik Viego'yu boğar.", laneAdvantage: "Camp hakimiyeti.", watchOut: "Viego possession takım arkadaşını öldürünce.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    tips: ["Viego possession'u kesmek için CC kullan — possessing biterken CC.", "Viego W stealth giriş yönünü takip et.", "Viego'ya karşı grupta dur, possession için hedef verme."],
    patchNote: NOTE,
  },

  "Warwick": {
    topCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Lee Sin erken invade Warwick'in sustain farm'ını bozar.", laneAdvantage: "Ward-hop duel Warwick'e karşı üstündür.", watchOut: "Warwick R durdurulmaz CC.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Graves", difficulty: "medium", tier: "A", reasonWhy: "Burst Warwick'in healing sustain'ine karşı hızlı öldürür.", laneAdvantage: "Smoke Screen Warwick'in W passive'ini kısıtlar.", watchOut: "Warwick R Graves'i durdurur.", buildHint: "Kraken Slayer, Lord Dominik's Regards" },
      { champion: "Hecarim", difficulty: "medium", tier: "A", reasonWhy: "Hız avantajı Warwick'i geri bırakır.", laneAdvantage: "Objective'lere önce ulaşır.", watchOut: "Warwick R Hecarim'i durdurur.", buildHint: "Trinity Force, Sterak's Gage" },
    ],
    easyCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "En etkili Warwick counter'ı.", laneAdvantage: "Erken invade.", watchOut: "Warwick R durdurulmaz.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Graves", difficulty: "easy", tier: "A", reasonWhy: "Burst Warwick sustain'ini bypass eder.", laneAdvantage: "Hızlı camp.", watchOut: "Warwick R sürpriz.", buildHint: "Kraken Slayer, Collector" },
    ],
    soloQueueCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Warwick için en iyi counter.", laneAdvantage: "Erken presyon.", watchOut: "Warwick R her yerden gelir.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Graves", difficulty: "medium", tier: "A", reasonWhy: "Burst Warwick için zorlayıcıdır.", laneAdvantage: "Camp hızı üstündür.", watchOut: "Warwick R CC ile yanıt ver.", buildHint: "Kraken Slayer, Lord Dominik's Regards" },
    ],
    tips: ["Warwick W passive düşük HP'de hızlanır, izin verme.", "Warwick R durdurulmaz CC'dir, gruba girmeden önce keser.", "Warwick geç oyunda güçlüdür, erken önde olmak şart."],
    patchNote: NOTE,
  },

  "Xin Zhao": {
    topCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Erken duel avantajı Xin'i geride bırakır.", laneAdvantage: "Ward-hop mobility Xin'den üstündür.", watchOut: "Xin Zhao R knockback tehlikelidir.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Rammus", difficulty: "easy", tier: "A", reasonWhy: "Zırh Xin'in AD hasarını absorbe eder.", laneAdvantage: "Taunt + thornmail Xin'e karşı.", watchOut: "Xin R knockback Rammus'u durduramaz.", buildHint: "Sunfire Aegis, Thornmail" },
      { champion: "Warwick", difficulty: "easy", tier: "A", reasonWhy: "Sustain healing Xin'in burst'üne dayanır.", laneAdvantage: "Her duel Warwick kazanır.", watchOut: "Xin E thrust + R combo ani burst.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    easyCounters: [
      { champion: "Rammus", difficulty: "easy", tier: "A", reasonWhy: "Xin için en kolay counter'dır.", laneAdvantage: "Zırh her duel kazandırır.", watchOut: "Xin R knockback Rammus'u çıkarır.", buildHint: "Sunfire Aegis, Frozen Heart" },
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Erken baskı Xin'i geride bırakır.", laneAdvantage: "Camp hakimiyeti.", watchOut: "Xin erken güçlüdür.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    soloQueueCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Xin'e en iyi karşı çıkar.", laneAdvantage: "Erken agresiflik.", watchOut: "Xin erken kill alırsa snowball.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Warwick", difficulty: "easy", tier: "A", reasonWhy: "Sustain Xin'in burst'üne her zaman dayanır.", laneAdvantage: "Duel avantajı.", watchOut: "Xin R knockback Warwick'i çıkarır.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    tips: ["Xin W empowered heal trade'leri uzatır.", "Xin R knockback grubunu ayırır, grupta dur.", "Xin erken güçlüdür ama geç oyun orta seviyedir."],
    patchNote: NOTE,
  },

  "Zac": {
    topCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Erken invade Zac'ın slow clear'ını bozar.", laneAdvantage: "Ward-hop Zac'ın E engage'inden kaçar.", watchOut: "Zac R bloop AoE CC team fight'ta belirleyicidir.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Hecarim", difficulty: "medium", tier: "A", reasonWhy: "Hız avantajı Zac'ın yavaş clear'ını geride bırakır.", laneAdvantage: "Objective'lere önce ulaşır.", watchOut: "Zac R AoE CC tehlikelidir.", buildHint: "Trinity Force, Sterak's Gage" },
      { champion: "Graves", difficulty: "medium", tier: "A", reasonWhy: "Burst Zac'ı camp'larında yakalar.", laneAdvantage: "Camp temizleme üstündür.", watchOut: "Zac E gapclose + R CC.", buildHint: "Kraken Slayer, Lord Dominik's Regards" },
    ],
    easyCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "En kolay Zac counter'ı.", laneAdvantage: "Erken invade.", watchOut: "Zac R AoE CC büyük tehdit.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Graves", difficulty: "easy", tier: "A", reasonWhy: "Burst Zac'ı hızlı temizler.", laneAdvantage: "Camp hızı üstündür.", watchOut: "Zac passive 'yırtık parça'ları öldür.", buildHint: "Kraken Slayer, Collector" },
    ],
    soloQueueCounters: [
      { champion: "Lee Sin", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Zac'a en iyi karşı çıkar.", laneAdvantage: "Erken presyon.", watchOut: "Zac R AoE team fight kazandırır.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Hecarim", difficulty: "medium", tier: "A", reasonWhy: "Hız avantajı Zac'ı geride bırakır.", laneAdvantage: "Objective hızı.", watchOut: "Zac R AoE CC.", buildHint: "Trinity Force, Sterak's Gage" },
    ],
    tips: ["Zac passive yırtık parçalarını öldür, revive edilmesin.", "Zac E gapclose uzak menzillidir, ward koy.", "Zac R AoE CC team fight belirleyicidir, ward ile pozisyon al."],
    patchNote: NOTE,
  },
};
