export type SubscriptionPlan = "free" | "pro" | "elite";

export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing";

export type QueueType =
  | "RANKED_SOLO_5x5"
  | "RANKED_FLEX_SR"
  | "NORMAL_BLIND"
  | "NORMAL_DRAFT"
  | "ARAM"
  | "ALL";

export type Position = "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "UTILITY";

export type RankTier =
  | "IRON"
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "EMERALD"
  | "DIAMOND"
  | "MASTER"
  | "GRANDMASTER"
  | "CHALLENGER";

export type RankDivision = "I" | "II" | "III" | "IV";

export type Region =
  | "na1"
  | "euw1"
  | "eun1"
  | "kr"
  | "jp1"
  | "br1"
  | "la1"
  | "la2"
  | "oc1"
  | "tr1"
  | "ru";
