import Image from "next/image";
import { DDRAGON_VERSION } from "@/lib/ddragon";
import { Portrait, Track } from "../screenChrome";
import { MarkNote } from "../markParts";
import { Cell, Figure, Rule, StatRow, Tabs } from "./panelParts";

/**
 * Five of the ten screens the account band names, drawn.
 *
 * Each is read off the screen it stands for and cites it, the way `screens/` already does —
 * these are illustrations, not captures (ADR-050), and the numbers in them are invented. What
 * is not invented is the furniture: the column headers, the stat labels and the tab names are
 * the literal strings those screens render, so a reader who signs up recognises what they were
 * shown. `progressMarks.tsx` holds the other five.
 *
 * They are sized for the hover panel, which gives a drawing about 360x150. That is a third of
 * what `ProductShowcase`'s four screens get and three times what a free-tool tile gets, so the
 * vocabulary is `markParts.tsx`'s small one with a little more room per row.
 */

// ── Heat map ──────────────────────────────────────────────────────────────
// `src/domains/analysis/components/DeathHeatMap.tsx`: Riot's own Summoner's Rift minimap with
// a blurred red heat layer under sharp death dots, and the death count in a corner badge. The
// map is the real asset that screen draws — the url is built the same way it builds it.
const MAP_URL = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/map/map11.png`;

// Percentages of the map square. Clustered along the mid lane, which runs bottom-left to
// top-right, with two out in the river either side of it — the shape a mid laner's deaths
// actually make, and the reason the screen exists ("the shape of it is usually the habit").
const DEATHS: readonly { x: number; y: number }[] = [
  { x: 46, y: 55 },
  { x: 52, y: 48 },
  { x: 49, y: 51 },
  { x: 57, y: 43 },
  { x: 43, y: 59 },
  { x: 38, y: 41 },
  { x: 63, y: 60 },
];

export function HeatMapMark(): React.ReactElement {
  return (
    <div aria-hidden className="grid grid-cols-[132px_1fr] gap-3">
      <div className="relative aspect-square w-[132px] overflow-hidden border border-line-1">
        <Image
          src={MAP_URL}
          alt=""
          width={132}
          height={132}
          unoptimized
          className="h-full w-full object-cover opacity-70 grayscale-[0.35]"
        />
        {DEATHS.map((d) => (
          <span key={`${d.x}-${d.y}`}>
            {/* The soft halo and the dot are two layers on the real screen too — one
                Gaussian-blurred pass under one sharp one. */}
            <span
              className="absolute block rounded-full bg-danger/35 blur-[5px]"
              style={{ left: `${d.x - 6}%`, top: `${d.y - 6}%`, width: "12%", height: "12%" }}
            />
            <span
              className="absolute block rounded-full bg-danger"
              style={{ left: `${d.x - 1.5}%`, top: `${d.y - 1.5}%`, width: "3%", height: "3%" }}
            />
          </span>
        ))}
        <span className="absolute right-1 top-1 bg-background/85 px-1 py-px font-mono text-[8px] uppercase tracking-[0.12em] text-danger">
          37 deaths
        </span>
      </div>

      <div className="grid content-center gap-2">
        <MarkNote>where they land</MarkNote>
        <StatRow label="Mid river" value="14" tone="danger" fill={62} />
        <StatRow label="Own jungle" value="9" tone="danger" fill={40} />
        <StatRow label="Enemy half" value="6" fill={26} />
        <MarkNote>ai analysis · one habit</MarkNote>
      </div>
    </div>
  );
}

// ── Match search ──────────────────────────────────────────────────────────
// `ArchiveTotalsStrip.tsx`'s six cells, in its order, over `ArchiveResultRow.tsx`'s rows —
// which carry a left edge in acid for a win and danger for a loss.
const TOTALS: readonly { label: string; value: string }[] = [
  { label: "Games", value: "218" },
  { label: "Record", value: "119–99" },
  { label: "Win rate", value: "54.6%" },
  { label: "KDA", value: "3.41" },
  { label: "CS / min", value: "7.2" },
  { label: "Vision", value: "24.8" },
];

const RESULTS: readonly { champion: string; role: string; line: string; win: boolean }[] = [
  { champion: "Ahri", role: "MID", line: "9/3/11 · 241 cs", win: true },
  { champion: "Viktor", role: "MID", line: "4/6/7 · 198 cs", win: false },
  { champion: "Syndra", role: "MID", line: "12/2/6 · 263 cs", win: true },
];

export function MatchSearchMark(): React.ReactElement {
  return (
    <div aria-hidden className="grid gap-2">
      <div className="grid grid-cols-6 gap-px bg-line-1">
        {TOTALS.map((t) => (
          <Cell key={t.label} label={t.label} value={t.value} />
        ))}
      </div>
      <div className="grid gap-1">
        {RESULTS.map((r) => (
          <div
            key={r.champion}
            className={`flex items-center gap-2 border-l-2 bg-surface px-2 py-1.5 ${
              r.win ? "border-accent" : "border-danger"
            }`}
          >
            <Portrait size={16} name={r.champion} />
            <span className="text-[11px] text-text">{r.champion}</span>
            <span className="border border-line-1 px-1 font-mono text-[7.5px] tracking-[0.1em] text-text-faint">
              {r.role}
            </span>
            <span className="ml-auto font-mono text-[9.5px] tabular-nums text-text-muted">
              {r.line}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Career timeline ───────────────────────────────────────────────────────
// `CareerHeader.tsx`'s four stat blocks under their own labels, then the LP line it draws as
// hand-written SVG, then one of `EraBand.tsx`'s month summaries.
const CAREER: readonly { label: string; value: string }[] = [
  { label: "Games tracked", value: "1,204" },
  { label: "Hours on the rift", value: "612h" },
  { label: "Rank now", value: "Diamond IV" },
  { label: "Peak", value: "Diamond II" },
];

/** A climb with a dip in it. Points are percentages, so the path scales with the box. */
const LP_LINE = "0,74 12,66 24,71 36,52 48,58 60,38 72,44 84,22 100,16";

export function TimelineMark(): React.ReactElement {
  return (
    <div aria-hidden className="grid gap-2">
      <div className="grid grid-cols-4 gap-px bg-line-1">
        {CAREER.map((c) => (
          <Cell key={c.label} label={c.label} value={c.value} />
        ))}
      </div>
      <div className="border border-line-1 bg-surface p-2">
        <div className="flex items-baseline justify-between">
          <MarkNote>the climb</MarkNote>
          <span className="font-mono text-[9px] tabular-nums text-accent">+412 LP</span>
        </div>
        <svg viewBox="0 0 100 80" preserveAspectRatio="none" className="mt-1 h-[46px] w-full">
          <polyline
            points={LP_LINE}
            fill="none"
            stroke="var(--acid-500)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <Rule>March · 96 games · 56% · Diamond IV · +212 LP</Rule>
    </div>
  );
}

// ── Improvement ───────────────────────────────────────────────────────────
// `app/(app)/improvement/PlanProgressChart.tsx`: three metric tabs and a per-game bar chart
// under a dashed goal line, headed the way that chart heads itself.
const GAMES: readonly number[] = [38, 52, 44, 61, 57, 72, 66, 81, 74, 88];
const GOAL_AT = 70;

export function ImprovementMark(): React.ReactElement {
  return (
    <div aria-hidden className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <MarkNote>cs per minute · 10 games</MarkNote>
        <Tabs items={["CS/min", "Deaths", "KDA"]} active="CS/min" />
      </div>
      <div className="relative flex h-[62px] items-end gap-1 border border-line-1 bg-surface p-2">
        {/* The goal line is dashed on the real chart, and it is the only thing that makes a
            column of bars mean "moving" rather than "varying". */}
        <span
          className="absolute inset-x-2 border-t border-dashed border-accent/60"
          style={{ bottom: `calc(${GOAL_AT}% - 2px)` }}
        />
        {GAMES.map((g, i) => (
          <span
            key={i}
            className={`min-w-0 flex-1 ${g >= GOAL_AT ? "bg-accent" : "bg-ink-400"}`}
            style={{ height: `${g}%` }}
          />
        ))}
      </div>
      <StatRow label="Deaths per game" value="4.1 → 2.8" tone="accent" fill={78} />
    </div>
  );
}

// ── OTP assistant ─────────────────────────────────────────────────────────
// `src/domains/otp/components/MatchupTierList.tsx` sorts a champion's matchups into three
// columns under exactly these labels, and `MetaRating.tsx` scores the champion out of ten.
const MATCHUPS: readonly { band: "Easy" | "Even" | "Hard"; champions: readonly string[] }[] = [
  { band: "Easy", champions: ["Lux", "Xerath"] },
  { band: "Even", champions: ["Ahri", "Zed"] },
  { band: "Hard", champions: ["Malzahar", "Annie"] },
];

const BAND_EDGE: Record<string, string> = {
  Easy: "border-accent/40 text-accent",
  Even: "border-warning/40 text-warning",
  Hard: "border-danger/40 text-danger",
};

export function OtpMark(): React.ReactElement {
  return (
    <div aria-hidden className="grid gap-2">
      <div className="flex items-center gap-2 border border-line-1 bg-surface px-2 py-1.5">
        <Portrait size={20} name="Yasuo" />
        <MarkNote>meta rating</MarkNote>
        <Track value={72} className="min-w-0 flex-1" />
        <Figure>7.2</Figure>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {MATCHUPS.map((m) => (
          <div key={m.band} className={`border bg-surface p-1.5 ${BAND_EDGE[m.band]}`}>
            <p className="font-mono text-[8px] uppercase tracking-[0.14em]">{m.band}</p>
            <div className="mt-1.5 flex gap-1">
              {m.champions.map((c) => (
                <Portrait key={c} size={20} name={c} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
