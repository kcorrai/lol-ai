import Image from "next/image";
import { rankEmblemUrl } from "@/lib/ddragon";
import { Portrait, Track } from "../screenChrome";
import { MarkNote } from "../markParts";
import { Chip } from "./accountParts";

/**
 * Three of the ten account-band previews: the screens that say what to do next.
 *
 * `historyMarks.tsx` carries the rules all ten follow. Every figure here is invented and the
 * panel says so; the rank crests and the champion art are Riot's.
 */

// ── Rank roadmap ──────────────────────────────────────────────────────────
// `app/(app)/roadmap/page.tsx`: a rank goal, a bar to it, and the 14-day plan under its own
// headings. The crests are the real ones (`rankEmblemUrl`) — a roadmap between two ranks is a
// picture of two ranks, and the words "Platinum I" were doing all the work before.
const TARGETS: readonly { name: string; value: number; state: string }[] = [
  { name: "CS at 10 min", value: 82, state: "On track" },
  { name: "Deaths per game", value: 54, state: "In progress" },
  { name: "Vision per min", value: 100, state: "Completed" },
];

export function RoadmapMark(): React.ReactElement {
  return (
    <div aria-hidden className="grid gap-2.5">
      <div className="flex items-center gap-3 border border-line-1 bg-surface px-3 py-2">
        <Image
          src={rankEmblemUrl("PLATINUM")}
          alt=""
          width={34}
          height={34}
          unoptimized
          className="shrink-0"
        />
        <div className="min-w-0">
          <MarkNote>now</MarkNote>
          <p className="font-mono text-[10.5px] text-text-body">Platinum I · 62 LP</p>
        </div>
        <span className="mx-auto shrink-0 font-mono text-[13px] text-text-faint">&rarr;</span>
        <div className="min-w-0 text-right">
          <MarkNote>goal</MarkNote>
          <p className="font-mono text-[10.5px] text-accent">Diamond IV</p>
        </div>
        <Image
          src={rankEmblemUrl("DIAMOND")}
          alt=""
          width={34}
          height={34}
          unoptimized
          className="shrink-0"
        />
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-2">
          <MarkNote>progress to goal</MarkNote>
          <span className="font-mono text-[10px] tabular-nums text-accent">74%</span>
        </div>
        <Track value={74} className="mt-1.5" />
      </div>

      <div className="grid gap-1.5 border-t border-line-1 pt-2">
        <MarkNote>14-day plan</MarkNote>
        {TARGETS.map((t) => (
          <div key={t.name} className="flex items-center gap-2">
            <span className="w-[86px] shrink-0 truncate text-[10.5px] text-text-muted">
              {t.name}
            </span>
            <Track
              value={t.value}
              tone={t.value === 100 ? "accent" : "info"}
              className="min-w-0 flex-1"
            />
            <span className="w-[62px] shrink-0 text-right">
              <Chip on={t.value === 100}>{t.state}</Chip>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Improvement ───────────────────────────────────────────────────────────
// `app/(app)/improvement/PlanProgressChart.tsx`: one metric at a time under the tabs it names
// them by, drawn as a bar per game with the goal as a dashed rule across the plot. The rule is
// the whole point of that screen — it is what turns a column of numbers into "moving or not".
const GAMES: readonly number[] = [52, 61, 47, 58, 66, 71, 63, 78, 74, 83, 88, 81];
const GOAL = 70;

export function ImprovementMark(): React.ReactElement {
  return (
    <div aria-hidden className="grid gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <MarkNote>cs per minute · 12 games</MarkNote>
        <span className="flex gap-1">
          <Chip on>CS/min</Chip>
          <Chip>Deaths</Chip>
          <Chip>KDA</Chip>
        </span>
      </div>

      <div className="relative h-[74px] border-b border-l border-line-1 pl-1">
        {/* The goal line, dashed, drawn over the bars rather than behind them — a bar that
            crosses it should be readable as crossing it. */}
        <span
          className="absolute inset-x-0 z-10 border-t border-dashed border-accent/70"
          style={{ bottom: `${GOAL}%` }}
        />
        <span
          className="absolute right-0 z-10 -translate-y-1/2 bg-surface px-1 font-mono text-[8px] uppercase tracking-[0.12em] text-accent"
          style={{ bottom: `${GOAL}%` }}
        >
          Goal
        </span>
        <div className="flex h-full items-end gap-[3px]">
          {GAMES.map((g, i) => (
            <span
              key={i}
              className={`min-w-0 flex-1 ${g >= GOAL ? "bg-accent" : "bg-info/60"}`}
              style={{ height: `${g}%` }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2 border-t border-line-1 pt-2">
        <span className="text-[10.5px] text-text-muted">Baseline 5.4 &rarr; now 6.9</span>
        <span className="font-mono text-[10px] tabular-nums text-accent">4 of 12 over goal</span>
      </div>
    </div>
  );
}

// ── OTP assistant ─────────────────────────────────────────────────────────
// `src/domains/otp/components/MatchupTierList.tsx` sorts every matchup into three columns under
// exactly these labels, each in its own colour; `MetaRating.tsx` is the bar above them.
const MATCHUPS: readonly {
  label: string;
  edge: string;
  text: string;
  champions: readonly string[];
}[] = [
  {
    label: "Easy",
    edge: "border-accent/40",
    text: "text-accent",
    champions: ["Malzahar", "Lissandra"],
  },
  {
    label: "Even",
    edge: "border-warning/40",
    text: "text-warning",
    champions: ["Orianna", "Syndra"],
  },
  { label: "Hard", edge: "border-danger/40", text: "text-danger", champions: ["Fizz", "Kassadin"] },
];

export function OtpMark(): React.ReactElement {
  return (
    <div aria-hidden className="grid gap-2.5">
      <div className="flex items-center gap-2.5 border border-line-1 bg-surface px-3 py-2">
        <Portrait size={26} name="Ahri" />
        <div className="min-w-0 flex-1">
          <MarkNote>meta rating</MarkNote>
          <Track value={78} className="mt-1.5" />
        </div>
        <span className="shrink-0 font-mono text-[12px] font-bold tabular-nums text-accent">
          7.8<span className="text-[9px] font-normal text-text-faint">/10</span>
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {MATCHUPS.map((m) => (
          <div key={m.label} className={`border bg-surface p-1.5 ${m.edge}`}>
            <p className={`font-mono text-[8px] uppercase tracking-[0.14em] ${m.text}`}>
              {m.label}
            </p>
            <div className="mt-1.5 grid gap-1">
              {m.champions.map((c) => (
                <span key={c} className="flex min-w-0 items-center gap-1.5">
                  <Portrait size={16} name={c} />
                  <span className="truncate text-[10px] text-text-muted">{c}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-line-1 pt-2">
        <MarkNote>ban priority</MarkNote>
        {["#1", "#2", "#3"].map((n, i) => (
          <span key={n} className="flex items-center gap-1">
            <span className="font-mono text-[9px] text-text-faint">{n}</span>
            <Portrait size={14} name={["Fizz", "Kassadin", "Yasuo"][i]} />
          </span>
        ))}
      </div>
    </div>
  );
}
