"use client";

import { StoryEventIcon } from "@/domains/match/components/story/StoryEventGlyph";
import { STORY_EVENT_STYLE, STORY_KIND_ORDER } from "@/domains/match/story/storyEventStyle";
import type { StoryEventKind } from "@/domains/match";

interface MatchStoryFiltersProps {
  activeKinds: ReadonlySet<StoryEventKind>;
  onToggle: (kind: StoryEventKind) => void;
}

/**
 * Which kinds of beat the reader is here for. This is the first line of defence against a busy
 * match: wards alone can outnumber everything else put together, and turning them off is the
 * difference between forty legible marks and a smear.
 *
 * Each chip carries the kind's own glyph rather than a colour swatch, so the chip teaches the mark
 * the reader then has to recognise on the chart and the map.
 */
export function MatchStoryFilters({
  activeKinds,
  onToggle,
}: MatchStoryFiltersProps): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-1.5">
      {STORY_KIND_ORDER.map((kind) => {
        const isOn = activeKinds.has(kind);
        return (
          <button
            key={kind}
            type="button"
            onClick={() => onToggle(kind)}
            aria-pressed={isOn}
            className={`inline-flex items-center gap-1.5 border border-line-2 bg-ink-700 px-2 py-1 font-mono text-[10px] uppercase tracking-label transition-opacity ${
              isOn ? "text-fg-3" : "text-fg-3 opacity-35"
            }`}
          >
            <StoryEventIcon kind={kind} size={11} />
            {STORY_EVENT_STYLE[kind].label}
          </button>
        );
      })}
    </div>
  );
}
