export type AchievementTier = "bronze" | "silver" | "gold" | "platinum";

export interface AchievementCatalogEntry {
  id: string;
  name: string;
  description: string;
  iconSlug: string;
  tier: AchievementTier;
  isSecret: boolean;
}

export const ACHIEVEMENT_CATALOG: AchievementCatalogEntry[] = [
  {
    id: "cs_machine",
    name: "CS Makinesi",
    description: "3 üst üste 7.0+ CS/dk yap",
    iconSlug: "⚔️",
    tier: "silver",
    isSecret: false,
  },
  {
    id: "deathless",
    name: "Dokunulmaz",
    description: "5 üst üste ≤2 ölümle bitir",
    iconSlug: "🛡️",
    tier: "gold",
    isSecret: false,
  },
  {
    id: "rising_star",
    name: "Yükselen Yıldız",
    description: "Bir haftada +50 LP kazan",
    iconSlug: "⭐",
    tier: "gold",
    isSecret: false,
  },
  {
    id: "on_fire",
    name: "Ateş Serisi",
    description: "5 maçlık galibiyet serisi yap",
    iconSlug: "🔥",
    tier: "silver",
    isSecret: false,
  },
  {
    id: "habit_breaker",
    name: "Alışkanlık Kırıcı",
    description: "Tespit edilen bir zayıf alışkanlığı çöz",
    iconSlug: "🔗",
    tier: "platinum",
    isSecret: false,
  },
  {
    id: "otp_apprentice",
    name: "OTP Adayı",
    description: "Tek şampiyonla 50 ranked maç oyna",
    iconSlug: "🎯",
    tier: "silver",
    isSecret: false,
  },
  {
    id: "otp_master",
    name: "OTP Ustası",
    description: "Tek şampiyonla 100 ranked maç oyna",
    iconSlug: "👑",
    tier: "platinum",
    isSecret: false,
  },
  {
    id: "vision_ward",
    name: "Vizyon Ustası",
    description: "3 üst üste 10+ vision score al",
    iconSlug: "👁️",
    tier: "silver",
    isSecret: false,
  },
  {
    id: "comeback_king",
    name: "Geri Dönüş Kralı",
    description: "3 maç kaybetme serisinin ardından 3 galibiyet kazan",
    iconSlug: "💪",
    tier: "gold",
    isSecret: false,
  },
  {
    id: "first_report",
    name: "İlk Rapor",
    description: "İlk koçluk raporunu oluştur",
    iconSlug: "📋",
    tier: "bronze",
    isSecret: false,
  },
  {
    id: "week_warrior",
    name: "Hafta Savaşçısı",
    description: "Bir haftada 20+ maç oyna",
    iconSlug: "⚡",
    tier: "silver",
    isSecret: false,
  },
  {
    id: "improvement_plan",
    name: "Planlı Oyuncu",
    description: "İlk improvement planını oluştur",
    iconSlug: "📈",
    tier: "gold",
    isSecret: false,
  },
];

export const TIER_COLORS: Record<AchievementTier, string> = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  platinum: "#E5E4E2",
};

export const TIER_LABEL: Record<AchievementTier, string> = {
  bronze: "Bronz",
  silver: "Gümüş",
  gold: "Altın",
  platinum: "Platin",
};
