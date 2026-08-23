"use client";

import { useEffect, useMemo, useState } from "react";
import { useMatchStory } from "@/hooks/useMatchStory";
import { MatchStoryChart } from "@/domains/match/components/story/MatchStoryChart";
import { MatchStoryControls } from "@/domains/match/components/story/MatchStoryControls";
import { MatchStoryFeed } from "@/domains/match/components/story/MatchStoryFeed";
import { MatchStoryFilters } from "@/domains/match/components/story/MatchStoryFilters";
import { MatchStoryMap } from "@/domains/match/components/story/MatchStoryMap";
import { STORY_KIND_ORDER } from "@/domains/match/story/storyEventStyle";
import { formatGoldDiff } from "@/domains/match/story/storyNarration";
import type { StoryEventKind } from "@/domains/match";

interface MatchStoryPanelProps {
  matchId: string;
  userPuuid: string | null;
  durationSeconds: number;
  won: boolean;
}

function Shell({ subtitle, children }: { subtitle: string; children: React.ReactNode }) {
  return (
    <section className="notch border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line-1 px-5 py-3">
        <span className="hud-label">{"// MATCH STORY"}</span>
        <span className="font-mono text-[10.5px] uppercase tracking-wide text-fg-4">
          {subtitle}
        </span>
      </div>
      {children}
    </section>
  );
}

/**
 * The match, minute by minute — the screen for the timeline LA-45 captures, drawn to the LA-52
 * design (docs/design/la-52-match-story/). Everything above it on this page is an end-of-game
 * total, which can say a lane was lost but never when; this is the first surface that answers
 * when, so it sits directly under the numbers it explains.
 *
 * One playhead drives three readings of the same instant: the gold curve says how it was going,
 * the map says where it happened, the feed says what it was.
 */
export function MatchStoryPanel({
  matchId,
  userPuuid,
  durationSeconds,
  won,
}: MatchStoryPanelProps): React.JSX.Element {
  const { data, isLoading, isError } = useMatchStory(matchId);
  const [minute, setMinute] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [activeKinds, setActiveKinds] = useState<ReadonlySet<StoryEventKind>>(
    () => new Set(STORY_KIND_ORDER)
  );

  const story = data && data.hasTimeline ? data : null;

  // The payload carries no duration. The last frame can fall a minute short of the final fight, so
  // the game's own length is the floor and the data's last beat is what extends it.
  const duration = useMemo(() => {
    const gameMinutes = Math.max(0, Math.floor(durationSeconds / 60));
    if (!story) return gameMinutes;
    const lastFrame = story.frames.at(-1)?.minute ?? 0;
    const lastEvent = story.events.at(-1)?.minute ?? 0;
    return Math.max(gameMinutes, lastFrame, lastEvent, 1);
  }, [story, durationSeconds]);

  const events = useMemo(
    () => (story ? story.events.filter((e) => activeKinds.has(e.kind)) : []),
    [story, activeKinds]
  );

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setMinute((current) => {
        if (current >= duration) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1000 / speed);
    return () => clearInterval(timer);
  }, [playing, speed, duration]);

  const seek = (next: number): void => setMinute(Math.min(Math.max(Math.round(next), 0), duration));

  // Steps between minutes that hold something, not between minutes — most of a match holds nothing
  // and stepping through it one empty minute at a time is what the scrubber is already for.
  const stepEvent = (direction: -1 | 1): void => {
    const minutes = [...new Set(events.map((e) => e.minute))].sort((a, b) => a - b);
    const target =
      direction > 0
        ? minutes.find((m) => m > minute)
        : [...minutes].reverse().find((m) => m < minute);
    if (target !== undefined) seek(target);
  };

  const toggleKind = (kind: StoryEventKind): void =>
    setActiveKinds((current) => {
      const next = new Set(current);
      if (!next.delete(kind)) next.add(kind);
      return next;
    });

  if (isLoading) {
    return (
      <Shell subtitle="Loading">
        <div className="flex flex-col gap-2.5 p-5">
          <div className="skeleton h-5 w-2/5" />
          <div className="skeleton h-44 w-full" />
          <div className="skeleton h-5 w-3/5" />
        </div>
      </Shell>
    );
  }

  // A match with no captured timeline is every game synced before LA-45 — an ordinary state, not a
  // failure. An error from the endpoint means the match is not this caller's, which reads the same
  // way here: there is nothing minute-by-minute to show.
  if (isError || !story) {
    return (
      <Shell subtitle="No record">
        <div className="bg-hero-fade">
          <p className="max-w-[52ch] px-5 py-6 text-[13.5px] leading-relaxed text-text-body">
            No minute-by-minute record for this match. Games synced from now on carry one, with
            kills, objectives and wards you can scrub through — this one predates that.
          </p>
        </div>
      </Shell>
    );
  }

  const frame = story.frames.find((f) => f.minute === minute) ?? story.frames.at(-1);
  const gold = formatGoldDiff(frame?.teamGoldDiff ?? 0);

  return (
    <Shell subtitle={`${Math.floor(durationSeconds / 60)}m · ${won ? "Victory" : "Defeat"}`}>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col border-b border-line-1 lg:border-b-0 lg:border-r">
          <div className="flex flex-wrap items-center justify-between gap-2.5 px-5 pb-2 pt-3">
            <MatchStoryFilters activeKinds={activeKinds} onToggle={toggleKind} />
            <span
              className="font-mono text-[13px] font-bold tabular-nums"
              style={{ color: gold.teamId === 100 ? "var(--blue-500)" : "var(--red-500)" }}
            >
              {gold.text} · {minute}m
            </span>
          </div>

          <MatchStoryChart
            frames={story.frames}
            events={events}
            minute={minute}
            duration={duration}
            onSeek={seek}
          />

          <MatchStoryControls
            minute={minute}
            duration={duration}
            playing={playing}
            speed={speed}
            onSeek={seek}
            onStepEvent={stepEvent}
            onTogglePlay={() => setPlaying((p) => !p)}
            onSpeedChange={setSpeed}
          />
        </div>

        <aside className="p-4">
          <MatchStoryMap events={events} minute={minute} />
        </aside>
      </div>

      <MatchStoryFeed events={events} minute={minute} userPuuid={userPuuid} onSeek={seek} />
    </Shell>
  );
}
