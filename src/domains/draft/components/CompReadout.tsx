"use client";

import { POSITION_LABELS } from "@/domains/meta/positions";
import { HudMeter } from "@/components/dashboard/laneiq/HudPanel";
import type { TeamProfile } from "@/domains/draft/advice/advice.types";

interface Props {
  profile: TeamProfile;
  label: string;
}

/** The comp as it stands, recomputed after every lock. Same arithmetic as the
 *  post-draft evaluation, so the live view and the verdict never disagree. */
export function CompReadout({ profile, label }: Props): React.ReactElement {
  const skewed = profile.adShare >= 70 || profile.apShare >= 70;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between">
        <span className="hud-label">{label}</span>
        {profile.avgWinRate > 0 && (
          <span className="font-mono text-[11.5px] text-text-muted">
            {profile.avgWinRate.toFixed(1)}% avg
          </span>
        )}
      </div>

      <div>
        <div className="mb-1 flex items-baseline justify-between text-[11.5px]">
          <span className="text-text-body">Damage</span>
          <span className={`font-mono ${skewed ? "text-warning" : "text-text-muted"}`}>
            {profile.adShare}% AD · {profile.apShare}% AP
          </span>
        </div>
        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-surface-dark">
          <div className="h-full bg-warning" style={{ width: `${profile.adShare}%` }} />
          <div className="h-full bg-info" style={{ width: `${profile.apShare}%` }} />
        </div>
        {skewed && (
          <p className="mt-1 text-[11px] text-warning">
            One damage type carries this comp — a single resistance item blunts it.
          </p>
        )}
      </div>

      <HudMeter
        value={profile.frontlineScore}
        label="Frontline"
        right={String(profile.frontlineScore)}
        tone={profile.frontlineScore < 40 ? "warn" : "accent"}
      />
      <HudMeter
        value={profile.engageScore}
        label="Engage"
        right={String(profile.engageScore)}
        tone="info"
      />

      {profile.missingLanes.length > 0 && profile.missingLanes.length < 5 && (
        <p className="text-[11.5px] text-text-muted">
          Still to fill: {profile.missingLanes.map((l) => POSITION_LABELS[l]).join(", ")}
        </p>
      )}
    </div>
  );
}
