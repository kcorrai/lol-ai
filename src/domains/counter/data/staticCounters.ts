import type { Position } from "@/types/common.types";
import type { GeneralCounterResult } from "../types/counter.types";

type StaticCounterData = Omit<GeneralCounterResult, "champion" | "role" | "generatedAt">;

// Hand-curated counter data for the most popular champions.
// To add a new champion: copy an existing block and fill in the data.
// The service checks this map before calling AI — matching entries are served instantly.
// Key format: CHAMPION_NAME (exact, case-sensitive) → role → data.
export const STATIC_COUNTER_DATA: Record<string, Partial<Record<Position, StaticCounterData>>> = {

  Ahri: {
    MIDDLE: {
      topCounters: [
        { champion: "Zed", difficulty: "hard", tier: "S", winRate: 53.1, reasonWhy: "Zed'in gölge mekanikleri Ahri'nin Charm'ından kaçmasını sağlar. 6. seviyeden itibaren Ahri'nin düşük savunmasını cezalandırabilir.", laneAdvantage: "Baskıcı early game ile Ahri'yi sürekli tehdit altında tutar.", watchOut: "Ahri'nin R üç şarjı varken geri çekilmesine izin verme.", buildHint: "Serylda's Grudge, Serpent's Fang", lanePhases: { early: "Even", mid: "Strong", late: "Strong" }, runeAdvice: { keystone: "Electrocute", primaryPath: "Domination", secondaryPath: "Sorcery" } },
        { champion: "Galio", difficulty: "medium", tier: "A", winRate: 52.4, reasonWhy: "Büyü direnci pasifi Ahri'nin hasarını önemli ölçüde azaltır. Galio'nun W ve E'si Ahri'nin Q+Charm combo'sunu engeller.", laneAdvantage: "Ahri'nin poke'ına dayanıklı, R ile takım arkadaşlarına sürekli yardım edebilir.", watchOut: "Ahri haritada gözükmezken dikkatli ol, yan koridorda olabilir.", buildHint: "Locket of the Iron Solari, Zhonya's Hourglass", lanePhases: { early: "Even", mid: "Strong", late: "Strong" }, runeAdvice: { keystone: "Aftershock", primaryPath: "Resolve", secondaryPath: "Inspiration" } },
        { champion: "Kassadin", difficulty: "medium", tier: "A", winRate: 52.8, reasonWhy: "Büyü direnci pasifi sayesinde Ahri'nin combo'sundan az etkilenir. Level 6 sonrası Kassadin, Ahri'nin roam'larını kolayca takip eder.", laneAdvantage: "Erken oyunu savunmacı oynayıp 6. seviyeden sonra avantaj alır.", watchOut: "Charm yemeden pozisyon al; Ahri, Kassadin'i erken seviyede öldürebilir.", buildHint: "Rod of Ages, Zhonya's Hourglass", lanePhases: { early: "Weak", mid: "Even", late: "Strong" }, runeAdvice: { keystone: "Phase Rush", primaryPath: "Sorcery", secondaryPath: "Resolve" } },
      ],
      easyCounters: [
        { champion: "Malzahar", difficulty: "easy", tier: "A", winRate: 54.2, reasonWhy: "Malzahar wave push ile Ahri'yi tower'a mahkum eder ve roam'larını engeller.", laneAdvantage: "E + ult combo'su Ahri'nin kaçış seçeneklerini sıfırlar.", watchOut: "E zaptiye alanı aktifken Ahri'nin menzil dışına çıkmasına izin verme.", buildHint: "Shadowflame, Void Staff", lanePhases: { early: "Even", mid: "Strong", late: "Strong" } },
        { champion: "Lux", difficulty: "easy", tier: "B", winRate: 51.6, reasonWhy: "Uzun menzilli poke ile Ahri'yi sürekli baskı altında tutar, E+Q combo'suyla kill tehdit eder.", laneAdvantage: "Güvenli poke ve wave kontrolü.", watchOut: "Ahri'nin R mobilite avantajını göz önünde bulundur, öne atılma.", buildHint: "Luden's Tempest, Shadowflame", lanePhases: { early: "Even", mid: "Strong", late: "Even" } },
      ],
      soloQueueCounters: [
        { champion: "Veigar", difficulty: "medium", tier: "A", winRate: 52.0, reasonWhy: "Event Horizon (cage) Ahri'nin tüm mobilite seçeneklerini iptal eder, sonsuz Q stacking ile geç oyunda Ahri'yi tek vuruyor.", laneAdvantage: "R'ı kullandıktan sonra cage koyarsan Ahri anında ölür.", watchOut: "6. seviye öncesi agresif Ahri all-in'lerinden kaçın.", buildHint: "Luden's Tempest, Shadowflame", lanePhases: { early: "Weak", mid: "Even", late: "Strong" } },
        { champion: "Sylas", difficulty: "medium", tier: "A", winRate: 51.8, reasonWhy: "Ahri'nin Ultimate'ını çalarak hem kaçış hem kill baskısı kurar. Tank yapıyla Ahri'nin burst'ünü absorbe eder.", laneAdvantage: "Ahri ult kullandıktan sonra agresif ol; ult'ı yokken zayıf.", watchOut: "Ahri sağ ult'larıyla Sylas'tan kaçabilir, her zaman go yapmadan önce ult'ını say.", buildHint: "Trinity Force, Rabadon's Deathcap", lanePhases: { early: "Even", mid: "Strong", late: "Strong" } },
      ],
      tips: ["Ahri'nin üç R şarjını takip et — hepsi bitmişken agresif ol.", "Charm yemekten kaçınmak için minyon arkasında dur.", "Ahri yan koridora roam yapmadan önce ward koy ve takımını uyar."],
      patchNote: "Bu veriler manuel olarak girilmiştir. Patch güncellemelerini yansıtmayabilir.",
    },
  },

  Yasuo: {
    MIDDLE: {
      topCounters: [
        { champion: "Malphite", difficulty: "easy", tier: "S", winRate: 56.3, reasonWhy: "Taş zırhı Yasuo'nun tüm AD hasarını bloke eder. R ile Yasuo'yu anında devre dışı bırakır.", laneAdvantage: "Pasif kalkan ve yüksek zırh ile trade'lerin hepsini kazanır.", watchOut: "Yasuo'nun ult'ını kullanmak için seni havaya attığında Malphite ult'ını harca.", buildHint: "Frozen Heart, Sunfire Aegis", lanePhases: { early: "Strong", mid: "Strong", late: "Strong" }, runeAdvice: { keystone: "Grasp of the Undying", primaryPath: "Resolve", secondaryPath: "Sorcery" } },
        { champion: "Renekton", difficulty: "medium", tier: "A", winRate: 53.8, reasonWhy: "Stun + burst combo'su Yasuo'nun Windwall'ını geçer. Erken agresiflik Yasuo'nun snowball'unu engeller.", laneAdvantage: "Stun ile Yasuo'yu yerinde kilitler, Q combo hasarı çok yüksek.", watchOut: "Yasuo Q'sunu Windwall arkasına saklanarak kullanmaya çalışabilir.", buildHint: "Ravenous Hydra, Sterak's Gage", lanePhases: { early: "Strong", mid: "Strong", late: "Even" }, runeAdvice: { keystone: "Conqueror", primaryPath: "Precision", secondaryPath: "Resolve" } },
        { champion: "Pantheon", difficulty: "medium", tier: "A", winRate: 52.9, reasonWhy: "W CC Yasuo'yu durdurur, Windwall'ı bloke edemez. Erken seviye baskısı Yasuo'yu pasif oynamaya zorlar.", laneAdvantage: "Stun sonrası full combo Yasuo için öldürücü.", watchOut: "Yasuo 3Q sonrası Whirlwind'ine dikkat et.", buildHint: "Trinity Force, Sterak's Gage", lanePhases: { early: "Strong", mid: "Strong", late: "Even" }, runeAdvice: { keystone: "Conqueror", primaryPath: "Precision", secondaryPath: "Domination" } },
      ],
      easyCounters: [
        { champion: "Malphite", difficulty: "easy", tier: "S", winRate: 56.3, reasonWhy: "Zırh stack'i Yasuo'nun tüm hasarını azaltır, R ile team fight'ta instant ult fırsatı oluşturur.", laneAdvantage: "Her trade'i kazanır, push'a zorlar.", watchOut: "Yasuo'nun Windwall'ı Malphite'ın R'ını bloklamaz — güvenle ult kullan.", buildHint: "Frozen Heart, Thornmail", lanePhases: { early: "Strong", mid: "Strong", late: "Strong" } },
        { champion: "Garen", difficulty: "easy", tier: "B", winRate: 51.4, reasonWhy: "Silence Yasuo'nun Q ve E'sini keser, yüksek HP rejenle trade avantajı sağlar.", laneAdvantage: "Q silence sonrası spin ile yüksek hasar.", watchOut: "Yasuo Q3 Whirlwind'i Garen silence'ını beklemeden kullanabilir.", buildHint: "Stridebreaker, Mortal Reminder", lanePhases: { early: "Strong", mid: "Strong", late: "Even" } },
      ],
      soloQueueCounters: [
        { champion: "Annie", difficulty: "easy", tier: "A", winRate: 52.7, reasonWhy: "Stun + burst combo'su Yasuo'yu Windwall kullanamadan öldürür. Tibbers summon Yasuo'yu korkutur.", laneAdvantage: "4 stack stun hazır tutulursa Yasuo anında ölür.", watchOut: "Tibbers aktifken Yasuo'dan uzak dur.", buildHint: "Luden's Tempest, Rabadon's Deathcap", lanePhases: { early: "Strong", mid: "Strong", late: "Even" } },
        { champion: "Renekton", difficulty: "medium", tier: "A", winRate: 53.8, reasonWhy: "Fiziksel hasar ve stun kombinasyonu Windwall'ı geçer, snowball'ı durdurur.", laneAdvantage: "Erken agresiflik şarttır, geç oyunda Yasuo güçlenir.", watchOut: "Yasuo 2 item sonrası çok güçlü olur, erken öldür.", buildHint: "Ravenous Hydra, Sterak's Gage", lanePhases: { early: "Strong", mid: "Strong", late: "Even" } },
      ],
      tips: ["Yasuo'nun Windwall açıkken agresif ol, cooldown'da saldır.", "Minyon wave'ini freeze et, Yasuo CS almakta zorlanır.", "Zırh item'ları önceliklendir — Yasuo tamamen AD çalışır."],
      patchNote: "Bu veriler manuel olarak girilmiştir. Patch güncellemelerini yansıtmayabilir.",
    },
    TOP: {
      topCounters: [
        { champion: "Malphite", difficulty: "easy", tier: "S", winRate: 57.1, reasonWhy: "Zırh pasifi ve yüksek HP ile Yasuo'nun tüm hasarını absorbe eder. R team fight belirleyicisidir.", laneAdvantage: "Her seviyede Yasuo'yu kazanır, trade'den kaçamaz.", watchOut: "Gank açısına dikkat et, Yasuo dive için fırsat kollar.", buildHint: "Frozen Heart, Iceborn Gauntlet", lanePhases: { early: "Strong", mid: "Strong", late: "Strong" }, runeAdvice: { keystone: "Grasp of the Undying", primaryPath: "Resolve", secondaryPath: "Sorcery" } },
        { champion: "Renekton", difficulty: "medium", tier: "A", winRate: 53.2, reasonWhy: "Erken baskı ve stun ile Yasuo'nun snowball'unu engeller.", laneAdvantage: "Level 3'ten itibaren agresif oyna, Yasuo geç oyunda güçlenir.", watchOut: "Yasuo Level 6 sonrası R combo'suna dikkat.", buildHint: "Ravenous Hydra, Sterak's Gage", lanePhases: { early: "Strong", mid: "Strong", late: "Even" }, runeAdvice: { keystone: "Conqueror", primaryPath: "Precision", secondaryPath: "Resolve" } },
        { champion: "Garen", difficulty: "easy", tier: "A", winRate: 53.8, reasonWhy: "Silence Yasuo'nun tüm kit'ini keser, yüksek rejenerasyonla trade avantajı kazanır.", laneAdvantage: "Silence sonrası spin Yasuo için kaçınılmazdır.", watchOut: "Yasuo'nun Windwall arkasında durmasına izin verme.", buildHint: "Stridebreaker, Mortal Reminder", lanePhases: { early: "Strong", mid: "Strong", late: "Even" }, runeAdvice: { keystone: "Grasp of the Undying", primaryPath: "Resolve", secondaryPath: "Precision" } },
      ],
      easyCounters: [
        { champion: "Malphite", difficulty: "easy", tier: "S", winRate: 57.1, reasonWhy: "Top lane'de Yasuo'yu tamamen ezer, zırh her hasar kaynağını sıfırlar.", laneAdvantage: "Passive shield ile minyon hasarından etkilenmez.", watchOut: "Yasuo Windwall Q3 ile seni knockup'layabilir, ona göre konumlan.", buildHint: "Frozen Heart, Gargoyle Stoneplate", lanePhases: { early: "Strong", mid: "Strong", late: "Strong" } },
        { champion: "Garen", difficulty: "easy", tier: "A", winRate: 53.8, reasonWhy: "Q silence Yasuo'nun kit'ini durdurur, yüksek sustain ile lane'i kazanır.", laneAdvantage: "Agresif trade cycle ile Yasuo'yu sürekli geri iter.", watchOut: "Yasuo E dash ile tower'a dive edebilir.", buildHint: "Stridebreaker, Mortal Reminder", lanePhases: { early: "Strong", mid: "Strong", late: "Even" } },
      ],
      soloQueueCounters: [
        { champion: "Darius", difficulty: "medium", tier: "A", winRate: 52.4, reasonWhy: "Yüksek hasar ve pull skill'i Yasuo'nun kaçmasını engeller, her trade kanar.", laneAdvantage: "E pull + Q combo Yasuo'yu kritik hasar vurur.", watchOut: "Yasuo'nun ult combo'suna karşı Darius ult'ını sakla.", buildHint: "Stridebreaker, Trinity Force", lanePhases: { early: "Strong", mid: "Strong", late: "Even" } },
        { champion: "Malphite", difficulty: "easy", tier: "S", winRate: 57.1, reasonWhy: "Top lane Yasuo için en güvenli ve etkili counter'dır.", laneAdvantage: "Lane'i kazanmak garantidir, team fight'ta R value çok yüksek.", watchOut: "Yasuo erken snowball'dan önce bastır.", buildHint: "Frozen Heart, Warmog's Armor", lanePhases: { early: "Strong", mid: "Strong", late: "Strong" } },
      ],
      tips: ["Zırh item'larını ön planda tut, Yasuo tamamen AD.", "Yasuo'nun Windwall CD'si ~25 saniye, bu sürede agresif ol.", "Gank aldığında Yasuo'nun R combo'su için hazır ol."],
      patchNote: "Bu veriler manuel olarak girilmiştir. Patch güncellemelerini yansıtmayabilir.",
    },
  },

  Darius: {
    TOP: {
      topCounters: [
        { champion: "Quinn", difficulty: "hard", tier: "S", winRate: 55.8, reasonWhy: "Quinn'in menzilli ataklarına Darius yaklaşamaz. Vault+blind combo Darius'un Q'sunu keser.", laneAdvantage: "Darius'a hiç yaklaşamaz, güvenli poke ile chunk atar.", watchOut: "Gank geldiğinde Quinn'in R'ı yoksa düşebilir.", buildHint: "Kraken Slayer, Mortal Reminder", lanePhases: { early: "Strong", mid: "Strong", late: "Even" }, runeAdvice: { keystone: "Fleet Footwork", primaryPath: "Precision", secondaryPath: "Domination" } },
        { champion: "Kennen", difficulty: "medium", tier: "A", winRate: 54.2, reasonWhy: "Menzilli poke ve stun Darius'u nötralize eder. Darius Kennen'e asla yaklaşamaz.", laneAdvantage: "Güvenli uzak mesafe poke ile Darius'u eritir.", watchOut: "Darius flash Q olduğunda biraz daha geri dur.", buildHint: "Riftmaker, Zhonya's Hourglass", lanePhases: { early: "Strong", mid: "Strong", late: "Even" }, runeAdvice: { keystone: "Summon Aery", primaryPath: "Sorcery", secondaryPath: "Resolve" } },
        { champion: "Vayne", difficulty: "hard", tier: "A", winRate: 53.7, reasonWhy: "True damage pasifi Darius'un yüksek HP'sini bypass eder. E ile Darius'u duvardan iter ve sağ atar.", laneAdvantage: "Kite tekniği Darius'un tüm kit'ini geçersiz kılar.", watchOut: "Flash+E'ye karşı dikkatli ol, duvar yoksa E zararsız.", buildHint: "Kraken Slayer, Guinsoo's Rageblade", lanePhases: { early: "Weak", mid: "Strong", late: "Strong" }, runeAdvice: { keystone: "Lethal Tempo", primaryPath: "Precision", secondaryPath: "Domination" } },
      ],
      easyCounters: [
        { champion: "Garen", difficulty: "easy", tier: "B", winRate: 50.8, reasonWhy: "Silence Darius'un Q ile bleed stack'ini engeller, erken oyunda trade edilebilir.", laneAdvantage: "Q silence sonrası hızlı spin + koşma trade cycle.", watchOut: "Darius 5 stack bleed aktifken trade etme, ult'ı öldürücü.", buildHint: "Stridebreaker, Mortal Reminder", lanePhases: { early: "Even", mid: "Even", late: "Even" } },
        { champion: "Fiora", difficulty: "medium", tier: "A", winRate: 53.1, reasonWhy: "Riposte Darius'un W pull'unu ve Q hasarını parry edebilir.", laneAdvantage: "Vital mechanic ile Darius'un yüksek HP'si avantaj olur.", watchOut: "Darius'un E pull menzilinin dışında dur.", buildHint: "Trinity Force, Ravenous Hydra", lanePhases: { early: "Even", mid: "Strong", late: "Strong" } },
      ],
      soloQueueCounters: [
        { champion: "Teemo", difficulty: "easy", tier: "A", winRate: 54.6, reasonWhy: "Blind Q Darius'un AA tabanlı kit'ini devre dışı bırakır, zehir DoT ile eriti.", laneAdvantage: "Darius'un menzil dışında durarak poke yap.", watchOut: "Darius flash + E combo'su range'in dışında olduğunu sanabilir.", buildHint: "Liandry's Anguish, Shadowflame", lanePhases: { early: "Strong", mid: "Strong", late: "Even" } },
        { champion: "Quinn", difficulty: "medium", tier: "S", winRate: 55.8, reasonWhy: "Solo queue'da Darius'u en güvenli counter'layan şampiyondur.", laneAdvantage: "Hiç yaklaşmasına gerek yok, poke ile kazanır.", watchOut: "Gank açısında Q'ya yakalanma.", buildHint: "Kraken Slayer, Collector", lanePhases: { early: "Strong", mid: "Strong", late: "Even" } },
      ],
      tips: ["Darius'un Q dış kenarı bleed vermez, iç dairede dur.", "Bleed 5 stack dolmadan trade bitir.", "Darius pull range'i ~475 — bu mesafenin dışında dur."],
      patchNote: "Bu veriler manuel olarak girilmiştir. Patch güncellemelerini yansıtmayabilir.",
    },
  },

  "Lee Sin": {
    JUNGLE: {
      topCounters: [
        { champion: "Rammus", difficulty: "easy", tier: "S", winRate: 56.4, reasonWhy: "Thornmail + Powerball ile Lee Sin'in AD burst'üne karşı mükemmeldir. Taunt + ult combo'su Lee Sin'i durdurur.", laneAdvantage: "Her 1v1 duel'de Rammus kazanır, Lee Sin hasar yapamaz.", watchOut: "Lee Sin ward-hop ile Rammus'tan kaçabilir.", buildHint: "Sunfire Aegis, Thornmail", lanePhases: { early: "Strong", mid: "Strong", late: "Strong" }, runeAdvice: { keystone: "Aftershock", primaryPath: "Resolve", secondaryPath: "Domination" } },
        { champion: "Warwick", difficulty: "easy", tier: "A", winRate: 54.1, reasonWhy: "Sürekli healing ve CC ile Lee Sin duellerini kazanır. R ile Lee Sin'i full combo öncesi kilitler.", laneAdvantage: "Warwick düşük HP'de daha da güçlenir, Lee Sin onu bitiremez.", watchOut: "Lee Sin Q uzak mesafeden poke edebilir, regen süresi ver.", buildHint: "Ravenous Hydra, Sterak's Gage", lanePhases: { early: "Even", mid: "Strong", late: "Strong" }, runeAdvice: { keystone: "Conqueror", primaryPath: "Precision", secondaryPath: "Resolve" } },
        { champion: "Amumu", difficulty: "medium", tier: "A", winRate: 52.8, reasonWhy: "AoE CC ve armor ile Lee Sin'in early game baskısını sonraki fazlarda telafi eder.", laneAdvantage: "Team fight dominansı Lee Sin'in bireysel baskısını geçersiz kılar.", watchOut: "Lee Sin erken çok güçlü, Amumu için ilk 15 dakika kritik.", buildHint: "Sunfire Aegis, Abyssal Mask", lanePhases: { early: "Weak", mid: "Even", late: "Strong" }, runeAdvice: { keystone: "Aftershock", primaryPath: "Resolve", secondaryPath: "Inspiration" } },
      ],
      easyCounters: [
        { champion: "Rammus", difficulty: "easy", tier: "S", winRate: 56.4, reasonWhy: "Lee Sin'in tüm AD stack'ini sıfırlar. En kolay ve en etkili counter.", laneAdvantage: "Tüm 1v1 duellarında kazanır.", watchOut: "Lee Sin invade'lerinden camp protect et.", buildHint: "Thornmail, Frozen Heart", lanePhases: { early: "Strong", mid: "Strong", late: "Strong" } },
        { champion: "Nunu & Willump", difficulty: "easy", tier: "B", winRate: 51.9, reasonWhy: "Snowball ile Lee Sin'i interrupt eder, Q healing ile durabilitesi çok yüksek.", laneAdvantage: "Objective control ve slow ile Lee Sin'i geride bırakır.", watchOut: "Lee Sin erken invade'de Nunu'yu öldürebilir.", buildHint: "Warmog's Armor, Turbo Chemtank", lanePhases: { early: "Weak", mid: "Even", late: "Strong" } },
      ],
      soloQueueCounters: [
        { champion: "Amumu", difficulty: "easy", tier: "A", winRate: 52.8, reasonWhy: "AoE ult ile team fight'ları tek başına kazanır, Lee Sin'in fark yaratan plays'ini etkisiz kılar.", laneAdvantage: "Dragon ve Baron control'ü kolayca alır.", watchOut: "Lee Sin erken drag almaya çalışır, ward koy.", buildHint: "Sunfire Aegis, Demonic Embrace", lanePhases: { early: "Weak", mid: "Even", late: "Strong" } },
        { champion: "Vi", difficulty: "medium", tier: "A", winRate: 52.3, reasonWhy: "R ile herhangi bir engage'i takip eder ve Lee Sin'in kickini counter eder.", laneAdvantage: "Tankier build ile Lee Sin'in burst'üne daha dayanıklı.", watchOut: "Lee Sin erken camp invasionlarından korun.", buildHint: "Trinity Force, Sterak's Gage", lanePhases: { early: "Even", mid: "Strong", late: "Strong" } },
      ],
      tips: ["Lee Sin early game'i çok güçlü, Dragon'a ward koy.", "Lee Sin ward-hop için ward kullanır, ward sweep ile kör et.", "Lee Sin'in R kick'i bir ally'ı uçurur, pozisyon al."],
      patchNote: "Bu veriler manuel olarak girilmiştir. Patch güncellemelerini yansıtmayabilir.",
    },
  },

  Jinx: {
    BOTTOM: {
      topCounters: [
        { champion: "Draven", difficulty: "hard", tier: "S", winRate: 54.7, reasonWhy: "Draven'ın erken hasar baskısı Jinx'in skalasını engeller. Axes passive ile level 1'den kill baskısı oluşturur.", laneAdvantage: "Jinx'i erken öldürürse snowball kazanılmış demektir.", watchOut: "Jinx level 6 ultiyle her yerden kill atabilir.", buildHint: "Collector, Essence Reaver", lanePhases: { early: "Strong", mid: "Strong", late: "Even" }, runeAdvice: { keystone: "Lethal Tempo", primaryPath: "Precision", secondaryPath: "Domination" } },
        { champion: "Miss Fortune", difficulty: "medium", tier: "A", winRate: 53.2, reasonWhy: "Love Tap passive ile Jinx'e oranla çok daha fazla poke hasarı verir.", laneAdvantage: "Double Up + E slow combo ile Jinx erken kazanılamaz.", watchOut: "Jinx'in Chompers trap'larından kaçın.", buildHint: "Kraken Slayer, Lord Dominik's Regards", lanePhases: { early: "Strong", mid: "Strong", late: "Even" }, runeAdvice: { keystone: "Lethal Tempo", primaryPath: "Precision", secondaryPath: "Domination" } },
        { champion: "Caitlyn", difficulty: "medium", tier: "A", winRate: 52.6, reasonWhy: "En uzun menzilli ADC olarak Jinx'e güvenli poke imkânı verir.", laneAdvantage: "Headshot mechanic ile her minyon kill'de Jinx'e tick vurur.", watchOut: "Jinx'in Q rocket modu, Caitlyn'den daha uzun menzile ulaşır.", buildHint: "Kraken Slayer, Rapid Firecannon", lanePhases: { early: "Strong", mid: "Strong", late: "Even" }, runeAdvice: { keystone: "Lethal Tempo", primaryPath: "Precision", secondaryPath: "Sorcery" } },
      ],
      easyCounters: [
        { champion: "Miss Fortune", difficulty: "easy", tier: "A", winRate: 53.2, reasonWhy: "Yüksek poke hasarı ve güçlü lane baskısı.", laneAdvantage: "Support ile iyi synergy, lane kill baskısı yüksek.", watchOut: "Jinx'in Zap E ile slowed kalırsan MF'in E'si çarpar.", buildHint: "Kraken Slayer, Serylda's Grudge", lanePhases: { early: "Strong", mid: "Strong", late: "Even" } },
        { champion: "Lucian", difficulty: "medium", tier: "A", winRate: 52.1, reasonWhy: "Kısa menzili agresif pashole mekanizmasıyla Jinx'i erken baskılar.", laneAdvantage: "E dash ile Jinx'in W slow'undan kaçar.", watchOut: "Jinx level 6 sonrası hasar baskısı ciddi artar.", buildHint: "The Collector, Essence Reaver", lanePhases: { early: "Strong", mid: "Strong", late: "Weak" } },
      ],
      soloQueueCounters: [
        { champion: "Draven", difficulty: "medium", tier: "S", winRate: 54.7, reasonWhy: "Solo queue'da Jinx'i ezdiren en etkili ADC, snowball gücü çok yüksek.", laneAdvantage: "Erken kill almak Draven için oyunu kazandırır.", watchOut: "Stack toplarken agresifliği dengelemeyi unut.", buildHint: "Collector, Infinity Edge", lanePhases: { early: "Strong", mid: "Strong", late: "Even" } },
        { champion: "Caitlyn", difficulty: "easy", tier: "A", winRate: 52.6, reasonWhy: "Güvenli kite ve poke stili solo queue'da kolay oynanır.", laneAdvantage: "Tower range avantajı ile Headshot baskısı güçlü.", watchOut: "Jinx rocket'ının menzilini Caitlyn menziliyle karıştırma.", buildHint: "Kraken Slayer, Rapid Firecannon", lanePhases: { early: "Strong", mid: "Strong", late: "Even" } },
      ],
      tips: ["Jinx immobile'dir — engage'den önce support CC'sini bekle.", "Jinx'in Q Minigun/Rocket değiştirmesi gecikmeli, bu sürede hasar ver.", "Jinx 2 item sonrası çok güçlenir, öncesinde önde ol."],
      patchNote: "Bu veriler manuel olarak girilmiştir. Patch güncellemelerini yansıtmayabilir.",
    },
  },

  Thresh: {
    UTILITY: {
      topCounters: [
        { champion: "Morgana", difficulty: "medium", tier: "S", winRate: 54.9, reasonWhy: "Black Shield Thresh'in tüm CC zincirini bloklar. Q kök ile Thresh'i immobilize eder.", laneAdvantage: "Her Thresh hook'u Black Shield ile geçersiz kılar.", watchOut: "Thresh'in E fener'i arkasında kalırsan Morgana bile tutulabilir.", buildHint: "Imperial Mandate, Zhonya's Hourglass", lanePhases: { early: "Even", mid: "Strong", late: "Strong" }, runeAdvice: { keystone: "Summon Aery", primaryPath: "Sorcery", secondaryPath: "Resolve" } },
        { champion: "Nautilus", difficulty: "medium", tier: "A", winRate: 52.8, reasonWhy: "Hook + passive root ile Thresh'in CC zinciriyle yarışır, daha tank build'e sahip.", laneAdvantage: "Her level'de Thresh'e karşı hook ile kill tehdit eder.", watchOut: "Thresh'in hook menzilinde durmaktan kaçın.", buildHint: "Locket of the Iron Solari, Warmog's Armor", lanePhases: { early: "Even", mid: "Strong", late: "Strong" }, runeAdvice: { keystone: "Aftershock", primaryPath: "Resolve", secondaryPath: "Domination" } },
        { champion: "Blitzcrank", difficulty: "hard", tier: "A", winRate: 52.1, reasonWhy: "Rocket grab Thresh'ten daha uzun menzilli ve anında. Grab+ult combo Thresh'i şaşırtır.", laneAdvantage: "İlk grab ADC'yi öldürme potansiyeli çok yüksek.", watchOut: "Thresh lantern ile ADC'nin kaçmasını sağlayabilir.", buildHint: "Locket of the Iron Solari, Knight's Vow", lanePhases: { early: "Strong", mid: "Strong", late: "Even" }, runeAdvice: { keystone: "Aftershock", primaryPath: "Resolve", secondaryPath: "Inspiration" } },
      ],
      easyCounters: [
        { champion: "Morgana", difficulty: "easy", tier: "S", winRate: 54.9, reasonWhy: "Black Shield en kolay ve en etkili Thresh counter'ıdır.", laneAdvantage: "Güvenli sustain ve poke ile lane kazanır.", watchOut: "Thresh fener atmak yerine E kullanabilir, dikkatli ol.", buildHint: "Imperial Mandate, Chemtech Putrifier", lanePhases: { early: "Even", mid: "Strong", late: "Strong" } },
        { champion: "Sona", difficulty: "easy", tier: "B", winRate: 51.4, reasonWhy: "Heal poke ile Thresh'in agresif playstyle'ını dengeler.", laneAdvantage: "Passive power chord hasarı Thresh'e sürekli tick vurur.", watchOut: "Thresh hook'una yakalanırsan Sona için kötü biter.", buildHint: "Moonstone Renewer, Ardent Censer", lanePhases: { early: "Even", mid: "Even", late: "Strong" } },
      ],
      soloQueueCounters: [
        { champion: "Leona", difficulty: "medium", tier: "A", winRate: 52.6, reasonWhy: "Yüksek engage gücü Thresh'in poke odaklı oyununu ezer.", laneAdvantage: "All-in baskısı Thresh'i savunmaya zorlar.", watchOut: "Thresh'in E geri itmesi Leona engage'ini kesebilir.", buildHint: "Locket of the Iron Solari, Zeke's Convergence", lanePhases: { early: "Strong", mid: "Strong", late: "Strong" } },
        { champion: "Morgana", difficulty: "easy", tier: "S", winRate: 54.9, reasonWhy: "Solo queue'da en güvenilir Thresh counter'ıdır.", laneAdvantage: "ADC'yi Black Shield ile her hook'tan korur.", watchOut: "Thresh'in hook CD'sini takip et, bitmişken agresif ol.", buildHint: "Imperial Mandate, Redemption", lanePhases: { early: "Even", mid: "Strong", late: "Strong" } },
      ],
      tips: ["Thresh'in hook menzilini ezberle, bu menzilde durmaktan kaçın.", "Thresh'in lantern'ı teamsate'e geçiş sağlar, hook sonrası reaksiyon ver.", "Thresh'in E geri itmesi engage girişimini kesebilir, önce E CD'sini tüket."],
      patchNote: "Bu veriler manuel olarak girilmiştir. Patch güncellemelerini yansıtmayabilir.",
    },
  },

  Zed: {
    MIDDLE: {
      topCounters: [
        { champion: "Lissandra", difficulty: "medium", tier: "S", winRate: 55.2, reasonWhy: "Lissandra'nın kendi üstüne attığı ult Zed'in hasar combo'sunu sıfırlar. E ile Zed shadow'larına kaçar.", laneAdvantage: "Zed ult attığında Lissandra ult ile hayatta kalır.", watchOut: "Zed seni ult öncesi W shadow ile yaklaştırabilir, E ile kaç.", buildHint: "Rod of Ages, Zhonya's Hourglass", lanePhases: { early: "Even", mid: "Strong", late: "Strong" }, runeAdvice: { keystone: "Phase Rush", primaryPath: "Sorcery", secondaryPath: "Resolve" } },
        { champion: "Malzahar", difficulty: "easy", tier: "A", winRate: 54.1, reasonWhy: "Zhonya'lı Malzahar Zed ult'ını golden stasis ile tamamen geçersiz kılar.", laneAdvantage: "Wave push ile Zed'i roam'dan engeller.", watchOut: "Zed invade'den kaçın, support ile gank iste.", buildHint: "Shadowflame, Zhonya's Hourglass", lanePhases: { early: "Even", mid: "Strong", late: "Strong" }, runeAdvice: { keystone: "Summon Aery", primaryPath: "Sorcery", secondaryPath: "Domination" } },
        { champion: "Fizz", difficulty: "hard", tier: "A", winRate: 52.8, reasonWhy: "Playful/Trickster Zed'in tüm spelllerini iptal eder. Fizz erken oyunda Zed'i baskılar.", laneAdvantage: "E ile Zed'in tüm hasar combo'sunu evade eder.", watchOut: "Zed level 2'de çok güçlü, erken kaybetme.", buildHint: "Lich Bane, Shadowflame", lanePhases: { early: "Even", mid: "Strong", late: "Strong" }, runeAdvice: { keystone: "Electrocute", primaryPath: "Domination", secondaryPath: "Sorcery" } },
      ],
      easyCounters: [
        { champion: "Malzahar", difficulty: "easy", tier: "A", winRate: 54.1, reasonWhy: "Zhonya + Zed ult kombinasyonu Zed'i mükemmel counter eder.", laneAdvantage: "Malzahar Zed lane'i güvenle oynar.", watchOut: "Zed Malzahar'ın ult CC'sini E ile iptal edebilir.", buildHint: "Luden's Tempest, Zhonya's Hourglass", lanePhases: { early: "Even", mid: "Strong", late: "Strong" } },
        { champion: "Anivia", difficulty: "medium", tier: "B", winRate: 51.7, reasonWhy: "Egg passive Zed'in one-shot planını engeller, wall ile Zed'i divide eder.", laneAdvantage: "Passive ile ölümden döner, Zed burst'ünü boşa harcar.", watchOut: "Egg fazında Zed saldırmayı bırakmaz, support iste.", buildHint: "Rod of Ages, Zhonya's Hourglass", lanePhases: { early: "Weak", mid: "Even", late: "Strong" } },
      ],
      soloQueueCounters: [
        { champion: "Lissandra", difficulty: "medium", tier: "S", winRate: 55.2, reasonWhy: "Solo queue'da Zed'i en etkili engelleyen şampiyondur.", laneAdvantage: "Self-ult Zed'in combo'sunu tamamen sıfırlar.", watchOut: "Zed seni R atmadan önce baskılamaya çalışır, dikkatli ol.", buildHint: "Rod of Ages, Shadowflame", lanePhases: { early: "Even", mid: "Strong", late: "Strong" } },
        { champion: "Galio", difficulty: "easy", tier: "A", winRate: 52.4, reasonWhy: "MR pasifi Zed'in fiziksel olmayan hasarını azaltır, W ile Zed engage'ine CC verir.", laneAdvantage: "Taunt + ult ile team'e global yardım sağlar.", watchOut: "Zed all AD olduğu için Galio'nun MR pasifi sınırlı, zırh al.", buildHint: "Abyssal Mask, Gargoyle Stoneplate", lanePhases: { early: "Even", mid: "Strong", late: "Strong" } },
      ],
      tips: ["Zed ult atarken Zhonya kullan, hasar iptal olur.", "Zed shadow'larının yerini takip et, shadow'a Q+E ile combo tamamlar.", "Zed level 6 öncesi öldürülebilir, erken agresiflik şarttır."],
      patchNote: "Bu veriler manuel olarak girilmiştir. Patch güncellemelerini yansıtmayabilir.",
    },
  },

  Ezreal: {
    BOTTOM: {
      topCounters: [
        { champion: "Draven", difficulty: "hard", tier: "S", winRate: 55.1, reasonWhy: "Draven'ın erken hasar baskısı Ezreal'i Q poke edemeden zonlar. Axes passive dominant lane baskısı sağlar.", laneAdvantage: "Ezreal'in kite stylesine karşı agresif all-in yapılır.", watchOut: "Ezreal'in E blink'i Draven'ın engage'inden kaçabilir.", buildHint: "Collector, Infinity Edge", lanePhases: { early: "Strong", mid: "Strong", late: "Even" }, runeAdvice: { keystone: "Lethal Tempo", primaryPath: "Precision", secondaryPath: "Domination" } },
        { champion: "Miss Fortune", difficulty: "medium", tier: "A", winRate: 53.4, reasonWhy: "Love Tap + Double Up Ezreal'in poke'una oranla çok daha fazla hasar verir.", laneAdvantage: "Ezreal pokelarına eşit hasarla döner.", watchOut: "Ezreal Q'su uzak mesafede isabetli.", buildHint: "Kraken Slayer, Serylda's Grudge", lanePhases: { early: "Strong", mid: "Strong", late: "Even" }, runeAdvice: { keystone: "Lethal Tempo", primaryPath: "Precision", secondaryPath: "Domination" } },
        { champion: "Varus", difficulty: "medium", tier: "A", winRate: 52.7, reasonWhy: "Uzun menzilli Q poke Ezreal'den daha isabetli. R ile Ezreal'in blink öncesi kilitler.", laneAdvantage: "R chain CC sonrası tüm takım Ezreal'e düşer.", watchOut: "Ezreal E blink'i erken kullanmadan R atma.", buildHint: "Trinity Force, Kraken Slayer", lanePhases: { early: "Even", mid: "Strong", late: "Strong" }, runeAdvice: { keystone: "Lethal Tempo", primaryPath: "Precision", secondaryPath: "Sorcery" } },
      ],
      easyCounters: [
        { champion: "Miss Fortune", difficulty: "easy", tier: "A", winRate: 53.4, reasonWhy: "Agresif hasar çıkışı Ezreal'i lane'de overwhelm eder.", laneAdvantage: "E movespeed ile Ezreal'i kovalayabilir.", watchOut: "Ezreal Q uzak mesafede isabetli olduğunda eşit hasar alabilirsin.", buildHint: "Kraken Slayer, Rapid Firecannon", lanePhases: { early: "Strong", mid: "Strong", late: "Even" } },
        { champion: "Sivir", difficulty: "easy", tier: "B", winRate: 51.2, reasonWhy: "E spell shield Ezreal'in Q'sunu bloklar.", laneAdvantage: "Spell shield her Ezreal Q'sunu geçersiz kılar.", watchOut: "Ezreal R uzak mesafeden gelebilir, E'ni sakla.", buildHint: "Kraken Slayer, Ravenous Hydra", lanePhases: { early: "Even", mid: "Even", late: "Even" } },
      ],
      soloQueueCounters: [
        { champion: "Draven", difficulty: "medium", tier: "S", winRate: 55.1, reasonWhy: "Solo queue'da Ezreal'i en güçlü baskılayan ADC'dir.", laneAdvantage: "Snowball gücü yüksek, öncü avantaj şart.", watchOut: "Stack'leri boşa harcama.", buildHint: "Collector, Kraken Slayer", lanePhases: { early: "Strong", mid: "Strong", late: "Even" } },
        { champion: "Caitlyn", difficulty: "easy", tier: "A", winRate: 52.3, reasonWhy: "Menzil avantajı Ezreal'in kite stiline karşı güvenli poke sağlar.", laneAdvantage: "Headshot mekaniği sürekli pasif hasar üretir.", watchOut: "Ezreal R global menzilde gelir, dikkatli.", buildHint: "Kraken Slayer, Rapid Firecannon", lanePhases: { early: "Strong", mid: "Strong", late: "Even" } },
      ],
      tips: ["Ezreal E'siz kaldığında agresif ol, CD ~19 saniye.", "Ezreal'in R'ı 1 saniyelik cast süresi var, yürürken zap.", "Ezreal full build çok güçlü, erken önde olmak şarttır."],
      patchNote: "Bu veriler manuel olarak girilmiştir. Patch güncellemelerini yansıtmayabilir.",
    },
  },

  Katarina: {
    MIDDLE: {
      topCounters: [
        { champion: "Kassadin", difficulty: "medium", tier: "A", winRate: 53.1, reasonWhy: "MR pasifi Katarina'nın büyü hasarını azaltır. R ile Katarina'yı kovalayabilir.", laneAdvantage: "Level 6 sonrası Kassadin Katarina'yı öldürebilir.", watchOut: "Katarina erken seviyede Kassadin'e baskı kurar.", buildHint: "Rod of Ages, Zhonya's Hourglass", lanePhases: { early: "Weak", mid: "Even", late: "Strong" }, runeAdvice: { keystone: "Phase Rush", primaryPath: "Sorcery", secondaryPath: "Resolve" } },
        { champion: "Diana", difficulty: "medium", tier: "A", winRate: 52.7, reasonWhy: "MR build ile Katarina'nın burst'üne dayanır, R CC combo'su Katarina'yı keser.", laneAdvantage: "Pull + ult combo Katarina'nın reset döngüsünü kırar.", watchOut: "Katarina reset yapmaya başlamadan CC'yi doğru zamanda kullan.", buildHint: "Zhonya's Hourglass, Rabadon's Deathcap", lanePhases: { early: "Even", mid: "Strong", late: "Strong" }, runeAdvice: { keystone: "Electrocute", primaryPath: "Domination", secondaryPath: "Sorcery" } },
        { champion: "Leona", difficulty: "easy", tier: "S", winRate: 55.8, reasonWhy: "CC zinciri Katarina'nın tüm dash seçeneklerini durdurur. Sunfire+Thormail Katarina'ya karşı etkilidir.", laneAdvantage: "W shield + CC ile Katarina'nın combo'sunu keser.", watchOut: "Katarina bıçak atarak dagger üzerine E kullanabilir, CC timing kritik.", buildHint: "Locket of the Iron Solari, Thornmail", lanePhases: { early: "Even", mid: "Strong", late: "Strong" }, runeAdvice: { keystone: "Aftershock", primaryPath: "Resolve", secondaryPath: "Inspiration" } },
      ],
      easyCounters: [
        { champion: "Malzahar", difficulty: "easy", tier: "A", winRate: 53.8, reasonWhy: "Cage + ult combo Katarina'yı kilitler, Zhonya ile Katarina ult'ını geçersiz kılar.", laneAdvantage: "Wave push ile Katarina'yı tower'a zorlar.", watchOut: "Katarina E'si cage'den kaçabilir, R öncesinde harca.", buildHint: "Zhonya's Hourglass, Shadowflame", lanePhases: { early: "Even", mid: "Strong", late: "Strong" } },
        { champion: "Galio", difficulty: "easy", tier: "A", winRate: 52.4, reasonWhy: "W taunt Katarina'nın resetini durdurur, yüksek MR ile sağ kalır.", laneAdvantage: "Taunt timing ile Katarina'nın tüm R döngüsünü keser.", watchOut: "Katarina dagger reset hızı çok yüksek, geç CC ölümcüldür.", buildHint: "Abyssal Mask, Gargoyle Stoneplate", lanePhases: { early: "Even", mid: "Strong", late: "Strong" } },
      ],
      soloQueueCounters: [
        { champion: "Malzahar", difficulty: "easy", tier: "A", winRate: 53.8, reasonWhy: "Solo queue'da Katarina'nın en kolay counter'ıdır.", laneAdvantage: "Cage+ult+Zhonya kombinasyonu Katarina'yı her zaman durdurur.", watchOut: "Katarina E ile cage'den çıkabilir, R öncesi cage at.", buildHint: "Luden's Tempest, Zhonya's Hourglass", lanePhases: { early: "Even", mid: "Strong", late: "Strong" } },
        { champion: "Diana", difficulty: "medium", tier: "A", winRate: 52.7, reasonWhy: "Engage gücü yüksek ve Katarina resetini R ile kesiyor.", laneAdvantage: "All-in playstyle Katarina'yı overwhelm eder.", watchOut: "Katarina erken seviyede Diana'ya baskı kurar.", buildHint: "Riftmaker, Zhonya's Hourglass", lanePhases: { early: "Even", mid: "Strong", late: "Strong" } },
      ],
      tips: ["Katarina'nın dagger'larını pickup yapmasını engelle.", "CC zincirini R başladığında değil, başlamadan önce kullan.", "Katarina'nın itemsiz ilk 15 dakikası zayıftır, agresif ol."],
      patchNote: "Bu veriler manuel olarak girilmiştir. Patch güncellemelerini yansıtmayabilir.",
    },
  },

};

export function getStaticCounterData(
  champion: string,
  role: Position
): StaticCounterData | null {
  return STATIC_COUNTER_DATA[champion]?.[role] ?? null;
}
