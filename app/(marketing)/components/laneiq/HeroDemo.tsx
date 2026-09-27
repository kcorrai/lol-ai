"use client";

import { ChampionIcon } from "@/components/ui/ChampionIcon";
import {
  DEMO_FINAL,
  DEMO_GRADES,
  DEMO_MATCHES,
  DEMO_STEPS,
  demoFrame,
  stepIndex,
} from "./heroDemoTimeline";
import { useDemoClock } from "./useDemoClock";

const TONE_FILL = { accent: "bg-accent", info: "bg-info", danger: "bg-danger" } as const;

/**
 * The hero's promise, played out: a Riot ID goes in, ten games are read, one habit comes out.
 *
 * A visitor was asked to paste their ID before seeing what that does. This shows the round
 * trip beside the form, in the words the form itself uses while it works, and lands on the
 * sample report's own verdict — the report further down is this one, finished.
 *
 * Every row is rendered from the first frame and only fades in, so the card never changes
 * height while it plays and the hero under it does not jump.
 *
 * Wide screens only. On a phone the form is the whole first screen and the sample report
 * follows it directly, so this would only push the report further down.
 *
 * Decorative to assistive tech: the form beside it is the real control, and a region that
 * rewrote itself every ninety milliseconds would be noise to a screen reader.
 */
export function HeroDemo(): React.ReactElement {
  const { ref, elapsed } = useDemoClock<HTMLDivElement>();
  const frame = elapsed === null ? DEMO_FINAL : demoFrame(elapsed);
  const active = stepIndex(frame.stage);
  const typing = frame.stage === "typing";

  return (
    <div
      ref={ref}
      aria-hidden
      className="notch-lg hidden w-[380px] shrink-0 border border-border bg-[var(--surface-glass)] p-5 backdrop-blur-[10px] lg:block"
    >
      <div className="flex items-center justify-between">
        <span className="hud-label">{"// Example"}</span>
        <span className="font-mono text-[10px] uppercase tracking-label text-text-faint">
          ~90s, sped up
        </span>
      </div>

      <div className="mt-3 flex h-10 items-center border border-line-2 bg-background px-3 font-mono text-[13px] text-text">
        {frame.typed}
        {typing ? (
          <span className="ml-px inline-block h-4 w-[7px] animate-pulse bg-accent" />
        ) : null}
      </div>

      <ul className="mt-3 grid gap-1">
        {DEMO_STEPS.map((label, i) => {
          const finished = active === null ? !typing : i < active;
          const current = i === active;
          const count =
            i === 0 && (current || finished)
              ? `${frame.matches}/10`
              : i === 1 && (current || finished)
                ? frame.events.toLocaleString("en-US")
                : "";
          return (
            <li
              key={label}
              className={`flex justify-between gap-3 font-mono text-[10.5px] uppercase tracking-label transition-colors duration-200 ${
                current
                  ? "text-accent"
                  : finished
                    ? "text-text-muted"
                    : "text-text-faint opacity-50"
              }`}
            >
              <span>
                {finished ? "✓ " : "· "}
                {label}
              </span>
              <span className="tabular-nums">{count}</span>
            </li>
          );
        })}
      </ul>

      {/* The ten games, each arriving as it is fetched: the champion, and a win or loss edge. */}
      <div className="mt-3.5 grid grid-cols-10 gap-1">
        {DEMO_MATCHES.map((m, i) => (
          <span
            key={i}
            className={`flex justify-center border-b-2 pb-1 transition-opacity duration-200 ${
              m.win ? "border-accent" : "border-danger"
            } ${i < frame.matches ? "opacity-100" : "opacity-0"}`}
          >
            <ChampionIcon name={m.champion} size={24} />
          </span>
        ))}
      </div>

      <div className="mt-3.5 grid gap-1.5">
        {DEMO_GRADES.map((g) => (
          <div key={g.label} className="grid grid-cols-[1fr_96px_22px] items-center gap-2.5">
            <span className="text-[11.5px] text-text-body">{g.label}</span>
            <span className="h-1 overflow-hidden bg-line-1">
              <span
                className={`block h-full ${TONE_FILL[g.tone]}`}
                style={{ width: `${g.value * frame.grading}%` }}
              />
            </span>
            <span className="text-right font-mono text-[11px] tabular-nums text-text">
              {frame.grading > 0 ? Math.round(g.value * frame.grading) : "—"}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-2 border-t border-border pt-3.5">
        <Line shown={frame.verdictLines >= 1}>
          <span className="flex items-center gap-2">
            <span className="font-mono text-[10.5px] uppercase tracking-label text-accent">
              {"// Fix this first"}
            </span>
          </span>
          <span className="mt-1 block font-display text-[14.5px] font-bold uppercase leading-snug text-text">
            You lose the 20 seconds after full clear.
          </span>
        </Line>
        <Line shown={frame.verdictLines >= 2}>
          <span className="block border-l-2 border-l-danger pl-2.5 text-[12px] text-text-body">
            No vision before the river{" "}
            <span className="font-mono text-[10.5px] text-text-muted">· 11 deaths</span>
          </span>
        </Line>
        <Line shown={frame.verdictLines >= 3}>
          <span className="flex items-baseline justify-between gap-3 text-[12px] text-text">
            <span>
              <span className="text-accent">→</span> Ward the pit 45s before spawn.
            </span>
            <span className="whitespace-nowrap font-mono text-[10.5px] text-accent">+6 LP</span>
          </span>
        </Line>
      </div>
    </div>
  );
}

function Line({
  shown,
  children,
}: {
  shown: boolean;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div
      className={`transition-all duration-300 ease-out ${
        shown ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
      }`}
    >
      {children}
    </div>
  );
}
