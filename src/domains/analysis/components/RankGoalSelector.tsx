"use client";

import type { RankTier, RankDivision } from "@/types/common.types";
import type { CurrentRank } from "@/domains/riot";

const TIERS: RankTier[] = [
  "IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM",
  "EMERALD", "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER",
];

const DIVISIONS: RankDivision[] = ["IV", "III", "II", "I"];

const SINGLE_DIVISION_TIERS: RankTier[] = ["MASTER", "GRANDMASTER", "CHALLENGER"];

const TIER_LABELS: Record<RankTier, string> = {
  IRON: "Iron", BRONZE: "Bronze", SILVER: "Silver", GOLD: "Gold",
  PLATINUM: "Platinum", EMERALD: "Emerald", DIAMOND: "Diamond",
  MASTER: "Master", GRANDMASTER: "Grandmaster", CHALLENGER: "Challenger",
};

export interface RankGoal {
  tier: RankTier;
  division: RankDivision;
}

interface RankGoalSelectorProps {
  currentRank: CurrentRank | null;
  value: RankGoal | null;
  onChange: (goal: RankGoal | null) => void;
}

export function RankGoalSelector({ currentRank, value, onChange }: RankGoalSelectorProps) {
  const currentTierIdx = currentRank ? TIERS.indexOf(currentRank.tier as RankTier) : -1;

  const availableTiers = TIERS.filter((_, i) => {
    if (currentTierIdx < 0) return true;
    return i > currentTierIdx && i <= currentTierIdx + 2;
  });

  function handleTierChange(tier: RankTier) {
    const singleDiv = SINGLE_DIVISION_TIERS.includes(tier);
    onChange({ tier, division: singleDiv ? "I" : (value?.division ?? "IV") });
  }

  function handleDivisionChange(division: RankDivision) {
    if (!value) return;
    onChange({ tier: value.tier, division });
  }

  const isSingleDiv = value ? SINGLE_DIVISION_TIERS.includes(value.tier) : false;

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-6">
        <div>
          <p className="mb-1 text-xs text-text-muted">Current Rank</p>
          <p className="text-sm font-semibold text-text">
            {currentRank
              ? `${TIER_LABELS[currentRank.tier as RankTier]} ${currentRank.division} — ${currentRank.lp} LP`
              : "Unranked"}
          </p>
        </div>

        <span className="hidden text-lg text-text-muted sm:block">→</span>

        <div className="flex items-end gap-2">
          <div>
            <p className="mb-1 text-xs text-text-muted">Goal Tier</p>
            <select
              value={value?.tier ?? ""}
              onChange={(e) => handleTierChange(e.target.value as RankTier)}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text"
            >
              <option value="">Choose...</option>
              {availableTiers.map((t) => (
                <option key={t} value={t}>{TIER_LABELS[t]}</option>
              ))}
            </select>
          </div>

          {value && !isSingleDiv && (
            <div>
              <p className="mb-1 text-xs text-text-muted">Division</p>
              <select
                value={value.division}
                onChange={(e) => handleDivisionChange(e.target.value as RankDivision)}
                className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text"
              >
                {DIVISIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
