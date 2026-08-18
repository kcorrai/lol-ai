"use client";

import type { CareerEventGroup } from "@/domains/analysis/services/careerTimeline.types";

export type TimelineFilter = "all" | CareerEventGroup;

const FILTERS: { id: TimelineFilter; label: string }[] = [
  { id: "all", label: "Everything" },
  { id: "rank", label: "Rank" },
  { id: "champions", label: "Champions" },
  { id: "records", label: "Records" },
  { id: "learning", label: "Learning" },
];

export function TimelineFilters({
  active,
  onChange,
}: {
  active: TimelineFilter;
  onChange: (filter: TimelineFilter) => void;
}): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-px bg-line-1" role="tablist" aria-label="Timeline filter">
      {FILTERS.map((filter) => (
        <button
          key={filter.id}
          type="button"
          role="tab"
          aria-selected={active === filter.id}
          onClick={() => onChange(filter.id)}
          className={`px-3.5 py-2 text-[12px] font-semibold transition-colors ${
            active === filter.id
              ? "bg-accent text-background"
              : "bg-surface text-text-muted hover:text-text"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
