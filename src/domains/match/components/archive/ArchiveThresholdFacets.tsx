"use client";

import { NumberField } from "@/domains/match/components/archive/FacetControls";
import type { ArchiveFilters } from "@/domains/match/services/matchArchiveFilters";

interface ArchiveThresholdFacetsProps {
  draft: ArchiveFilters;
  onChange: (patch: Partial<ArchiveFilters>) => void;
}

/**
 * The bounds mirror `archiveFilterSchema` exactly. They are here to stop a typo becoming a 400
 * rather than to enforce anything — the server refuses an out-of-range threshold either way.
 */
const FIELDS = [
  { key: "minKda", label: "KDA at least", max: 100, step: 0.1 },
  { key: "minCsPerMinute", label: "CS/min at least", max: 20, step: 0.1 },
  { key: "minVisionScore", label: "Vision at least", max: 500, step: 1 },
  { key: "minKills", label: "Kills at least", max: 100, step: 1 },
  { key: "maxDeaths", label: "Deaths at most", max: 100, step: 1 },
  { key: "minDuration", label: "Minutes at least", max: 200, step: 1 },
  { key: "maxDuration", label: "Minutes at most", max: 200, step: 1 },
] as const;

export function ArchiveThresholdFacets({
  draft,
  onChange,
}: ArchiveThresholdFacetsProps): React.JSX.Element {
  return (
    <div className="space-y-2">
      {FIELDS.map(({ key, label, max, step }) => (
        <NumberField
          key={key}
          label={label}
          value={draft[key]}
          max={max}
          step={step}
          onChange={(value) => onChange({ [key]: value })}
        />
      ))}
    </div>
  );
}
