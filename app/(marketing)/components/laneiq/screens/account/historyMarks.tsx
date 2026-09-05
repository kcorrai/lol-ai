import Image from "next/image";
import { DDRAGON_VERSION } from "@/lib/ddragon";
import { Portrait } from "../screenChrome";
import { MarkNote } from "../markParts";
import { Chip, Stat, StatStrip } from "./accountParts";

/**
 * Three of the ten account-band previews: the screens that read back what you already did.
 *
 * Each is drawn from the real page it stands for and cites it, on `screens/screenChrome.tsx`'s
 * rule — these do not update themselves when the app changes, so the only thing keeping them
 * honest is the note saying where each came from. They are wider than the free-tools marks
 * (about 400px against 340) and taller, because the hover panel is not a tile.
 *
 * Every figure is invented; the panel says so under the drawing. The champion art and the map
 * are real.
 */

// ── Heat map ──────────────────────────────────────────────────────────────
// `src/domains/analysis/components/DeathHeatMap.tsx`: Riot's own Summoner's Rift image with an
// SVG overlay — a blurred heat layer under sharp dots, and the death count in a corner badge.
// The map is the same asset that screen loads, so this half of the drawing is not a drawing.
const MAP_IMG = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/map/map11.png`;

/** Percent coordinates. Clustered where a jungler dies: river, both pits, mid. */
const DEATHS: readonly { x: number; y: number; r: number }[] = [
  { x: 38, y: 34, r: 3 },
  { x: 43, y: 30, r: 2.4 },
  { x: 35, y: 40, r: 2.4 },
  { x: 68, y: 62, r: 3 },
  { x: 72, y: 58, r: 2.4 },
  { x: 63, y: 66, r: 2 },
  { x: 52, y: 48, r: 2.6 },
  { x: 48, y: 53, r: 2 },
  { x: 24, y: 72, r: 2.2 },
  { x: 79, y: 26, r: 2.2 },
];

export function HeatMapMark(): React.ReactElement {
  return (
    <div aria-hidden className="flex items-stretch gap-3">
      <div className="relative aspect-square w-[136px] shrink-0 border border-line-1">
        <Image src={MAP_IMG} alt="" fill sizes="136px" unoptimized className="object-cover" />
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          {/* The blurred layer first, the sharp dots on top of it — the order the real overlay
              draws them in, and the reason a cluster reads as heat rather than as confetti. */}
          <g style={{ filter: "blur(3px)" }}>
            {DEATHS.map((d, i) => (
              <circle key={i} cx={d.x} cy={d.y} r={d.r * 2.6} fill="rgba(255,77,79,0.5)" />
            ))}
          </g>
          {DEATHS.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={0.9} fill="#ff4d4f" />
          ))}
        </svg>
        <span className="absolute right-1 top-1 bg-background/85 px-1.5 py-px font-mono text-[8.5px] tabular-nums text-text">
          64 deaths
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5">
        <MarkNote>where you died</MarkNote>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Games read" value="20" />
          <Stat label="Deaths / game" value="3.2" />
        </div>
        <div className="grid gap-1 border-t border-line-1 pt-2">
          {[
            { where: "Enemy jungle", n: "21" },
            { where: "River, 20–30 min", n: "17" },
            { where: "Mid lane", n: "11" },
          ].map((row) => (
            <div key={row.where} className="flex items-baseline justify-between gap-2">
              <span className="truncate text-[10.5px] text-text-muted">{row.where}</span>
              <span className="shrink-0 font-mono text-[10px] tabular-nums text-danger">
                {row.n}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Match search ──────────────────────────────────────────────────────────
// `ArchiveTotalsStrip.tsx`'s six cells, in its order and under its own labels, over
// `ArchiveResultRow.tsx`'s rows — which carry a win/loss colour on the left edge.
const TOTALS: readonly { label: string; value: string }[] = [
  { label: "Games", value: "148" },
  { label: "Record", value: "82–66" },
  { label: "Win rate", value: "55.4%" },
  { label: "KDA", value: "3.14" },
  { label: "CS / min", value: "6.8" },
  { label: "Vision", value: "24.1" },
];

const ROWS: readonly { champion: string; lane: string; line: string; win: boolean }[] = [
  { champion: "Ahri", lane: "MID", line: "9 / 3 / 11", win: true },
  { champion: "Viktor", lane: "MID", line: "5 / 6 / 7", win: false },
  { champion: "Syndra", lane: "MID", line: "12 / 2 / 6", win: true },
];

export function MatchSearchMark(): React.ReactElement {
  return (
    <div aria-hidden className="grid gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <MarkNote>filters applied</MarkNote>
        <span className="flex gap-1">
          {["Mid", "Ranked solo", "16.13"].map((chip) => (
            <Chip key={chip}>{chip}</Chip>
          ))}
        </span>
      </div>

      <StatStrip stats={TOTALS} columns={6} />

      <div className="grid gap-1">
        {ROWS.map((r) => (
          <div
            key={r.champion}
            className={`flex items-center gap-2 border-l-2 bg-surface px-2 py-1.5 ${
              r.win ? "border-accent" : "border-danger"
            }`}
          >
            <Portrait size={18} name={r.champion} />
            <span className="min-w-0 flex-1 truncate text-[11px] text-text">{r.champion}</span>
            <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.12em] text-text-faint">
              {r.lane}
            </span>
            <span className="shrink-0 font-mono text-[10px] tabular-nums text-text-body">
              {r.line}
            </span>
            <span
              className={`w-[10px] shrink-0 text-right font-mono text-[10px] font-bold ${
                r.win ? "text-accent" : "text-danger"
              }`}
            >
              {r.win ? "W" : "L"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Career timeline ───────────────────────────────────────────────────────
// `CareerHeader.tsx`'s four stat blocks under its own labels, its hand-drawn LP sparkline, and
// one of `EraBand.tsx`'s month bands underneath.
const CAREER: readonly { label: string; value: string }[] = [
  { label: "Games tracked", value: "1,284" },
  { label: "Hours on the rift", value: "612h" },
  { label: "Rank now", value: "Diamond IV" },
  { label: "Peak", value: "Diamond II" },
];

/** An LP line that climbs, dips and recovers — the shape of a season, not a real one. */
const LP_LINE = "0,30 12,26 24,29 36,20 48,23 60,14 72,18 84,9 96,12 108,4";

export function TimelineMark(): React.ReactElement {
  return (
    <div aria-hidden className="grid gap-2.5">
      <StatStrip stats={CAREER} columns={4} />

      <div className="border border-line-1 bg-surface px-2.5 py-2">
        <div className="flex items-baseline justify-between gap-2">
          <MarkNote>the climb</MarkNote>
          <span className="font-mono text-[10px] tabular-nums text-accent">+412 LP</span>
        </div>
        {/* `currentColor`, the way `src/components/timeline/LpSparkline.tsx` draws the real
            one — so the line follows the accent token rather than pinning a hex. */}
        <svg
          viewBox="0 0 108 34"
          preserveAspectRatio="none"
          className="mt-1.5 h-[34px] w-full text-accent"
        >
          <polyline
            points={LP_LINE}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      <div className="border-l-2 border-accent bg-surface px-2.5 py-1.5">
        <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-text-faint">
          March 2026
        </p>
        <p className="mt-0.5 font-mono text-[10px] tabular-nums text-text-body">
          64 games · 57% win rate · Platinum I → Diamond IV · +188 LP
        </p>
      </div>
    </div>
  );
}
