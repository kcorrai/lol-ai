import Image from "next/image";
import { Calendar, Flame } from "lucide-react";
import { profileIconUrl, rankEmblemUrl, championSplashUrl } from "@/lib/ddragon";

const TIER_COLORS: Record<string, string> = {
  IRON: "#4a4a5a",
  BRONZE: "#a05336",
  SILVER: "#a8b8c8",
  GOLD: "#C6FF3D",
  PLATINUM: "#3cba8c",
  EMERALD: "#00be93",
  DIAMOND: "#576bce",
  MASTER: "#9e4fc6",
  GRANDMASTER: "#e84057",
  CHALLENGER: "#f4c874",
};

const TIER_GLOW: Record<string, string> = {
  MASTER: "rgba(158,79,198,0.35)",
  GRANDMASTER: "rgba(232,64,87,0.35)",
  CHALLENGER: "rgba(244,200,116,0.40)",
};

const TIER_LABELS: Record<string, string> = {
  IRON: "Iron",
  BRONZE: "Bronze",
  SILVER: "Silver",
  GOLD: "Gold",
  PLATINUM: "Platinum",
  EMERALD: "Emerald",
  DIAMOND: "Diamond",
  MASTER: "Master",
  GRANDMASTER: "Grandmaster",
  CHALLENGER: "Challenger",
};

const REGION_FLAGS: Record<string, string> = {
  euw1: "🇪🇺",
  eun1: "🇪🇺",
  tr1: "🇹🇷",
  ru: "🇷🇺",
  na1: "🇺🇸",
  br1: "🇧🇷",
  la1: "🌎",
  la2: "🌎",
  kr: "🇰🇷",
  jp1: "🇯🇵",
  oc1: "🇦🇺",
};

interface RankInfo {
  tier: string;
  division: string;
  lp: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
}

interface Props {
  displayName: string;
  profileIconId: number | null;
  rank: RankInfo | null;
  region: string | null;
  joinedAt: string;
  featuredChampion: string | null;
  isPrivate: boolean;
}

export function PublicProfileHero({
  displayName,
  profileIconId,
  rank,
  region,
  joinedAt,
  featuredChampion,
  isPrivate,
}: Props) {
  const iconUrl = profileIconId ? profileIconUrl(profileIconId) : null;
  const splashUrl = featuredChampion ? championSplashUrl(featuredChampion) : null;
  const rankEmblem = rank ? rankEmblemUrl(rank.tier) : null;
  const tierColor = rank ? (TIER_COLORS[rank.tier] ?? "#A7BCB5") : null;
  const tierGlow = rank ? (TIER_GLOW[rank.tier] ?? null) : null;
  const isApex = rank && ["MASTER", "GRANDMASTER", "CHALLENGER"].includes(rank.tier);
  const regionFlag = region ? (REGION_FLAGS[region] ?? null) : null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/10"
      style={tierGlow ? { boxShadow: `0 0 48px ${tierGlow}` } : undefined}
    >
      {splashUrl ? (
        <>
          <Image
            fill
            alt=""
            aria-hidden
            src={splashUrl}
            className="object-cover object-[65%_15%]"
            style={{ filter: "saturate(0.6) brightness(0.3)" }}
          />
          <div className="from-background/98 absolute inset-0 bg-gradient-to-r via-background/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-transparent to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0 bg-surface" />
      )}

      <div className="relative flex items-end gap-5 p-6 pb-5">
        <div className="relative shrink-0">
          <div
            className="h-20 w-20 overflow-hidden rounded-full border-2"
            style={{ borderColor: tierColor ?? "#A7BCB5" }}
          >
            {iconUrl ? (
              <Image
                src={iconUrl}
                alt={displayName}
                width={80}
                height={80}
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-surface-2" />
            )}
          </div>
          {rankEmblem && (
            <div className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-background/90 shadow-lg">
              <Image src={rankEmblem} alt={rank!.tier} width={26} height={26} unoptimized />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 pb-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold leading-tight text-white drop-shadow-md">
              {displayName}
            </h1>
            {regionFlag && (
              <span className="text-lg leading-none" title={region ?? ""}>
                {regionFlag}
              </span>
            )}
            {rank?.hotStreak && (
              <span className="flex items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] font-bold text-warning">
                <Flame className="h-3 w-3" /> HOT STREAK
              </span>
            )}
          </div>

          {rank && !isPrivate ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-sm font-bold"
                style={{
                  background: `${tierColor}20`,
                  color: tierColor ?? "#A7BCB5",
                  border: `1px solid ${tierColor}40`,
                }}
              >
                {isApex && (
                  <span
                    className="h-1.5 w-1.5 animate-pulse rounded-full"
                    style={{ background: tierColor ?? "#A7BCB5" }}
                  />
                )}
                {TIER_LABELS[rank.tier] ?? rank.tier}
                {!isApex && ` ${rank.division}`}
                {" · "}
                {rank.lp} LP
              </span>
              <span className="text-sm text-text-muted">
                {rank.wins}W {rank.losses}L
              </span>
            </div>
          ) : !isPrivate ? (
            <p className="mt-1 text-sm text-text-muted">Unranked</p>
          ) : null}

          <p className="mt-2 flex items-center gap-1.5 text-xs text-text-muted/50">
            <Calendar className="h-3 w-3" />
            Member since{" "}
            {new Date(joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        </div>
      </div>
    </div>
  );
}
