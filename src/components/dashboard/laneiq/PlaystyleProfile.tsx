"use client";

import { HudMeter, HudPanel } from "./HudPanel";
import type {
  ConsistencyLevel,
  PlayerPerformanceProfile,
  PlaystyleType,
} from "@/domains/analysis/types/analysis.types";

const PLAYSTYLE_BLURB: Record<PlaystyleType, string> = {
  aggressive:
    "High kill participation, low vision, deaths front-loaded. You look for fights before you have information.",
  farming:
    "Wave-first. Your CS holds up, but you are rarely near the fight that decides the game.",
  supportive:
    "You show up for your team's fights and trade your own resources to do it.",
  balanced: "No single axis dominates. Your ceiling comes from picking one and pushing it.",
  passive: "Low participation and low risk. Games are decided elsewhere on the map.",
};

const CONSISTENCY_COLOR: Record<ConsistencyLevel, string> = {
  high: "text-accent",
  medium: "text-text",
  low: "text-danger",
};

function Row({
  label,
  value,
  color = "text-text",
}: {
  label: string;
  value: string;
  color?: string;
}): React.ReactElement {
  return (
    <div className="flex justify-between gap-3 text-[13.5px]">
      <span className="text-text-muted">{label}</span>
      <span className={color}>{value}</span>
    </div>
  );
}

export function PlaystyleProfile({
  profile,
  isLoading,
}: {
  profile: PlayerPerformanceProfile | undefined;
  isLoading: boolean;
}): React.ReactElement | null {
  if (isLoading) {
    return <HudPanel className="h-[340px] animate-pulse" >{null}</HudPanel>;
  }
  if (!profile) return null;

  const m = profile.avgMetrics;
  // Vision per minute tops out around 1.6 for the best players; scale to that.
  const visionPct = Math.min(100, Math.round((m.visionScorePerMinute / 1.6) * 100));

  // Kill participation is a share and cannot exceed 100%, but the aggregate
  // computes it against `avg(kills) + 5` instead of real team kills
  // (matchAnalysisService.ts), so it overshoots. Clamp rather than print "118%".
  const kpPct = Math.min(100, Math.round(m.killParticipation * 100));
  const damagePct = Math.min(100, Math.round(m.damageShare * 100));

  return (
    <HudPanel className="p-5">
      <p className="hud-label mb-3.5">{"// Playstyle profile"}</p>
      <p className="font-display text-[26px] font-extrabold uppercase tracking-[0.03em] text-accent">
        {profile.playstyle}
      </p>
      <p className="mb-4 mt-2 text-[13.5px] text-text-body">
        {PLAYSTYLE_BLURB[profile.playstyle]}
      </p>

      <div className="grid gap-3">
        <HudMeter value={kpPct} label="Kill participation" right={`${kpPct}%`} />
        <HudMeter value={damagePct} tone="info" label="Damage share" right={`${damagePct}%`} />
        <HudMeter
          value={visionPct}
          tone={visionPct < 40 ? "danger" : "accent"}
          label="Vision / min"
          right={m.visionScorePerMinute.toFixed(2)}
        />
      </div>

      <div className="mt-4 grid gap-2 border-t border-border pt-4">
        <Row label="Strongest" value={profile.strongestArea} />
        <Row label="Growth area" value={profile.weakestArea} color="text-warning" />
        <Row
          label="CS consistency"
          value={profile.csConsistency}
          color={`capitalize ${CONSISTENCY_COLOR[profile.csConsistency]}`}
        />
        <Row
          label="Vision consistency"
          value={profile.visionConsistency}
          color={`capitalize ${CONSISTENCY_COLOR[profile.visionConsistency]}`}
        />
        <Row label="Deaths cluster" value={profile.deathCluster.replace("_", " ")} color="capitalize text-text" />
      </div>
    </HudPanel>
  );
}
