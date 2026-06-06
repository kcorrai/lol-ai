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

// DDragon tags map cleanly to Top/Mid/ADC but not to Jungle/Support
// (e.g. Graves = Marksman, Ivern = Support, Leona = Tank with no Support tag).
// Jungle and Support show all champions; the remaining three are filtered by class.
const POSITION_ROLES: Record<Position, string[] | undefined> = {
  TOP:     ["Fighter", "Tank"],
  JUNGLE:  undefined,
  MIDDLE:  ["Mage", "Assassin", "Fighter"],
  BOTTOM:  ["Marksman"],
  UTILITY: undefined,
};

const POSITIONS: { key: Position; label: string }[] = [
  { key: "TOP", label: "Top" },
  { key: "JUNGLE", label: "Orman" },
  { key: "MIDDLE", label: "Mid" },
  { key: "BOTTOM", label: "ADC" },
  { key: "UTILITY", label: "Destek" },
];

export function RoleBasedTeamPicker({
  value,
  onChange,
  label,
  excludeChampions = [],
  teamColor = "blue",
}: RoleBasedTeamPickerProps) {
  const borderClass =
    teamColor === "blue"
      ? "border-blue-500/30 bg-blue-500/5"
      : "border-red-500/30 bg-red-500/5";

  const labelClass =
    teamColor === "blue" ? "text-blue-400" : "text-red-400";

  const selectedInThisPicker = Object.values(value).filter(Boolean) as string[];

  return (
    <div className={`rounded-lg border p-3 ${borderClass}`}>
      {label && (
        <p className={`mb-3 text-sm font-semibold ${labelClass}`}>{label}</p>
      )}
      <div className="space-y-2">
        {POSITIONS.map(({ key, label: posLabel }) => (
          <div key={key} className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-xs text-text-muted">{posLabel}</span>
            <ChampionSelector
              value={value[key]}
              onChange={(champ) => onChange({ ...value, [key]: champ })}
              placeholder={`${posLabel} seç`}
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
