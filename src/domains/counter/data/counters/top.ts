import type { GeneralCounterResult } from "../../types/counter.types";

type RoleData = Omit<GeneralCounterResult, "champion" | "role" | "generatedAt">;

const NOTE = "Bu veriler manuel olarak girilmiştir. Patch güncellemelerini yansıtmayabilir.";

export const TOP_COUNTERS: Record<string, RoleData> = {
  "Aatrox": {
    topCounters: [
      { champion: "Fiora", difficulty: "hard", tier: "S", reasonWhy: "Riposte becerisi Aatrox'un Q knockup'ını parry ederek tüm combo'yu iptal eder.", laneAdvantage: "Vital sistemi Aatrox'un yüksek HP'sini fırsata çevirir.", watchOut: "Q3 knockup zamanlamasını ezberle.", buildHint: "Trinity Force, Ravenous Hydra" },
      { champion: "Camille", difficulty: "medium", tier: "A", reasonWhy: "True damage + W shield ile trade avantajı sağlar.", laneAdvantage: "E hook köşeye sıkıştırır.", watchOut: "Aatrox passive healing yüksektir, trade'leri kısa tut.", buildHint: "Trinity Force, Sterak's Gage" },
      { champion: "Quinn", difficulty: "medium", tier: "A", reasonWhy: "Menzil avantajı ile Aatrox'a yaklaşma fırsatı vermez.", laneAdvantage: "Vault + blind Q zincirini keser.", watchOut: "W kan havuzu immobilize eder, uzak dur.", buildHint: "Kraken Slayer, Mortal Reminder" },
    ],
    easyCounters: [
      { champion: "Malphite", difficulty: "easy", tier: "A", reasonWhy: "Zırh pasifi Aatrox'un AD hasarını azaltır.", laneAdvantage: "Passive kalkan her wave'de yenilenir.", watchOut: "Aatrox E knockback wave clear'ı geciktirir.", buildHint: "Frozen Heart, Sunfire Aegis" },
      { champion: "Garen", difficulty: "easy", tier: "B", reasonWhy: "Silence Q zincirini keser, sustain trade'leri dengeler.", laneAdvantage: "Q silence + spin yüksek hasar.", watchOut: "Aatrox healing uzun trade'leri riskli yapar.", buildHint: "Stridebreaker, Mortal Reminder" },
    ],
    soloQueueCounters: [
      { champion: "Fiora", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Aatrox'u en güvenilir counter'layan şampiyondur.", laneAdvantage: "Vital mechanic sürekli baskı oluşturur.", watchOut: "Aatrox R'da kaçmayı planla.", buildHint: "Trinity Force, Ravenous Hydra" },
      { champion: "Quinn", difficulty: "medium", tier: "A", reasonWhy: "Kite stili Aatrox'un sustain avantajını etkisiz kılar.", laneAdvantage: "R roam gücü yüksek.", watchOut: "Aatrox gank için iyi hedef, ward koy.", buildHint: "Kraken Slayer, Mortal Reminder" },
    ],
    tips: ["W kan havuzu aktifken hareket et, kök vurmasına izin verme.", "Q3 knockup anında geri çekil.", "Aatrox R'da healing çok artar, mümkünse dövüşü bırak."],
    patchNote: NOTE,
  },

  "Camille": {
    topCounters: [
      { champion: "Malphite", difficulty: "easy", tier: "S", reasonWhy: "Zırh stack'i Camille'in AD hasarını sıfırlar, R team fight belirleyicidir.", laneAdvantage: "Passive kalkan + yüksek zırh ile her trade kazanılır.", watchOut: "Camille E ile Malphite'ın engage'inden kaçabilir.", buildHint: "Frozen Heart, Sunfire Aegis" },
      { champion: "Darius", difficulty: "medium", tier: "A", reasonWhy: "Pull + bleed stack Camille'in kite stilini bozar.", laneAdvantage: "E pull Camille'in W konumlanmasını iptal eder.", watchOut: "Camille W true damage ile Darius'u bitirebilir.", buildHint: "Stridebreaker, Sterak's Gage" },
      { champion: "Renekton", difficulty: "medium", tier: "A", reasonWhy: "Erken stun + burst Camille'in skale sürecini engeller.", laneAdvantage: "W stun Camille'i yerinde kilitler.", watchOut: "Camille E geri kaçmasına olanak sağlar.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    easyCounters: [
      { champion: "Malphite", difficulty: "easy", tier: "S", reasonWhy: "Zırh en kolay ve etkili Camille counter'ıdır.", laneAdvantage: "Her 1v1 trade'de Malphite kazanır.", watchOut: "Camille E ile Malphite ult'ını aşabilir.", buildHint: "Frozen Heart, Gargoyle Stoneplate" },
      { champion: "Garen", difficulty: "easy", tier: "B", reasonWhy: "Silence Camille'in Q zincirini keser.", laneAdvantage: "Q silence + W spin hasar yüksek.", watchOut: "Camille true damage W görmezden gelinemez.", buildHint: "Stridebreaker, Mortal Reminder" },
    ],
    soloQueueCounters: [
      { champion: "Malphite", difficulty: "easy", tier: "S", reasonWhy: "Camille'i en kolay ve güvenli counter'layan şampiyondur.", laneAdvantage: "Lane'i kazanmak garantidir.", watchOut: "Camille erken avantaj almaya çalışır.", buildHint: "Frozen Heart, Warmog's Armor" },
      { champion: "Renekton", difficulty: "medium", tier: "A", reasonWhy: "Erken agresiflik Camille'in snowball'unu durdurur.", laneAdvantage: "Stun combo erken kill fırsatı yaratır.", watchOut: "Camille 2 item sonrası duel kazanabilir.", buildHint: "Ravenous Hydra, Black Cleaver" },
    ],
    tips: ["Camille W'sinin true damage yarıçapının dışında dur.", "Camille'in E kancasını görmezden gelmek ölüme götürür.", "Camille passive shield yenilendiğinde trade başlatır, zamanla."],
    patchNote: NOTE,
  },

  "Cho'Gath": {
    topCounters: [
      { champion: "Fiora", difficulty: "medium", tier: "S", reasonWhy: "Fiora vitals Cho'Gath'ın yüksek HP'sini fırsata çevirir, true damage Feast stack'ini geçersiz kılar.", laneAdvantage: "Vital hasar + Riposte silence combo güçlü.", watchOut: "Cho'Gath silence + knockup combo fırsatçıdır.", buildHint: "Trinity Force, Ravenous Hydra" },
      { champion: "Quinn", difficulty: "medium", tier: "A", reasonWhy: "Menzil avantajı Cho'Gath'ın yaklaşmasını engeller.", laneAdvantage: "Vault blind Cho'Gath'ın AA hasarını keser.", watchOut: "Cho'Gath R tek hedef için öldürücüdür.", buildHint: "Kraken Slayer, Mortal Reminder" },
      { champion: "Vayne", difficulty: "hard", tier: "A", reasonWhy: "True damage pasifi Cho'Gath'ın yüksek HP'sini bypass eder.", laneAdvantage: "Kite ile Cho'Gath'ın Rupture'ını kolayca aşar.", watchOut: "Cho'Gath'ın flash Rupture menzilini tahmin etme.", buildHint: "Kraken Slayer, Guinsoo's Rageblade" },
    ],
    easyCounters: [
      { champion: "Teemo", difficulty: "easy", tier: "A", reasonWhy: "Blind Cho'Gath'ın AA tabanlı zone kontrolünü devre dışı bırakır.", laneAdvantage: "Güvenli poke Cho'Gath'ı erken eritir.", watchOut: "Cho'Gath silence Teemo'yu yakalar.", buildHint: "Liandry's Anguish, Shadowflame" },
      { champion: "Gnar", difficulty: "easy", tier: "B", reasonWhy: "Menzil farkı Cho'Gath'a karşı güvenli poke sağlar.", laneAdvantage: "Mini Gnar poke ile Cho'Gath'ı zayıf tutar.", watchOut: "Cho'Gath knockup Mega Gnar dönüşünü kesebilir.", buildHint: "Kraken Slayer, Frozen Heart" },
    ],
    soloQueueCounters: [
      { champion: "Quinn", difficulty: "medium", tier: "A", reasonWhy: "Solo queue'da Cho'Gath'ı en güvenilir ezeyen kite şampiyonudur.", laneAdvantage: "R roam ile map baskısı uygular.", watchOut: "Cho'Gath R one-shot tehdidi her zaman vardır.", buildHint: "Kraken Slayer, Collector" },
      { champion: "Vayne", difficulty: "medium", tier: "A", reasonWhy: "True damage geç oyunda Cho'Gath'ı tamamen ezer.", laneAdvantage: "Kite stili gank açısını ortadan kaldırır.", watchOut: "Vayne erken oyunda zayıf, pasif oyna.", buildHint: "Kraken Slayer, Blade of The Ruined King" },
    ],
    tips: ["Cho'Gath'ın Rupture menzilini ezberle, Q flash ihtimalini unutma.", "Cho'Gath silence + knockup combo'su için duvar arkasında dur.", "Feast stack'ini yükseltmeden önce Cho'Gath'ı baskıla."],
    patchNote: NOTE,
  },

  "Darius": {
    topCounters: [
      { champion: "Quinn", difficulty: "hard", tier: "S", reasonWhy: "Menzilli ataklara Darius yaklaşamaz, Vault+blind tüm kit'ini keser.", laneAdvantage: "Darius'a hiç yaklaşamaz, güvenli poke ile chunk atar.", watchOut: "Gank geldiğinde dikkat et.", buildHint: "Kraken Slayer, Mortal Reminder" },
      { champion: "Kennen", difficulty: "medium", tier: "A", reasonWhy: "Menzilli poke ve stun Darius'u nötralize eder.", laneAdvantage: "Güvenli uzak mesafe poke.", watchOut: "Darius flash Q olduğunda daha geri dur.", buildHint: "Riftmaker, Zhonya's Hourglass" },
      { champion: "Vayne", difficulty: "hard", tier: "A", reasonWhy: "True damage pasifi Darius'un yüksek HP'sini bypass eder.", laneAdvantage: "Kite Darius'un tüm kit'ini geçersiz kılar.", watchOut: "Flash+E'ye karşı dikkatli ol.", buildHint: "Kraken Slayer, Guinsoo's Rageblade" },
    ],
    easyCounters: [
      { champion: "Garen", difficulty: "easy", tier: "B", reasonWhy: "Silence Darius'un Q bleed'ini engeller.", laneAdvantage: "Q silence + hızlı spin trade cycle.", watchOut: "Darius 5 stack bleed varken trade etme.", buildHint: "Stridebreaker, Mortal Reminder" },
      { champion: "Fiora", difficulty: "medium", tier: "A", reasonWhy: "Riposte Darius'un W pull'unu parry edebilir.", laneAdvantage: "Vital mechanic ile Darius'un yüksek HP'si avantaj olur.", watchOut: "Darius E pull menzilinin dışında dur.", buildHint: "Trinity Force, Ravenous Hydra" },
    ],
    soloQueueCounters: [
      { champion: "Teemo", difficulty: "easy", tier: "A", reasonWhy: "Blind Darius'un AA tabanlı kit'ini devre dışı bırakır.", laneAdvantage: "Darius menzil dışında zehir poke.", watchOut: "Darius flash E menzil dışındayken bile yakalayabilir.", buildHint: "Liandry's Anguish, Shadowflame" },
      { champion: "Quinn", difficulty: "medium", tier: "S", reasonWhy: "Darius'u en güvenli counter'layan şampiyondur.", laneAdvantage: "Hiç yaklaşmasına gerek yok.", watchOut: "Gank açısında Q'ya yakalanma.", buildHint: "Kraken Slayer, Collector" },
    ],
    tips: ["Darius'un Q dış kenarı bleed vermez, iç dairede dur.", "Bleed 5 stack dolmadan trade bitir.", "Darius pull range ~475 — bu mesafenin dışında dur."],
    patchNote: NOTE,
  },

  "Fiora": {
    topCounters: [
      { champion: "Malphite", difficulty: "medium", tier: "A", reasonWhy: "Zırh Fiora'nın AD hasarını azaltır, slow + poke Fiora'yı zorlar.", laneAdvantage: "Her trade Malphite'ın lehine.", watchOut: "Fiora Riposte ile Malphite ult'ını parry edebilir.", buildHint: "Frozen Heart, Iceborn Gauntlet" },
      { champion: "Teemo", difficulty: "medium", tier: "A", reasonWhy: "Blind Fiora'nın AA + Q chain'ini devre dışı bırakır.", laneAdvantage: "Kite poke ile Fiora lane'de zayıflar.", watchOut: "Fiora Riposte blind'ı geçersiz kılabilir.", buildHint: "Liandry's Anguish, Shadowflame" },
      { champion: "Pantheon", difficulty: "medium", tier: "A", reasonWhy: "W kalkanı Fiora'nın Q saldırısını bloklar.", laneAdvantage: "Stun + burst Fiora'yı beklenmedik anda vurur.", watchOut: "Fiora Riposte ile Pantheon W'sini parry eder.", buildHint: "Trinity Force, Sterak's Gage" },
    ],
    easyCounters: [
      { champion: "Malphite", difficulty: "easy", tier: "A", reasonWhy: "Zırh en kolay Fiora counter'ıdır.", laneAdvantage: "Passive kalkan + zırh Fiora'yı zorlar.", watchOut: "Fiora vital damage Malphite için tehlikelidir.", buildHint: "Frozen Heart, Thornmail" },
      { champion: "Garen", difficulty: "easy", tier: "B", reasonWhy: "Silence Fiora'nın Q spam'ini keser.", laneAdvantage: "Q silence + W spin trade.", watchOut: "Fiora Riposte Garen silence'ını parry eder.", buildHint: "Stridebreaker, Mortal Reminder" },
    ],
    soloQueueCounters: [
      { champion: "Malphite", difficulty: "easy", tier: "A", reasonWhy: "Solo queue'da güvenli ve etkili Fiora counter'ı.", laneAdvantage: "Zırh stack ile sürekli trade avantajı.", watchOut: "Fiora vitals çok yüksek hasar verir.", buildHint: "Frozen Heart, Warmog's Armor" },
      { champion: "Teemo", difficulty: "medium", tier: "A", reasonWhy: "Blind Fiora'nın kit'ini nötralize eder.", laneAdvantage: "Kite poke ile Fiora'yı eritir.", watchOut: "Fiora Riposte'a dikkat, zamanlamasını bil.", buildHint: "Liandry's Anguish, Void Staff" },
    ],
    tips: ["Fiora'nın Riposte animasyonunu öğren, zaten çektiğinde trade'den çekil.", "Vital konumları tahmin edilebilir, doğru yönden yaklaş.", "Fiora passive kalkan ile her trade'i kazanır, cooldown'ı takip et."],
    patchNote: NOTE,
  },

  "Garen": {
    topCounters: [
      { champion: "Quinn", difficulty: "hard", tier: "S", reasonWhy: "Menzil avantajı Garen'ın yaklaşmasını tamamen engeller.", laneAdvantage: "Blind + kite Garen'ı eridir.", watchOut: "Garen Q silence + speed boost ile yaklaşabilir.", buildHint: "Kraken Slayer, Mortal Reminder" },
      { champion: "Vayne", difficulty: "medium", tier: "A", reasonWhy: "True damage pasifi Garen'ın yüksek HP'sini bypass eder.", laneAdvantage: "Kite ile Garen hiç yaklaşamaz.", watchOut: "Garen Q speed boost + E silence tehlikelidir.", buildHint: "Kraken Slayer, Guinsoo's Rageblade" },
      { champion: "Teemo", difficulty: "medium", tier: "A", reasonWhy: "Blind Garen'ın AA + spin hasarını azaltır, zehir ile eritir.", laneAdvantage: "Güvenli poke ve kaçış.", watchOut: "Garen'ın speed boost Teemo'yu yakalayabilir.", buildHint: "Liandry's Anguish, Shadowflame" },
    ],
    easyCounters: [
      { champion: "Quinn", difficulty: "easy", tier: "S", reasonWhy: "Garen'ın en kolay counter'ı.", laneAdvantage: "Hiç yaklaşmasına izin verme.", watchOut: "Garen'ın silence + ult tehlikelidir.", buildHint: "Kraken Slayer, Rapid Firecannon" },
      { champion: "Teemo", difficulty: "easy", tier: "A", reasonWhy: "Blind + kite + mushroom Garen için kabus.", laneAdvantage: "Zehir DoT uzun trade'leri kazandırır.", watchOut: "Garen Q speed sonrası yakalayabilir.", buildHint: "Liandry's Anguish, Shadowflame" },
    ],
    soloQueueCounters: [
      { champion: "Vayne", difficulty: "medium", tier: "A", reasonWhy: "Geç oyunda Garen'ı ezer.", laneAdvantage: "True damage tüm tank build'i bypass eder.", watchOut: "Vayne erken zayıf, pasif oyna.", buildHint: "Kraken Slayer, Blade of The Ruined King" },
      { champion: "Teemo", difficulty: "easy", tier: "A", reasonWhy: "Solo queue'da Garen'ı en kolay baskılayan şampiyondur.", laneAdvantage: "Mantar tuzakları lane hakimiyeti kurar.", watchOut: "Garen'ın ult savaşta aniden gelir.", buildHint: "Liandry's Anguish, Demonic Embrace" },
    ],
    tips: ["Garen'ın W'si aktifken trade'den çekil, zırh + MR çok artar.", "Garen silence menzilinden uzak dur, yaklaşımını gör.", "Garen ult düşük HP'de en tehlikelidir, sağlıklıyken trade yap."],
    patchNote: NOTE,
  },

  "Gnar": {
    topCounters: [
      { champion: "Malphite", difficulty: "medium", tier: "S", reasonWhy: "Zırh stack'i Gnar'ın hem Mini hem Mega AD hasarını absorbe eder.", laneAdvantage: "Passive kalkan + yüksek zırh ile kazanır.", watchOut: "Gnar Mega form AoE stun + R fırlatma tehlikelidir.", buildHint: "Frozen Heart, Sunfire Aegis" },
      { champion: "Renekton", difficulty: "medium", tier: "A", reasonWhy: "Stun combo Gnar'ın kite stilini bozar, erken baskı çok güçlü.", laneAdvantage: "Erken seviyede Gnar'ı öldürebilir.", watchOut: "Gnar Mega form Renekton'u fırlatır.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Darius", difficulty: "medium", tier: "A", reasonWhy: "Pull E Gnar'ı kite menzili dışına çeker, bleed eridir.", laneAdvantage: "E pull + Q bleed combo Gnar için öldürücü.", watchOut: "Gnar Mega form E throw Darius'u duvardan iter.", buildHint: "Stridebreaker, Black Cleaver" },
    ],
    easyCounters: [
      { champion: "Malphite", difficulty: "easy", tier: "S", reasonWhy: "Gnar için en kolay ve etkili counter'dır.", laneAdvantage: "Tüm trade'leri kazanır.", watchOut: "Gnar Mega form zor CC içerir, dikkatli.", buildHint: "Frozen Heart, Thornmail" },
      { champion: "Camille", difficulty: "easy", tier: "A", reasonWhy: "True damage + dash Gnar'ın kite stilini bozar.", laneAdvantage: "E hook Gnar'ı yerinde kilitler.", watchOut: "Gnar Mega form fırlatması Camille E'sini engeller.", buildHint: "Trinity Force, Sterak's Gage" },
    ],
    soloQueueCounters: [
      { champion: "Malphite", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da Gnar'ı en güvenli baskılayan şampiyondur.", laneAdvantage: "R AoE value çok yüksektir.", watchOut: "Gnar Rage yönetimi zor, erken öldür.", buildHint: "Frozen Heart, Warmog's Armor" },
      { champion: "Renekton", difficulty: "medium", tier: "A", reasonWhy: "Erken agresiflik Gnar'ın Rage biriktirmesini engeller.", laneAdvantage: "Erken kill baskısı etkilidir.", watchOut: "Gnar Mega CC'si Renekton'u durdurur.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    tips: ["Gnar Mega forma geçerken AoE stun + R fırlatma için hazırlıklı ol.", "Mini Gnar'ın Boomerang poke'undan uzak dur.", "Gnar Rage dolduğunda agresifleşir, bu anlarda geri çekil."],
    patchNote: NOTE,
  },

  "Irelia": {
    topCounters: [
      { champion: "Renekton", difficulty: "medium", tier: "S", reasonWhy: "Erken stun + burst Irelia'nın E stacking sürecini engeller.", laneAdvantage: "Level 2-3'te Irelia'yı öldürebilir.", watchOut: "Irelia 5 stack sonrası çok güçlü olur, erken öldür.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Malphite", difficulty: "easy", tier: "A", reasonWhy: "Zırh Irelia'nın tüm AD hasarını absorbe eder.", laneAdvantage: "Passive kalkan her E atağına karşı kalkan.", watchOut: "Irelia Q healing stack bitmişken agresif ol.", buildHint: "Frozen Heart, Iceborn Gauntlet" },
      { champion: "Kennen", difficulty: "medium", tier: "A", reasonWhy: "Menzil + stun Irelia'nın melee engage'ini zorlaştırır.", laneAdvantage: "Poke ile Irelia'yı sürekli baskı altında tutar.", watchOut: "Irelia E ile Kennen'e atlayabilir.", buildHint: "Riftmaker, Zhonya's Hourglass" },
    ],
    easyCounters: [
      { champion: "Malphite", difficulty: "easy", tier: "A", reasonWhy: "Zırh Irelia için en kolay counter'dır.", laneAdvantage: "Her trade Malphite lehine.", watchOut: "Irelia E stun aktifken trade etme.", buildHint: "Frozen Heart, Sunfire Aegis" },
      { champion: "Nasus", difficulty: "easy", tier: "B", reasonWhy: "W slow Irelia'nın Q dash'ini etkisiz kılar.", laneAdvantage: "Slow + Q bleed Irelia'yı zorlar.", watchOut: "Irelia erken Nasus'u baskılar.", buildHint: "Frozen Heart, Warmog's Armor" },
    ],
    soloQueueCounters: [
      { champion: "Renekton", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Irelia'yı en güvenilir durdurur.", laneAdvantage: "Erken kill baskısı Irelia'yı geri tutar.", watchOut: "Irelia geç oyunda çok güçlü olur.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Malphite", difficulty: "easy", tier: "A", reasonWhy: "Güvenli ve etkili Irelia counter'ı.", laneAdvantage: "Zırh sürekli trade avantajı sağlar.", watchOut: "Irelia 5 stack sorası all-in tehlikelidir.", buildHint: "Frozen Heart, Warmog's Armor" },
    ],
    tips: ["Irelia'nın 5 stack E'si stun verir, bu anlarda agresif olma.", "Irelia Q CD'si minyon/unit öldürünce sıfırlanır, wave'ini temizle.", "Irelia erken oyunda stack doldurmadan zayıf, Level 1-3'te baskıla."],
    patchNote: NOTE,
  },

  "Jax": {
    topCounters: [
      { champion: "Teemo", difficulty: "hard", tier: "S", reasonWhy: "Blind Jax'ın Q+E AA combo'sunu tamamen keser.", laneAdvantage: "Kite + zehir Jax'a yaklaşma fırsatı vermez.", watchOut: "Jax E'si döndüğünde CC yiyor, atak yapma.", buildHint: "Liandry's Anguish, Shadowflame" },
      { champion: "Malphite", difficulty: "easy", tier: "A", reasonWhy: "Zırh stack Jax'ın AA tabanlı hasarını sıfırlar.", laneAdvantage: "Passive kalkan + yüksek zırh.", watchOut: "Jax E'si magic damage verir, MR de al.", buildHint: "Frozen Heart, Thornmail" },
      { champion: "Quinn", difficulty: "medium", tier: "A", reasonWhy: "Menzil farkı Jax'a yaklaşma fırsatı vermez.", laneAdvantage: "Vault blind Jax'ın tüm combo'sunu iptal eder.", watchOut: "Jax E passive olmayan darbeye counter strike basar.", buildHint: "Kraken Slayer, Mortal Reminder" },
    ],
    easyCounters: [
      { champion: "Teemo", difficulty: "easy", tier: "S", reasonWhy: "Jax'ın en kolay counter'ı.", laneAdvantage: "Blind aktifken Jax hasar yapamaz.", watchOut: "Jax E aktifken atak yapma.", buildHint: "Liandry's Anguish, Void Staff" },
      { champion: "Malphite", difficulty: "easy", tier: "A", reasonWhy: "Zırh Jax'ı etkisiz kılar.", laneAdvantage: "Tüm trade'leri kazanır.", watchOut: "Jax E magic damage içerir.", buildHint: "Frozen Heart, Warmog's Armor" },
    ],
    soloQueueCounters: [
      { champion: "Teemo", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da Jax'ı en kolay ezeyen şampiyondur.", laneAdvantage: "Mantar + kite lane hakimiyeti.", watchOut: "Jax 2 item sonrası Teemo'yu öldürebilir.", buildHint: "Liandry's Anguish, Shadowflame" },
      { champion: "Darius", difficulty: "medium", tier: "A", reasonWhy: "Erken baskı Jax'ın ölçeklenmesini engeller.", laneAdvantage: "E pull Jax'ı yerinde kilitler.", watchOut: "Jax E passive'ı tüm CC'yi sayar.", buildHint: "Stridebreaker, Black Cleaver" },
    ],
    tips: ["Jax E aktifken atak yapma, CC yiyorsun.", "Jax'ın counter strike süresi 2 saniye, bu sürede uzak dur.", "Jax 3 item sonrası durmaz, erken önde olmak şarttır."],
    patchNote: NOTE,
  },

  "Jayce": {
    topCounters: [
      { champion: "Malphite", difficulty: "medium", tier: "S", reasonWhy: "Zırh Jayce'ın tüm Cannon + Hammer hasarını absorbe eder.", laneAdvantage: "Passive kalkan Jayce'ın poke'unu dengeler.", watchOut: "Jayce Cannon modu uzun menzillidir, her zaman ward koy.", buildHint: "Frozen Heart, Iceborn Gauntlet" },
      { champion: "Renekton", difficulty: "medium", tier: "A", reasonWhy: "All-in baskısı Jayce'ın poke stilini bozar.", laneAdvantage: "Stun combo Jayce'ı yerinde kilitler.", watchOut: "Jayce EQ Cannon combo all-in'den kaçabilir.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Irelia", difficulty: "hard", tier: "A", reasonWhy: "Q dash Jayce'ın kite + poke stilini aşar.", laneAdvantage: "Irelia Jayce'a atlayarak engage'i kısar.", watchOut: "Jayce Hammer E knockback Irelia'yı geri iter.", buildHint: "Trinity Force, Sterak's Gage" },
    ],
    easyCounters: [
      { champion: "Malphite", difficulty: "easy", tier: "S", reasonWhy: "Jayce için en kolay counter'dır.", laneAdvantage: "Tüm poke'u passive kalkanla dengeler.", watchOut: "Jayce Cannon Q menzili çok uzundur.", buildHint: "Frozen Heart, Warmog's Armor" },
      { champion: "Darius", difficulty: "easy", tier: "A", reasonWhy: "Bleed + pull Jayce'ın hit-and-run stilini bozar.", laneAdvantage: "E pull sonrası Jayce'ı köşeye sıkıştırır.", watchOut: "Jayce Hammer form knockback Darius'u iter.", buildHint: "Stridebreaker, Black Cleaver" },
    ],
    soloQueueCounters: [
      { champion: "Malphite", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da Jayce'ı en güvenli baskılayan şampiyondur.", laneAdvantage: "R ile team fight belirleyicidir.", watchOut: "Jayce Cannon poke sağlığını aşındırır.", buildHint: "Frozen Heart, Warmog's Armor" },
      { champion: "Renekton", difficulty: "medium", tier: "A", reasonWhy: "Erken agresiflik Jayce'ın poke oyununu bozar.", laneAdvantage: "Stun ile Jayce'ı yakalar.", watchOut: "Jayce Cannon modu'nda uzak dur.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    tips: ["Jayce Cannon modu'nda yaklaşma, EQ combo menzili çok uzundur.", "Jayce Hammer modu'na geçerken kısa CD var, bu anlarda agresif ol.", "Minyon arkasında dur, Jayce Cannon Q minyonu geçemez."],
    patchNote: NOTE,
  },

  "Kayle": {
    topCounters: [
      { champion: "Renekton", difficulty: "medium", tier: "S", reasonWhy: "Erken seviyede Kayle çok zayıftır, Renekton bunu sert cezalandırır.", laneAdvantage: "Level 1-9 tam baskı dönemidir.", watchOut: "Kayle Level 11-16 transformasyonu sonrası güçlenir.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Darius", difficulty: "medium", tier: "A", reasonWhy: "Erken bully Kayle'ın farm yapmasını engeller.", laneAdvantage: "Pull E Kayle'ı kite menzilinden çıkarır.", watchOut: "Kayle ult passive Darius all-in'ini engelleyebilir.", buildHint: "Stridebreaker, Black Cleaver" },
      { champion: "Pantheon", difficulty: "medium", tier: "A", reasonWhy: "Stun + W block Kayle'ın erken zayıf dönemini cezalandırır.", laneAdvantage: "Agresif erken baskı Kayle için kabus.", watchOut: "Kayle Level 6+ ult ile survive eder.", buildHint: "Trinity Force, Sterak's Gage" },
    ],
    easyCounters: [
      { champion: "Renekton", difficulty: "easy", tier: "S", reasonWhy: "Kayle için en kolay ve etkili counter'dır.", laneAdvantage: "Erken öldür, geç oyun gelmesin.", watchOut: "Kayle ult + E menzilli full damage var.", buildHint: "Ravenous Hydra, Black Cleaver" },
      { champion: "Darius", difficulty: "easy", tier: "A", reasonWhy: "Erken baskı Kayle'ı farm'dan keser.", laneAdvantage: "Pull + bleed Kayle'ı eritir.", watchOut: "Kayle ult Darius ult'ını iptal eder.", buildHint: "Stridebreaker, Black Cleaver" },
    ],
    soloQueueCounters: [
      { champion: "Renekton", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da Kayle'ı en iyi durdurur.", laneAdvantage: "Erken kill + snowball kazandırır.", watchOut: "Kayle level 11'e ulaşırsa oyun değişir.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Pantheon", difficulty: "medium", tier: "A", reasonWhy: "Erken baskı + roam Kayle'ı geride bırakır.", laneAdvantage: "R ile global roam gücü yüksek.", watchOut: "Kayle passive hasar erken seviyede bile var.", buildHint: "Trinity Force, Black Cleaver" },
    ],
    tips: ["Kayle Level 1-9 çok zayıf, bu dönemi maksimize et.", "Kayle Level 11 menzilli full damage kazanır, yaklaşık zaman hesapla.", "Kayle ult ally veya kendine atabilir, ult zamanlamasını bekle."],
    patchNote: NOTE,
  },

  "Malphite": {
    topCounters: [
      { champion: "Fiora", difficulty: "medium", tier: "S", reasonWhy: "Vital sistemi Malphite'ın yüksek HP'sini fırsata çevirir.", laneAdvantage: "True damage tüm zırh stack'ini bypass eder.", watchOut: "Malphite Q yavaşlatması Fiora'nın kite'ını engeller.", buildHint: "Trinity Force, Ravenous Hydra" },
      { champion: "Vayne", difficulty: "hard", tier: "S", reasonWhy: "True damage pasifi Malphite'ın HP'sini doğrudan eritir.", laneAdvantage: "Kite stili Malphite'ın melee kit'ini geçersiz kılar.", watchOut: "Malphite Q slow Vayne'i yakalar, uzak dur.", buildHint: "Kraken Slayer, Guinsoo's Rageblade" },
      { champion: "Teemo", difficulty: "medium", tier: "A", reasonWhy: "Poke + zehir Malphite'ın passive kalkanını sürekli kırar.", laneAdvantage: "Güvenli kite ile Malphite hiç yaklaşamaz.", watchOut: "Malphite Q slow + R AoE flash tehlikeli.", buildHint: "Liandry's Anguish, Shadowflame" },
    ],
    easyCounters: [
      { champion: "Vayne", difficulty: "medium", tier: "S", reasonWhy: "En etkili Malphite counter'ı.", laneAdvantage: "True damage tüm tank'ı bypass eder.", watchOut: "Malphite R ani engage yapar, flash hazırla.", buildHint: "Kraken Slayer, Blade of The Ruined King" },
      { champion: "Teemo", difficulty: "easy", tier: "A", reasonWhy: "Poke ile passive kalkanı kırar.", laneAdvantage: "Blind Malphite'ın AA hasarını azaltır.", watchOut: "Malphite R + flash kombinasyonu her yerden gelir.", buildHint: "Liandry's Anguish, Void Staff" },
    ],
    soloQueueCounters: [
      { champion: "Fiora", difficulty: "medium", tier: "S", reasonWhy: "Solo queue'da Malphite'ı en iyi counter'layan şampiyondur.", laneAdvantage: "Vital hasar + Riposte güçlü kombo.", watchOut: "Malphite R + flash bir anda yanında olur.", buildHint: "Trinity Force, Ravenous Hydra" },
      { champion: "Vayne", difficulty: "medium", tier: "S", reasonWhy: "True damage geç oyunda Malphite'ı ezer.", laneAdvantage: "Kite stili Malphite'ı helpless bırakır.", watchOut: "Vayne erken zayıf, pasif oyna.", buildHint: "Kraken Slayer, Guinsoo's Rageblade" },
    ],
    tips: ["Malphite passive kalkanı 10 sn dokunmadan yenilenir, buna izin verme.", "Malphite Q slow aktif, bu sürede onu doğrulayan menzilden kaç.", "Malphite R + flash kombinasyonu çok uzak mesafeden gelir, ward koy."],
    patchNote: NOTE,
  },

  "Mordekaiser": {
    topCounters: [
      { champion: "Olaf", difficulty: "medium", tier: "S", reasonWhy: "Olaf'ın R ult'u Mordekaiser'ın 1v1 death realm'ini tamamen iptal eder.", laneAdvantage: "R aktifken Mordekaiser ult'u anlamsızdır.", watchOut: "Mordekaiser R'ı Olaf R bitmeden kullanabilir.", buildHint: "Trinity Force, Sterak's Gage" },
      { champion: "Vayne", difficulty: "hard", tier: "A", reasonWhy: "True damage death realm içinde de çalışır, Morde'yi ezer.", laneAdvantage: "Kite stili Mordekaiser'ın melee kit'ini bozar.", watchOut: "Death realm içinde Vayne immobile olursa ölür.", buildHint: "Kraken Slayer, Guinsoo's Rageblade" },
      { champion: "Garen", difficulty: "easy", tier: "A", reasonWhy: "Silence + yüksek sustain Mordekaiser'ın DoT kombinasyonunu dengeler.", laneAdvantage: "Q silence Mordekaiser'ın burst combo'sunu keser.", watchOut: "Mordekaiser death realm içinde Garen'ı bitirebilir.", buildHint: "Stridebreaker, Mortal Reminder" },
    ],
    easyCounters: [
      { champion: "Olaf", difficulty: "easy", tier: "S", reasonWhy: "Mordekaiser'ın ult'unu iptal eder, en kolay counter.", laneAdvantage: "R aktivesinde Morde'yi duel eder.", watchOut: "Mordekaiser R'ını Olaf R bitmeden atmaya çalışır.", buildHint: "Trinity Force, Sterak's Gage" },
      { champion: "Garen", difficulty: "easy", tier: "A", reasonWhy: "Silence ve sustain Mordekaiser için sorun.", laneAdvantage: "Q silence tüm ability chain'ini keser.", watchOut: "Morde death realm Garen'ı izole eder.", buildHint: "Stridebreaker, Mortal Reminder" },
    ],
    soloQueueCounters: [
      { champion: "Olaf", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da Mordekaiser'ı en kolay ezeyen şampiyondur.", laneAdvantage: "R ile Morde ult tamamen iptal.", buildHint: "Trinity Force, Sterak's Gage", watchOut: "Morde E shield aktifken trade etme." },
      { champion: "Vayne", difficulty: "medium", tier: "A", reasonWhy: "True damage geç oyunda Morde için tehlikelidir.", laneAdvantage: "Kite ile Morde yaklaşamaz.", watchOut: "Death realm içinde Vayne E duvar yok, konumlan.", buildHint: "Kraken Slayer, Blade of The Ruined King" },
    ],
    tips: ["Mordekaiser R'ına girme, her zaman Olaf R gibi bir out yoksa.", "Morde'nin pasif ruhu öldür, armor + MR alır.", "Morde E shield aktifken trade'den kaçın."],
    patchNote: NOTE,
  },

  "Nasus": {
    topCounters: [
      { champion: "Quinn", difficulty: "hard", tier: "S", reasonWhy: "Menzil avantajı Nasus'un Q stack biriktirmesini engeller.", laneAdvantage: "Blind + kite Nasus'a hiç yaklaşamaz.", watchOut: "Nasus geç oyunda R + slow ile bile Quinn'i yakalar.", buildHint: "Kraken Slayer, Mortal Reminder" },
      { champion: "Teemo", difficulty: "hard", tier: "S", reasonWhy: "Blind Nasus'un Q'sunu defalarca iptal eder, stack birikitiremez.", laneAdvantage: "Mushroom tuzakları + kite Nasus için kabus.", watchOut: "Nasus Wither slow + R ile geç oyunda yakalar.", buildHint: "Liandry's Anguish, Shadowflame" },
      { champion: "Darius", difficulty: "medium", tier: "A", reasonWhy: "Erken baskı Nasus'un rahat stack biriktirmesini engeller.", laneAdvantage: "Pull + bleed stack Nasus'u erken ezer.", watchOut: "Nasus Wither Darius'un all-in'ini yavaşlatır.", buildHint: "Stridebreaker, Black Cleaver" },
    ],
    easyCounters: [
      { champion: "Teemo", difficulty: "easy", tier: "S", reasonWhy: "En kolay Nasus counter'ı.", laneAdvantage: "Blind Q'yu defalarca iptal eder.", watchOut: "Nasus geç oyun güçlenir.", buildHint: "Liandry's Anguish, Void Staff" },
      { champion: "Quinn", difficulty: "medium", tier: "S", reasonWhy: "Nasus'u en etkili durdurur.", laneAdvantage: "Kite ile stack'e izin vermez.", watchOut: "Nasus R büyük sustain sağlar.", buildHint: "Kraken Slayer, Rapid Firecannon" },
    ],
    soloQueueCounters: [
      { champion: "Teemo", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da Nasus'u en kolay ezeyen şampiyondur.", laneAdvantage: "Stack biriktirememesi oyunu kazandırır.", watchOut: "15+ dakika sonra gank yardımı iste.", buildHint: "Liandry's Anguish, Shadowflame" },
      { champion: "Quinn", difficulty: "medium", tier: "S", reasonWhy: "R roam gücü + Nasus baskısı.", laneAdvantage: "R ile haritaya etki ederken Nasus'u zayıf bırakır.", watchOut: "Nasus solo push yapar, teleport'unu takip et.", buildHint: "Kraken Slayer, Mortal Reminder" },
    ],
    tips: ["Nasus'un her Q stack biriktirmesini engelle.", "Nasus Wither slow inanılmaz güçlüdür, 2 saniye hasar yapamazsın.", "Nasus geç oyunla çok büyük hasar verir, erken önde olmak zorundasın."],
    patchNote: NOTE,
  },

  "Quinn": {
    topCounters: [
      { champion: "Irelia", difficulty: "hard", tier: "S", reasonWhy: "Q dash Vault'u aşar, 5 stack E ile Quinn'i anında öldürebilir.", laneAdvantage: "Irelia gap close Quinn'in kite avantajını ortadan kaldırır.", watchOut: "Irelia stack yüksekse Vault kullanma.", buildHint: "Trinity Force, Sterak's Gage" },
      { champion: "Camille", difficulty: "medium", tier: "A", reasonWhy: "E hook Quinn'i kite menzilinin dışına çeker.", laneAdvantage: "True damage Quinn'in kite stiline baskı yapar.", watchOut: "Quinn Vault Camille E'sinden kaçabilir.", buildHint: "Trinity Force, Sterak's Gage" },
      { champion: "Renekton", difficulty: "medium", tier: "A", reasonWhy: "All-in baskısı Quinn'in güvenli poke stilini bozar.", laneAdvantage: "Stun combo Quinn'i yakalar.", watchOut: "Quinn R ile hızlı roam yapar.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    easyCounters: [
      { champion: "Irelia", difficulty: "medium", tier: "S", reasonWhy: "En etkili Quinn counter'ı.", laneAdvantage: "Q dash gap close Quinn için kabus.", watchOut: "Irelia 5 stack olmadan engage etme.", buildHint: "Trinity Force, Sterak's Gage" },
      { champion: "Renekton", difficulty: "easy", tier: "A", reasonWhy: "Erken all-in Quinn'i baskılar.", laneAdvantage: "Stun sürpriz kill yaratır.", watchOut: "Quinn R ile anında kaçar.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    soloQueueCounters: [
      { champion: "Darius", difficulty: "medium", tier: "A", reasonWhy: "Pull E Quinn'i yakalar, sustain trade'leri kazanır.", laneAdvantage: "E pull + bleed Quinn'i yavaşlatır.", watchOut: "Quinn Vault Darius'un baskısından kaçabilir.", buildHint: "Stridebreaker, Black Cleaver" },
      { champion: "Renekton", difficulty: "easy", tier: "A", reasonWhy: "Solo queue'da Quinn'i baskılamak kolayca yapılır.", laneAdvantage: "Erken kill + snowball.", watchOut: "Quinn R roam değeri çok yüksek.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    tips: ["Quinn Vault'u sadece engage'e değil disengage'e de kullanır.", "Quinn R aktifken + azimli pozisyon değiştirmesine izin verme.", "Blind süresi bitince agresif ol."],
    patchNote: NOTE,
  },

  "Renekton": {
    topCounters: [
      { champion: "Malphite", difficulty: "medium", tier: "A", reasonWhy: "Mid-late oyunda Malphite'ın zırh stack'i Renekton'u etkisiz kılar.", laneAdvantage: "Yüksek zırh Renekton trade'lerini dengeler.", watchOut: "Renekton erken seviyede çok güçlü.", buildHint: "Frozen Heart, Iceborn Gauntlet" },
      { champion: "Camille", difficulty: "medium", tier: "A", reasonWhy: "True damage + sustain Renekton'u zorlar.", laneAdvantage: "E hook Renekton'u yerinde kilitler.", watchOut: "Renekton W stun Camille'i durdurur.", buildHint: "Trinity Force, Sterak's Gage" },
      { champion: "Gnar", difficulty: "medium", tier: "A", reasonWhy: "Ranged poke erken oyunda Renekton'u erken zorlar.", laneAdvantage: "Mini Gnar poke Renekton'u chunk eder.", watchOut: "Renekton erken Level 3 all-in Gnar'ı öldürür.", buildHint: "Kraken Slayer, Frozen Heart" },
    ],
    easyCounters: [
      { champion: "Malphite", difficulty: "easy", tier: "A", reasonWhy: "Geç oyunda Renekton için en iyi counter'dır.", laneAdvantage: "Mid-late oyunda tüm trade'leri kazanır.", watchOut: "Renekton erken avantaj almaya çalışır.", buildHint: "Frozen Heart, Warmog's Armor" },
      { champion: "Gnar", difficulty: "easy", tier: "B", reasonWhy: "Ranged poke Renekton'u sürekli zayıf tutar.", laneAdvantage: "Kite ile Renekton'u zorlar.", watchOut: "Renekton Level 2-3 all-in öldürücüdür.", buildHint: "Kraken Slayer, Frozen Heart" },
    ],
    soloQueueCounters: [
      { champion: "Malphite", difficulty: "easy", tier: "A", reasonWhy: "Solo queue'da Renekton'a güvenli karşı çıkabilir.", laneAdvantage: "R team fight belirleyicidir.", watchOut: "Renekton erken seni öldürmeye çalışır.", buildHint: "Frozen Heart, Warmog's Armor" },
      { champion: "Camille", difficulty: "medium", tier: "A", reasonWhy: "True damage Renekton'u duel'de zorlar.", laneAdvantage: "E hook Renekton'u köşeye kıstırır.", watchOut: "Renekton W stun zamanlaması kritik.", buildHint: "Trinity Force, Sterak's Gage" },
    ],
    tips: ["Renekton W stun'u bar dolu olduğunda empowered olur.", "Renekton erken çok güçlü, geç oyun zayıflar.", "Renekton'un Q heal miktar çok, trade'leri kısa tut."],
    patchNote: NOTE,
  },

  "Riven": {
    topCounters: [
      { champion: "Malphite", difficulty: "easy", tier: "S", reasonWhy: "Zırh Riven'ın tüm AD hasarını sıfırlar.", laneAdvantage: "Passive kalkan + yüksek zırh.", watchOut: "Riven Broken Wings dash Malphite'ı aşabilir.", buildHint: "Frozen Heart, Iceborn Gauntlet" },
      { champion: "Renekton", difficulty: "medium", tier: "A", reasonWhy: "Stun Riven'ın dash combo'sunu keser.", laneAdvantage: "W stun + burst Riven'ı yakalar.", watchOut: "Riven shield combo çok hızlı.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Pantheon", difficulty: "medium", tier: "A", reasonWhy: "W block Riven'ın Q dash saldırılarını engeller.", laneAdvantage: "Stun + block combo Riven'ı durdurur.", watchOut: "Riven shield sonrası Q3 knockup tehlikeli.", buildHint: "Trinity Force, Sterak's Gage" },
    ],
    easyCounters: [
      { champion: "Malphite", difficulty: "easy", tier: "S", reasonWhy: "Riven için en kolay counter'dır.", laneAdvantage: "Zırh tüm dashing hasarını absorbe eder.", watchOut: "Riven erken snowball çok güçlüdür.", buildHint: "Frozen Heart, Thornmail" },
      { champion: "Garen", difficulty: "easy", tier: "B", reasonWhy: "Silence Riven'ın tüm ability chain'ini keser.", laneAdvantage: "Q silence sonrası spin.", watchOut: "Riven E shield ani damage almayı önler.", buildHint: "Stridebreaker, Mortal Reminder" },
    ],
    soloQueueCounters: [
      { champion: "Malphite", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da Riven'ı en güvenli durdurur.", laneAdvantage: "Zırh + R ile tüm oyunu kazanır.", watchOut: "Riven erken kill alırsa snowball.", buildHint: "Frozen Heart, Warmog's Armor" },
      { champion: "Renekton", difficulty: "medium", tier: "A", reasonWhy: "Stun Riven combo'sunu bozar.", laneAdvantage: "Erken baskı Riven'ı geride bırakır.", watchOut: "Riven 2 item sonrası güçlü duel verir.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    tips: ["Riven'ın 3 Q Broken Wings + knockup zamanlamasını öğren.", "Riven E shield'ı her 10 sn. bir aktif, cooldown'ı takip et.", "Riven windslash (R2) stun öncesi kullan, daha fazla hasar verir."],
    patchNote: NOTE,
  },

  "Sett": {
    topCounters: [
      { champion: "Darius", difficulty: "medium", tier: "A", reasonWhy: "Bleed stack Sett'in grit shield'ini bypass eder.", laneAdvantage: "E pull Sett'i doğrultusundan çıkarır.", watchOut: "Sett W true damage çok güçlüdür.", buildHint: "Stridebreaker, Black Cleaver" },
      { champion: "Fiora", difficulty: "medium", tier: "A", reasonWhy: "Riposte Sett'in W true damage'ını parry edebilir.", laneAdvantage: "Vital mechanic yüksek HP'sini cezalandırır.", watchOut: "Sett E pull Fiora'yı yakalar.", buildHint: "Trinity Force, Ravenous Hydra" },
      { champion: "Camille", difficulty: "medium", tier: "A", reasonWhy: "True damage Sett'in yüksek HP'sini bypass eder.", laneAdvantage: "Kite stili Sett'in melee kit'ini zorlar.", watchOut: "Sett W true damage Camille'i bitirebilir.", buildHint: "Trinity Force, Sterak's Gage" },
    ],
    easyCounters: [
      { champion: "Malphite", difficulty: "easy", tier: "A", reasonWhy: "Zırh Sett'in AD hasarını absorbe eder.", laneAdvantage: "Passive kalkan Sett'in poke'unu dengeler.", watchOut: "Sett R fırlatması Malphite R'ını tetikleyebilir.", buildHint: "Frozen Heart, Warmog's Armor" },
      { champion: "Garen", difficulty: "easy", tier: "B", reasonWhy: "Silence Sett'in chain'ini keser.", laneAdvantage: "Q silence + W spin.", watchOut: "Sett W true damage bu matchup'ta bile öldürücü.", buildHint: "Stridebreaker, Mortal Reminder" },
    ],
    soloQueueCounters: [
      { champion: "Darius", difficulty: "medium", tier: "A", reasonWhy: "Bleed Sett'in grit shield'ini geçersiz kılar.", laneAdvantage: "E pull + bleed sürekli baskı.", watchOut: "Sett W true damage Darius için tehlikeli.", buildHint: "Stridebreaker, Black Cleaver" },
      { champion: "Malphite", difficulty: "easy", tier: "A", reasonWhy: "Solo queue'da Sett'e güvenli karşı çıkabilir.", laneAdvantage: "R ile team fight belirleyicidir.", watchOut: "Sett R fırlatma engage potansiyeli var.", buildHint: "Frozen Heart, Warmog's Armor" },
    ],
    tips: ["Sett W hem fiziksel hem true damage verir, shield kenarında dur.", "Sett E pull Sett'e doğru çeker, minyonun arkasında dur.", "Sett passive grit shield trade sırasında dolar, uzun trade'lerden kaçın."],
    patchNote: NOTE,
  },

  "Shen": {
    topCounters: [
      { champion: "Darius", difficulty: "medium", tier: "S", reasonWhy: "Bleed + pull Shen'in passive energy shield'ini aşar.", laneAdvantage: "E pull Shen'i sword'suz yakalar.", watchOut: "Shen R global presence tehlikelidir.", buildHint: "Stridebreaker, Black Cleaver" },
      { champion: "Vayne", difficulty: "medium", tier: "A", reasonWhy: "True damage Shen'in yüksek armor'ını bypass eder.", laneAdvantage: "Kite ile Shen'in melee kit'i geçersiz.", watchOut: "Shen R ile aniden yoktan çıkar.", buildHint: "Kraken Slayer, Guinsoo's Rageblade" },
      { champion: "Fiora", difficulty: "medium", tier: "A", reasonWhy: "Vital hasar Shen'in armor stack'ini geçer.", laneAdvantage: "Riposte Shen'in taunt'unu parry eder.", watchOut: "Shen R geri döndüğünde dikkatli ol.", buildHint: "Trinity Force, Ravenous Hydra" },
    ],
    easyCounters: [
      { champion: "Darius", difficulty: "easy", tier: "S", reasonWhy: "Shen'i en kolay baskılayan şampiyondur.", laneAdvantage: "Pull + bleed tüm passive shield'i bypass eder.", watchOut: "Shen R global teleport tehlikelidir.", buildHint: "Stridebreaker, Black Cleaver" },
      { champion: "Quinn", difficulty: "easy", tier: "A", reasonWhy: "Ranged poke Shen'in melee engage'ini engeller.", laneAdvantage: "Blind Shen'in Q chip hasarını iptal eder.", watchOut: "Shen R'ı ne zaman kullandığını takip et.", buildHint: "Kraken Slayer, Mortal Reminder" },
    ],
    soloQueueCounters: [
      { champion: "Darius", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da Shen'i en iyi durdurur.", laneAdvantage: "Lane baskısı çok güçlü.", watchOut: "Shen R global presence her zaman var.", buildHint: "Stridebreaker, Black Cleaver" },
      { champion: "Vayne", difficulty: "medium", tier: "A", reasonWhy: "True damage geç oyunda Shen'i ezer.", laneAdvantage: "Kite stili Shen'i helpless bırakır.", watchOut: "Shen R + taunt combo'suna dikkat.", buildHint: "Kraken Slayer, Guinsoo's Rageblade" },
    ],
    tips: ["Shen R cast süresinde ward koy, taunt bekleme.", "Shen passive Q empowered sword olmadan zayıftır.", "Shen R aktifken başka bir yerde kill avını zorlaştır."],
    patchNote: NOTE,
  },

  "Teemo": {
    topCounters: [
      { champion: "Akali", difficulty: "medium", tier: "S", reasonWhy: "Shroud Teemo'nun blind'ını ve mushroom görüşünü bypass eder.", laneAdvantage: "Shroud içinde tüm mushroom uyarısı devre dışı.", watchOut: "Teemo blind Akali'nin Q hasarını azaltır.", buildHint: "Night Harvester, Shadowflame" },
      { champion: "Renekton", difficulty: "medium", tier: "A", reasonWhy: "All-in baskısı Teemo'nun kite stilini ezer.", laneAdvantage: "Stun + burst Teemo'yu anında öldürür.", watchOut: "Teemo blind + zehir trade avantajı sağlar.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Garen", difficulty: "easy", tier: "A", reasonWhy: "Silence Teemo'nun Q+E combo'sunu keser, sustain ile trade kazanır.", laneAdvantage: "Q silence + speed Teemo'yu yakalar.", watchOut: "Teemo zehiri DoT ile Garen'ı eritir.", buildHint: "Stridebreaker, Mortal Reminder" },
    ],
    easyCounters: [
      { champion: "Garen", difficulty: "easy", tier: "A", reasonWhy: "En kolay Teemo counter'ıdır.", laneAdvantage: "Q silence + W sustain ile kazanır.", watchOut: "Teemo mushroom map hakimiyeti çok değerli.", buildHint: "Stridebreaker, Mortal Reminder" },
      { champion: "Renekton", difficulty: "easy", tier: "A", reasonWhy: "All-in Teemo'yu aşar.", laneAdvantage: "Erken Level 3 all-in Teemo öldürür.", watchOut: "Teemo blind aktifken trade etme.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    soloQueueCounters: [
      { champion: "Renekton", difficulty: "easy", tier: "A", reasonWhy: "Solo queue'da Teemo'yu en iyi durdurur.", laneAdvantage: "Agresif stun combo Teemo'yu öldürür.", watchOut: "Teemo shroom warding çok değerlidir.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Irelia", difficulty: "medium", tier: "A", reasonWhy: "Q dash Teemo'nun kite avantajını ortadan kaldırır.", laneAdvantage: "Irelia dash Teemo'nun kaçmasını engeller.", watchOut: "Teemo blind Irelia'nın Q combo'sunu azaltır.", buildHint: "Trinity Force, Sterak's Gage" },
    ],
    tips: ["Control ward ile Teemo mushroom'larını temizle.", "Teemo'nun blind'ı 1.5 sn sürer, bu sürede hasar verme.", "Teemo mobility'den yoksundur, gap close şampiyonu seç."],
    patchNote: NOTE,
  },

  "Tryndamere": {
    topCounters: [
      { champion: "Malphite", difficulty: "easy", tier: "S", reasonWhy: "Zırh Tryndamere'ın tüm crit hasarını absorbe eder.", laneAdvantage: "Passive kalkan + zırh her trade'de kazanır.", watchOut: "Tryndamere R aktifken öldürülemiyor.", buildHint: "Frozen Heart, Thornmail" },
      { champion: "Pantheon", difficulty: "medium", tier: "A", reasonWhy: "W block Tryndamere'ın kritik saldırılarını engeller.", laneAdvantage: "Stun + sustained hasar Trynda'yı ezer.", watchOut: "Tryndamere R aktifken Pantheon W basman.", buildHint: "Trinity Force, Sterak's Gage" },
      { champion: "Urgot", difficulty: "medium", tier: "A", reasonWhy: "Urgot'ın R execute Tryndamere'ın ult'ını geçersiz kılar.", laneAdvantage: "Ranged poke Trynda'nın melee avantajını engeller.", watchOut: "Tryndamere R bitmeden Urgot R kullan.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    easyCounters: [
      { champion: "Malphite", difficulty: "easy", tier: "S", reasonWhy: "Tryndamere için en kolay counter'dır.", laneAdvantage: "Zırh crit hasarı sıfırlar.", watchOut: "Tryndamere R bittikten sonra öldür.", buildHint: "Frozen Heart, Warmog's Armor" },
      { champion: "Garen", difficulty: "easy", tier: "B", reasonWhy: "Silence Tryndamere'ın E'sini keser, sustain trade kazandırır.", laneAdvantage: "Q silence + spin + sustain.", watchOut: "Tryndamere R aktifken hasar verme.", buildHint: "Stridebreaker, Mortal Reminder" },
    ],
    soloQueueCounters: [
      { champion: "Malphite", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da Tryndamere'ı en güvenli durdurur.", laneAdvantage: "R AoE team fight belirleyicidir.", watchOut: "Tryndamere split push çok güçlüdür.", buildHint: "Frozen Heart, Warmog's Armor" },
      { champion: "Urgot", difficulty: "medium", tier: "A", reasonWhy: "R execute Tryndamere ult'ını geçersiz kılar.", laneAdvantage: "Ranged poke + zırh güçlü matchup.", watchOut: "Tryndamere R bitmeden Urgot R zamanla.", buildHint: "Ravenous Hydra, Sterak's Gage" },
    ],
    tips: ["Tryndamere R biterken veya bittikten sonra öldür.", "Tryndamere ult 5 sn sürer, geri çekil veya CC kullan.", "Tryndamere spin (E) düşük fury ile daha az hasar verir."],
    patchNote: NOTE,
  },

  "Urgot": {
    topCounters: [
      { champion: "Quinn", difficulty: "hard", tier: "S", reasonWhy: "Menzil avantajı Urgot'ın tüm shotgun poke'unu geçersiz kılar.", laneAdvantage: "Vault blind Urgot'ın AA tabanlı kit'ini keser.", watchOut: "Urgot W shield + slow combo Quinn'i yakalar.", buildHint: "Kraken Slayer, Mortal Reminder" },
      { champion: "Vayne", difficulty: "hard", tier: "A", reasonWhy: "True damage Urgot'ın yüksek HP'sini bypass eder.", laneAdvantage: "Kite ile Urgot'ın melee range'ine girmez.", watchOut: "Urgot R execute Vayne'i öldürür.", buildHint: "Kraken Slayer, Guinsoo's Rageblade" },
      { champion: "Fiora", difficulty: "medium", tier: "A", reasonWhy: "Vital hasar + Riposte Urgot'ın W shield'ını parry eder.", laneAdvantage: "True damage Urgot HP'sini cezalandırır.", watchOut: "Urgot R execute Fiora'yı anında öldürür.", buildHint: "Trinity Force, Ravenous Hydra" },
    ],
    easyCounters: [
      { champion: "Quinn", difficulty: "easy", tier: "S", reasonWhy: "Urgot için en kolay counter'dır.", laneAdvantage: "Tüm shotgun range'inin dışında kite yapar.", watchOut: "Urgot R kombosu her zaman tehlikelidir.", buildHint: "Kraken Slayer, Mortal Reminder" },
      { champion: "Teemo", difficulty: "easy", tier: "A", reasonWhy: "Blind Urgot'ın AA tabanlı shotgun hasarını keser.", laneAdvantage: "Kite + zehir Urgot'ı eritir.", watchOut: "Urgot W slow Teemo'yu yakalar.", buildHint: "Liandry's Anguish, Shadowflame" },
    ],
    soloQueueCounters: [
      { champion: "Vayne", difficulty: "medium", tier: "A", reasonWhy: "Solo queue'da Urgot'u geç oyunda ezdiren en iyi seçimdir.", laneAdvantage: "True damage tüm tank'ı bypass eder.", watchOut: "Urgot R execute daima fatal, HP'yi izle.", buildHint: "Kraken Slayer, Guinsoo's Rageblade" },
      { champion: "Quinn", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da Urgot'a karşı en güvenli seçimdir.", laneAdvantage: "R roam + erken baskı.", watchOut: "Urgot slow aktifken Quinn'e yaklaşmayın.", buildHint: "Kraken Slayer, Collector" },
    ],
    tips: ["Urgot W shield aktifken ateş etme, E shotgunlarını bekle.", "Urgot R execute HP yüzdesine göre çalışır, % 25 HP altında yakınında olma.", "Urgot E shotgunlar belirli bir açıda gelir, pozisyon al."],
    patchNote: NOTE,
  },

  "Vayne": {
    topCounters: [
      { champion: "Renekton", difficulty: "medium", tier: "S", reasonWhy: "Stun + burst Vayne'in kite sürecini keser.", laneAdvantage: "Erken agresiflik Vayne'in skale sürecini engeller.", watchOut: "Vayne 2 item sonrası Renekton'u duel eder.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Camille", difficulty: "medium", tier: "A", reasonWhy: "True damage + dash Vayne'in kite stiline baskı yapar.", laneAdvantage: "E hook Vayne'i kite menzilinden çıkarır.", watchOut: "Vayne E duvardan itmesi Camille engage'ini bozar.", buildHint: "Trinity Force, Sterak's Gage" },
      { champion: "Darius", difficulty: "medium", tier: "A", reasonWhy: "Pull E Vayne'i yakalar, bleed stack bitmişken öldürür.", laneAdvantage: "E pull + bleed Vayne için kabus.", watchOut: "Vayne E + kite Darius'u zorlar.", buildHint: "Stridebreaker, Black Cleaver" },
    ],
    easyCounters: [
      { champion: "Renekton", difficulty: "easy", tier: "S", reasonWhy: "Vayne erken için en kolay counter'dır.", laneAdvantage: "Stun + burst Vayne'i anında öldürür.", watchOut: "Vayne 2+ item sonrası çok güçlenir.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Malphite", difficulty: "easy", tier: "A", reasonWhy: "Zırh Vayne için sorun değil ama R CC fark yaratır.", laneAdvantage: "R ile Vayne'i team fight'ta dondurur.", watchOut: "Vayne E duvar Malphite'ı iter.", buildHint: "Frozen Heart, Thornmail" },
    ],
    soloQueueCounters: [
      { champion: "Renekton", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da Vayne'i en iyi durdurur.", laneAdvantage: "Erken kill + snowball kazandırır.", watchOut: "Vayne late game çok güçlü olur.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Darius", difficulty: "medium", tier: "A", reasonWhy: "Pull E Vayne kite'ını bozar.", laneAdvantage: "Bleed + pull Vayne için kabus.", watchOut: "Vayne E duvardan itme Darius'u tehlikeye atar.", buildHint: "Stridebreaker, Black Cleaver" },
    ],
    tips: ["Vayne E ile duvardan iterek stun verir, duvardan uzak dur.", "Vayne invisibility R aktifken Q ile kaybolur.", "Vayne true damage 3 hit + conq, uzun trade'lerden kaçın."],
    patchNote: NOTE,
  },

  "Volibear": {
    topCounters: [
      { champion: "Teemo", difficulty: "hard", tier: "S", reasonWhy: "Blind Volibear'ın AA tabanlı kit'ini devre dışı bırakır.", laneAdvantage: "Kite + blind Volibear'a yaklaşma fırsatı vermez.", watchOut: "Volibear R stun + frenzy Teemo'yu öldürür.", buildHint: "Liandry's Anguish, Shadowflame" },
      { champion: "Quinn", difficulty: "medium", tier: "A", reasonWhy: "Ranged menzil Volibear'ın melee engage'ini engeller.", laneAdvantage: "Vault blind Volibear'ın AA combo'sunu keser.", watchOut: "Volibear Q flip Quinn'i yakalar.", buildHint: "Kraken Slayer, Mortal Reminder" },
      { champion: "Gnar", difficulty: "medium", tier: "A", reasonWhy: "Ranged poke Volibear'ı eriten uygun bir seçim.", laneAdvantage: "Mini Gnar kite Volibear'ı zorlar.", watchOut: "Volibear Q Gnar'ı flip eder.", buildHint: "Kraken Slayer, Frozen Heart" },
    ],
    easyCounters: [
      { champion: "Teemo", difficulty: "easy", tier: "S", reasonWhy: "Volibear için en kolay counter'dır.", laneAdvantage: "Blind + kite tüm trade'leri kazandırır.", watchOut: "Volibear Q flip ani gelir.", buildHint: "Liandry's Anguish, Void Staff" },
      { champion: "Quinn", difficulty: "easy", tier: "A", reasonWhy: "Ranged avantaj Volibear'a karşı güvenli.", laneAdvantage: "Vault ile Volibear flip'inden kaçar.", watchOut: "Volibear Q uzun flip menzili vardır.", buildHint: "Kraken Slayer, Mortal Reminder" },
    ],
    soloQueueCounters: [
      { champion: "Teemo", difficulty: "easy", tier: "S", reasonWhy: "Solo queue'da Volibear'ı en kolay baskılar.", laneAdvantage: "Blind + zehir poke çok etkilidir.", watchOut: "Volibear R tower dive yapar, HP takip et.", buildHint: "Liandry's Anguish, Shadowflame" },
      { champion: "Vayne", difficulty: "medium", tier: "A", reasonWhy: "True damage Volibear'ın yüksek HP'sini ezer.", laneAdvantage: "Kite stili Volibear'ı helpless bırakır.", watchOut: "Volibear Q flip erken oyunda tehlikelidir.", buildHint: "Kraken Slayer, Guinsoo's Rageblade" },
    ],
    tips: ["Volibear Q flip menzilinden uzak dur.", "Volibear R tower altına dive eder, sağlıklıyken dövüş.", "Volibear passive healing çok yüksek, short trade yapmaktan kaçın."],
    patchNote: NOTE,
  },

  "Yasuo": {
    topCounters: [
      { champion: "Malphite", difficulty: "easy", tier: "S", reasonWhy: "Zırh pasifi ve yüksek HP ile Yasuo'nun tüm hasarını absorbe eder.", laneAdvantage: "Her seviyede Yasuo'yu kazanır.", watchOut: "Yasuo E dash ile tower'a dive edebilir.", buildHint: "Frozen Heart, Iceborn Gauntlet" },
      { champion: "Renekton", difficulty: "medium", tier: "A", reasonWhy: "Erken baskı ve stun ile Yasuo'nun snowball'unu engeller.", laneAdvantage: "Level 3'ten itibaren agresif oyna.", watchOut: "Yasuo Level 6 sonrası R combo'suna dikkat.", buildHint: "Ravenous Hydra, Sterak's Gage" },
      { champion: "Garen", difficulty: "easy", tier: "A", reasonWhy: "Silence Yasuo'nun tüm kit'ini keser.", laneAdvantage: "Silence sonrası spin Yasuo için kaçınılmazdır.", watchOut: "Yasuo'nun Windwall arkasında durmasına izin verme.", buildHint: "Stridebreaker, Mortal Reminder" },
    ],
    easyCounters: [
      { champion: "Malphite", difficulty: "easy", tier: "S", reasonWhy: "Top lane Yasuo için en güvenli ve etkili counter'dır.", laneAdvantage: "Lane'i kazanmak garantidir.", watchOut: "Yasuo erken snowball'dan önce bastır.", buildHint: "Frozen Heart, Warmog's Armor" },
      { champion: "Garen", difficulty: "easy", tier: "A", reasonWhy: "Q silence Yasuo'nun kit'ini durdurur.", laneAdvantage: "Sustain + silence trade cycle.", watchOut: "Yasuo E dash tower'a dive potansiyeli.", buildHint: "Stridebreaker, Mortal Reminder" },
    ],
    soloQueueCounters: [
      { champion: "Darius", difficulty: "medium", tier: "A", reasonWhy: "Pull E Yasuo'nun kaçmasını engeller.", laneAdvantage: "E pull + Q combo çok hasar verir.", watchOut: "Yasuo ult combo'suna Darius ult'ını sakla.", buildHint: "Stridebreaker, Trinity Force" },
      { champion: "Malphite", difficulty: "easy", tier: "S", reasonWhy: "Top lane Yasuo için en güvenilir counter'dır.", laneAdvantage: "Team fight'ta R value çok yüksek.", watchOut: "Yasuo erken snowball'u durdur.", buildHint: "Frozen Heart, Warmog's Armor" },
    ],
    tips: ["Zırh item'larını ön planda tut, Yasuo tamamen AD.", "Yasuo'nun Windwall CD'si ~25 sn, bu sürede agresif ol.", "Gank aldığında Yasuo'nun R combo'su için hazır ol."],
    patchNote: NOTE,
  },
};
