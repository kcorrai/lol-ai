"use client";

import type { Position } from "@prisma/client";
import { ChipGroup, FacetLabel } from "@/domains/match/components/archive/FacetControls";
import { POSITIONS, positionLabel, queueLabel } from "@/domains/match/archive/archiveLabels";
import { fromDateInput, toDateInput } from "@/domains/match/archive/archiveDates";
import type { ArchiveOptions } from "@/hooks/useArchiveOptions";
import type { ArchiveFilters } from "@/domains/match/services/matchArchiveFilters";
import { cn } from "@/lib/utils";

interface ArchiveCoreFacetsProps {
  draft: ArchiveFilters;
  onChange: (patch: Partial<ArchiveFilters>) => void;
  options: ArchiveOptions | undefined;
}

const RESULTS = [
  { value: undefined, label: "Any" },
  { value: "win" as const, label: "Wins" },
  { value: "loss" as const, label: "Losses" },
];

export function ArchiveCoreFacets({
  draft,
  onChange,
  options,
}: ArchiveCoreFacetsProps): React.JSX.Element {
  return (
    <div className="space-y-4">
      {/* Champions, patches and queues come from the player's own archive rather than from the full
          game — offering a champion they have never played is offering a search that cannot hit. */}
      <ChipGroup
        label="Champion"
        options={options?.champions ?? []}
        selected={draft.champions ?? []}
        onToggle={(champion) => onChange({ champions: toggle(draft.champions, champion) })}
        emptyHint="No matches synced yet."
      />

      <ChipGroup<Position>
        label="Role"
        options={POSITIONS}
        selected={draft.positions ?? []}
        onToggle={(position) => onChange({ positions: toggle(draft.positions, position) })}
        renderLabel={positionLabel}
      />

      <ChipGroup
        label="Queue"
        options={options?.queueTypes ?? []}
        selected={draft.queueTypes ?? []}
        onToggle={(queue) => onChange({ queueTypes: toggleQueue(draft.queueTypes, queue) })}
        renderLabel={queueLabel}
        emptyHint="No queues to filter by yet."
      />

      <div>
        <FacetLabel>Result</FacetLabel>
        <div className="flex gap-1">
          {RESULTS.map(({ value, label }) => (
            <button
              key={label}
              type="button"
              aria-pressed={draft.result === value}
              onClick={() => onChange({ result: value })}
              className={cn(
                "tag-cut flex-1 border px-2 py-1 text-[11px] transition-colors",
                draft.result === value
                  ? "border-acid-500 bg-acid-500/10 text-acid-500"
                  : "border-line-2 text-fg-3 hover:border-line-3 hover:text-fg-1"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ChipGroup
        label="Patch"
        options={options?.patches ?? []}
        selected={draft.patch ? [draft.patch] : []}
        // One patch at a time: the API matches it as a prefix, and two prefixes are not a prefix.
        onToggle={(patch) => onChange({ patch: draft.patch === patch ? undefined : patch })}
        emptyHint="No patches to filter by yet."
      />

      <div>
        <FacetLabel>Played between</FacetLabel>
        <div className="flex items-center gap-2">
          <DateInput
            value={toDateInput(draft.from)}
            onChange={(value) => onChange({ from: fromDateInput(value, "start") })}
            label="From"
          />
          <span className="text-fg-4">–</span>
          <DateInput
            value={toDateInput(draft.to)}
            onChange={(value) => onChange({ to: fromDateInput(value, "end") })}
            label="To"
          />
        </div>
      </div>
    </div>
  );
}

function DateInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}): React.JSX.Element {
  return (
    <input
      type="date"
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-8 min-w-0 flex-1 border border-line-2 bg-surface-dark px-2 font-mono text-[11px] text-fg-1 focus:border-acid-500 focus:outline-none"
    />
  );
}

/**
 * The options endpoint hands queues back as plain strings. They are `QueueType` values by
 * construction — it read them off this player's own matches — but nothing here can prove that
 * without a runtime import of the Prisma enum, which is exactly what this feature keeps out of the
 * browser bundle. A wrong one would be refused by the API rather than silently searched for.
 */
function toggleQueue(
  list: ArchiveFilters["queueTypes"],
  value: string
): ArchiveFilters["queueTypes"] {
  return toggle<string>(list, value) as ArchiveFilters["queueTypes"];
}

/** Adds or removes one value, collapsing an emptied list to `undefined` so it drops out of the URL. */
function toggle<T extends string>(list: readonly T[] | undefined, value: T): T[] | undefined {
  const current = list ?? [];
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
  return next.length > 0 ? next : undefined;
}
