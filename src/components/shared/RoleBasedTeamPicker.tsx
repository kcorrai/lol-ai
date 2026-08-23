"use client";

import { ChampionSelector } from "./ChampionSelector";
import type { Position } from "@/types/common.types";

export interface TeamSelection {
  TOP: string | null;
  JUNGLE: string | null;
  MIDDLE: string | null;
  BOTTOM: string | null;
  UTILITY: string | null;
}

export interface RoleBasedTeamPickerProps {
  value: TeamSelection;
  onChange: (team: TeamSelection) => void;
  label?: string;
  excludeChampions?: string[];
  teamColor?: "blue" | "red";
}

// DDragon tags — excludes Marksman/Support from Jungle and pure non-supports from UTILITY.
// Not 100% precise (Graves = Marksman jungle, Leona = Tank with no Support tag)
// but covers ~90% of realistic picks for each position.
const POSITION_ROLES: Record<Position, string[]> = {
  TOP: ["Fighter", "Tank"],
  JUNGLE: ["Fighter", "Tank", "Assassin", "Mage"],
  MIDDLE: ["Mage", "Assassin", "Fighter"],
  BOTTOM: ["Marksman"],
  UTILITY: ["Support", "Mage", "Tank"],
};

const POSITIONS: { key: Position; label: string }[] = [
  { key: "TOP", label: "Top" },
  { key: "JUNGLE", label: "Jungle" },
  { key: "MIDDLE", label: "Mid" },
  { key: "BOTTOM", label: "ADC" },
  { key: "UTILITY", label: "Support" },
];

export function RoleBasedTeamPicker({
  value,
  onChange,
  label,
  excludeChampions = [],
  teamColor = "blue",
}: RoleBasedTeamPickerProps) {
  const borderClass =
    teamColor === "blue" ? "border-info/30 bg-info/5" : "border-danger/30 bg-danger/5";

  const labelClass = teamColor === "blue" ? "text-info" : "text-danger";

  const selectedInThisPicker = Object.values(value).filter(Boolean) as string[];

  return (
    <div className={`rounded-lg border p-3 ${borderClass}`}>
      {label && <p className={`mb-3 text-sm font-semibold ${labelClass}`}>{label}</p>}
      <div className="space-y-2">
        {POSITIONS.map(({ key, label: posLabel }) => (
          <div key={key} className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-xs text-text-muted">{posLabel}</span>
            <ChampionSelector
              value={value[key]}
              onChange={(champ) => onChange({ ...value, [key]: champ })}
              placeholder={`${posLabel} select`}
              size="sm"
              excludeChampions={[
                ...excludeChampions,
                ...selectedInThisPicker.filter((c) => c !== value[key]),
              ]}
              filterByRoles={POSITION_ROLES[key]}
              className="flex-1"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
