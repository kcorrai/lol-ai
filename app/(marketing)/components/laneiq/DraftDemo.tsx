"use client";

import { ChampionIcon } from "@/components/ui/ChampionIcon";
import type { DraftActionKind, DraftSide } from "@/domains/draft";
import { Frame } from "./ArsenalFrame";
import {
  DEMO_DRAFT,
  DEMO_GAME,
  DEMO_LOCKED_OUT,
  DRAFT_FINAL,
  draftFrame,
  isFilled,
  type DraftFrame,
} from "./draftDemoTimeline";
import { useDemoClock } from "./useDemoClock";

const SIDE_STYLE: Record<DraftSide, { label: string; text: string; slot: string }> = {
  BLUE: { label: "Blue", text: "text-accent-blue", slot: "border-accent-blue/40 bg-accent-blue/5" },
  RED: { label: "Red", text: "text-danger", slot: "border-danger/40 bg-danger/5" },
};

/**
 * The Draft Room, drafting: one whole game of a fearless series, ban by ban and pick by pick,
 * in the order the real room enforces, with the turn clock running.
 *
 * It used to be six picks sliding in once and stopping, which said "there are picks" but not
 * the thing the room is for — two teams taking turns against a clock, with bans between.
 */
export function DraftVisual(): React.ReactElement {
  const { ref, elapsed } = useDemoClock<HTMLDivElement>();
  const frame = elapsed === null ? DRAFT_FINAL : draftFrame(elapsed);

  return (
    <div ref={ref} aria-hidden>
      <Frame label={`// Game ${DEMO_GAME} of 5 · fearless`}>
        <div className="grid grid-cols-2 gap-3">
          <SideColumn side="BLUE" frame={frame} />
          <SideColumn side="RED" frame={frame} />
        </div>
        <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-border pt-3">
          <span className="font-mono text-[11px] text-accent">
            {frame.current
              ? `${SIDE_STYLE[frame.current.side].label} ${frame.current.kind.toLowerCase()} ${frame.current.slot + 1} · 00:${String(frame.seconds).padStart(2, "0")}`
              : "Draft locked in"}
          </span>
          <span className="font-mono text-[10.5px] text-text-muted">
            {DEMO_LOCKED_OUT} champions locked out
          </span>
        </div>
      </Frame>
    </div>
  );
}

function SideColumn({ side, frame }: { side: DraftSide; frame: DraftFrame }): React.ReactElement {
  const style = SIDE_STYLE[side];
  const { bans, picks } = DEMO_DRAFT[side];
  return (
    <div className="grid content-start gap-1.5">
      <span className={`font-mono text-[10px] uppercase tracking-label ${style.text}`}>
        {style.label}
      </span>
      <div className="flex gap-1">
        {bans.map((name, slot) => (
          <Slot key={name} side={side} kind="BAN" slot={slot} name={name} frame={frame} />
        ))}
      </div>
      {picks.map((name, slot) => (
        <Slot key={name} side={side} kind="PICK" slot={slot} name={name} frame={frame} />
      ))}
    </div>
  );
}

function Slot({
  side,
  kind,
  slot,
  name,
  frame,
}: {
  side: DraftSide;
  kind: DraftActionKind;
  slot: number;
  name: string;
  frame: DraftFrame;
}): React.ReactElement {
  const filled = isFilled(frame.locked, side, kind, slot);
  const current =
    frame.current?.side === side && frame.current.kind === kind && frame.current.slot === slot;
  const ring = current
    ? "border-accent animate-pulse"
    : filled
      ? SIDE_STYLE[side].slot
      : "border-line-1";

  if (kind === "BAN") {
    // Bans are smaller and greyed, the way the real room shows a champion nobody can take.
    return (
      <span className={`flex h-[22px] w-[22px] items-center justify-center border ${ring}`}>
        {filled ? (
          <span className="opacity-60 grayscale" style={{ lineHeight: 0 }}>
            <ChampionIcon name={name} size={18} />
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <div
      className={`flex h-[34px] items-center gap-2 border px-2 transition-colors duration-200 ${ring}`}
    >
      {filled ? (
        <>
          <ChampionIcon name={name} size={22} />
          <span className="truncate text-[11.5px] text-text-body">{name}</span>
        </>
      ) : (
        <span className="font-mono text-[10px] uppercase tracking-label text-text-faint">
          {current ? "Picking…" : `Pick ${slot + 1}`}
        </span>
      )}
    </div>
  );
}
