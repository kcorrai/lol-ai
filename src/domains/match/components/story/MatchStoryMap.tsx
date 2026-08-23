"use client";

import { RiftMap } from "@/components/ui/RiftMap";
import { StoryEventGlyph } from "@/domains/match/components/story/StoryEventGlyph";
import { fadeAt, riftPercent } from "@/domains/match/story/storyEventStyle";
import type { MatchStoryEvent } from "@/domains/match";

interface MatchStoryMapProps {
  /** Already narrowed to the kinds whose chips are on. */
  events: MatchStoryEvent[];
  minute: number;
}

/**
 * Where the match has happened, up to the playhead. `RiftMap` draws the schematic and this only
 * adds the pins, in the same 0-100 box, so the two never drift apart.
 *
 * No path is drawn between pins, and that is not an omission: a timeline frame carries gold, level
 * and CS but no position, so the only positions we have are the moments events fired. Joining them
 * would be inventing movement that was never recorded.
 */
export function MatchStoryMap({ events, minute }: MatchStoryMapProps): React.JSX.Element {
  const pins = events.filter((e) => e.position !== null && e.minute <= minute);

  return (
    <div className="flex flex-col gap-2.5">
      <span className="font-mono text-[10.5px] uppercase tracking-label text-fg-3">
        {"// POSITIONS"}
      </span>

      <div className="relative aspect-square w-full">
        <RiftMap />
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
          preserveAspectRatio="xMidYMid meet"
        >
          {pins.map((event, i) => {
            // Non-null: filtered above. Narrowing through the filter would need a type predicate
            // for a union whose every member has the field, which reads worse than saying so here.
            const at = riftPercent(event.position!);
            const isNewest = minute - event.minute <= 1;
            return (
              <g
                key={`${event.kind}-${event.timestampMs}-${i}`}
                transform={`translate(${at.x},${at.y})`}
                className={isNewest ? "motion-safe:animate-pulse" : undefined}
              >
                <StoryEventGlyph
                  kind={event.kind}
                  radius={isNewest ? 2.8 : 2.2}
                  opacity={fadeAt(event.minute, minute)}
                />
              </g>
            );
          })}
        </svg>
      </div>

      <p className="font-mono text-[10px] leading-relaxed text-fg-4">
        Pins mark where an event happened, fading over the minutes after. Movement between them is
        not recorded, so no path is drawn.
      </p>
    </div>
  );
}
