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
    name: "CS Machine",
    description: "Get 7.0+ CS/min 3 games in a row",
    iconSlug: "⚔️",
    tier: "silver",
    isSecret: false,
  },
  {
    id: "deathless",
    name: "Untouchable",
    description: "Finish 5 games in a row with ≤2 deaths",
    iconSlug: "🛡️",
    tier: "gold",
    isSecret: false,
  },
  {
    id: "rising_star",
    name: "Rising Star",
    description: "Gain +50 LP in one week",
    iconSlug: "⭐",
    tier: "gold",
    isSecret: false,
  },
  {
    id: "on_fire",
    name: "On Fire",
    description: "Win 5 games in a row",
    iconSlug: "🔥",
    tier: "silver",
    isSecret: false,
  },
  {
    id: "habit_breaker",
    name: "Habit Breaker",
    description: "Fix a detected weak habit",
    iconSlug: "🔗",
    tier: "platinum",
    isSecret: false,
  },
  {
    id: "otp_apprentice",
    name: "OTP Apprentice",
    description: "Play 50 ranked games on a single champion",
    iconSlug: "🎯",
    tier: "silver",
    isSecret: false,
  },
  {
    id: "otp_master",
    name: "OTP Master",
    description: "Play 100 ranked games on a single champion",
    iconSlug: "👑",
    tier: "platinum",
    isSecret: false,
  },
  {
    id: "vision_ward",
    name: "Vision Master",
    description: "Get 10+ vision score 3 games in a row",
    iconSlug: "👁️",
    tier: "silver",
    isSecret: false,
  },
  {
    id: "comeback_king",
    name: "Comeback King",
    description: "Win 3 games after a 3-game losing streak",
    iconSlug: "💪",
    tier: "gold",
    isSecret: false,
  },
  {
    id: "first_report",
    name: "First Report",
    description: "Generate your first coaching report",
    iconSlug: "📋",
    tier: "bronze",
    isSecret: false,
  },
  {
    id: "week_warrior",
    name: "Week Warrior",
    description: "Play 20+ games in one week",
    iconSlug: "⚡",
    tier: "silver",
    isSecret: false,
  },
  {
    id: "improvement_plan",
    name: "Planned Player",
    description: "Create your first improvement plan",
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
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};
