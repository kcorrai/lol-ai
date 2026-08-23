"use client";

import { useEffect, useRef } from "react";
import { StoryEventIcon } from "@/domains/match/components/story/StoryEventGlyph";
import { fadeAt } from "@/domains/match/story/storyEventStyle";
import { describeStoryEvent } from "@/domains/match/story/storyNarration";
import type { MatchStoryEvent } from "@/domains/match";

interface MatchStoryFeedProps {
  /** Already narrowed to the kinds whose chips are on. */
  events: MatchStoryEvent[];
  minute: number;
  userPuuid: string | null;
  onSeek: (minute: number) => void;
}

/**
 * The match in words, up to the playhead — the part of this panel a screen reader can actually
 * use, and the only surface that can say "Aatrox — 3-kill" rather than draw a shape for it.
 *
 * Events after the current minute are absent rather than greyed out. The feed is the story so far;
 * a list of what is about to happen spoils the scrub and buries the row the reader is on.
 */
export function MatchStoryFeed({
  events,
  minute,
  userPuuid,
  onSeek,
}: MatchStoryFeedProps): React.JSX.Element {
  const currentRef = useRef<HTMLLIElement>(null);
  const past = events.filter((e) => e.minute <= minute);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "nearest" });
  }, [minute]);

  return (
    <div className="border-t border-line-1">
      <span className="block px-5 pt-3 font-mono text-[10.5px] uppercase tracking-label text-fg-3">
        {"// EVENTS"}
      </span>

      {past.length === 0 ? (
        <p className="px-5 py-5 text-sm text-text-muted">
          Nothing has happened yet — scrub forward or press play.
        </p>
      ) : (
        <ul className="max-h-[260px] list-none overflow-y-auto py-2">
          {past.map((event, i) => {
            const isCurrent = event.minute === minute;
            const isSelf = !!userPuuid && event.actor?.puuid === userPuuid;
            return (
              <li
                key={`${event.kind}-${event.timestampMs}-${i}`}
                ref={isCurrent ? currentRef : undefined}
                style={{ opacity: fadeAt(event.minute, minute) }}
                className={`border-l-2 ${isCurrent ? "border-acid-500 bg-acid-500/[0.07] text-fg-1" : "border-transparent text-fg-3"}`}
              >
                <button
                  type="button"
                  onClick={() => onSeek(event.minute)}
                  className="grid w-full grid-cols-[46px_20px_1fr_auto] items-center gap-2.5 px-5 py-1.5 text-left font-mono text-[11.5px]"
                >
                  <span className="text-fg-4">{event.minute}m</span>
                  <StoryEventIcon kind={event.kind} />
                  <span className="truncate">
                    {isSelf && <span className="text-acid-500">● </span>}
                    {describeStoryEvent(event)}
                  </span>
                  <span className="text-fg-1">{event.actor?.position ?? ""}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
