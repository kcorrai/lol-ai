import { Frame, Row } from "./ArsenalFrame";

/**
 * The three text-only Arsenal illustrations. The two that draw a board — the
 * draft and the scoreboard — live in `ArsenalBoards` because they need champion
 * art and client-side motion; these are static and stay server-rendered.
 *
 * Everything stated here is a real product default, cited where it is not obvious.
 * They are worked examples, not live queries.
 */

// ── AI Coach ──────────────────────────────────────────────────────────────
// Depths are the real ones: session review slices 5 matches, climb roadmap 10
// (app/(app)/coaching/PageClient.tsx:62,68).
const REPORTS: ReadonlyArray<{ name: string; reads: string; out: string }> = [
  { name: "Session review", reads: "5 games", out: "What went wrong tonight" },
  { name: "Climb roadmap", reads: "10 games", out: "The path to the next rank" },
  { name: "ARAM review", reads: "5 ARAM games", out: "Howling Abyss only" },
];

export function CoachVisual(): React.ReactElement {
  return (
    <Frame label="// Report types">
      {REPORTS.map((r) => (
        <Row key={r.name}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-display text-[13px] font-bold uppercase tracking-[0.05em] text-text">
              {r.name}
            </span>
            <span className="shrink-0 font-mono text-[11px] text-accent">{r.reads}</span>
          </div>
          <p className="mt-1 text-[12.5px] text-text-muted">{r.out}</p>
        </Row>
      ))}
      <p className="mt-3 font-mono text-[10.5px] uppercase tracking-label text-text-faint">
        Free: 3 a month · Pro: unlimited
      </p>
    </Frame>
  );
}

// ── Academy ───────────────────────────────────────────────────────────────
// A decision drill, one of the five kinds (src/domains/academy/types.ts).
const OPTIONS: ReadonlyArray<{ text: string; verdict: "right" | "wrong" }> = [
  { text: "Freeze it outside your tower", verdict: "right" },
  { text: "Shove and recall", verdict: "wrong" },
  { text: "Trade while it crashes", verdict: "wrong" },
];

export function AcademyVisual(): React.ReactElement {
  return (
    <Frame label="// Decision drill">
      <p className="text-sm leading-relaxed text-text">
        The wave is two casters up and drifting to you. Enemy jungler was last seen top 20s ago.
      </p>
      <div className="mt-3.5 grid gap-2">
        {OPTIONS.map((o) => (
          <div
            key={o.text}
            className={`notch-sm border px-3 py-2 text-[13px] ${
              o.verdict === "right"
                ? "border-accent bg-accent/10 text-text"
                : "border-border bg-surface text-text-muted"
            }`}
          >
            {o.text}
          </div>
        ))}
      </div>
      <p className="mt-3 font-mono text-[10.5px] uppercase tracking-label text-text-faint">
        Then it is measured in your own ranked games
      </p>
    </Frame>
  );
}

// ── Creator kit ───────────────────────────────────────────────────────────
// The five widgets and five commands are the real sets (src/domains/creator/types.ts:9,17).
const COMMANDS = ["!rank", "!session", "!lastgame", "!champs", "!laneiq"];

export function CreatorVisual(): React.ReactElement {
  return (
    <Frame label="// OBS browser source">
      <div className="notch-sm border border-accent/40 bg-background p-3">
        <p className="hud-label">Rank widget</p>
        <p className="mt-1 font-display text-lg font-extrabold uppercase text-text">Emerald IV</p>
        <p className="font-mono text-[11.5px] text-accent">+42 LP today · 6W 3L</p>
      </div>
      <p className="hud-label mt-4">{"// Chat commands"}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {COMMANDS.map((c) => (
          <span
            key={c}
            className="tag-cut border border-border bg-surface px-2 py-1 font-mono text-[11px] text-text-body"
          >
            {c}
          </span>
        ))}
      </div>
      <p className="mt-3 font-mono text-[10.5px] uppercase tracking-label text-text-faint">
        Twitch · Kick · YouTube
      </p>
    </Frame>
  );
}
