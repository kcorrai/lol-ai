import Image from "next/image";
import { rankEmblemUrl } from "@/lib/ddragon";
import { Portrait, Track } from "../screenChrome";
import { MarkNote } from "../markParts";
import { Stat, StatStrip } from "./accountParts";

/**
 * Four of the ten account-band previews: the screens that say what it all added up to.
 *
 * `historyMarks.tsx` carries the rules all ten follow. Every figure here is invented and the
 * panel says so; the rank crests and the champion art are Riot's.
 */

// ── Season recap ──────────────────────────────────────────────────────────
// `src/domains/analysis/components/recap/RecapStage.tsx`: a chapter at a time, its position in
// the run drawn as segments across the top, one huge mono figure carrying the chapter, and a
// data panel of champion rows beside it.
const RECAP_CHAMPIONS: readonly { name: string; value: number; label: string }[] = [
  { name: "Ahri", value: 88, label: "142 games" },
  { name: "Syndra", value: 61, label: "97 games" },
  { name: "Viktor", value: 44, label: "68 games" },
];

export function RecapMark(): React.ReactElement {
  return (
    <div aria-hidden className="grid gap-2.5">
      <div className="flex items-center gap-2">
        <span className="flex min-w-0 flex-1 gap-1">
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} className={`h-[3px] flex-1 ${i < 3 ? "bg-accent" : "bg-surface-2"}`} />
          ))}
        </span>
        <span className="shrink-0 font-mono text-[9px] tabular-nums text-text-faint">3 / 8</span>
      </div>

      <div className="flex items-end gap-3">
        <div className="min-w-0">
          <MarkNote>the champion</MarkNote>
          <p className="font-display text-[38px] font-extrabold leading-none tracking-tight text-accent">
            142
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-text-muted">
            games on one champion this season.
          </p>
        </div>
        <div className="ml-auto grid min-w-0 flex-1 gap-1.5">
          {RECAP_CHAMPIONS.map((c) => (
            <div key={c.name} className="flex items-center gap-1.5">
              <Portrait size={16} name={c.name} />
              <Track
                value={c.value}
                tone={c.value >= 60 ? "accent" : "info"}
                className="min-w-0 flex-1"
              />
              <span className="w-[54px] shrink-0 text-right font-mono text-[9px] tabular-nums text-text-muted">
                {c.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-line-1 pt-2">
        <MarkNote>shareable without an account</MarkNote>
        <span className="font-mono text-[9.5px] text-accent">Share &rarr;</span>
      </div>
    </div>
  );
}

// ── Milestone ─────────────────────────────────────────────────────────────
// `MilestoneNumbers.tsx`'s four KPIs under its own labels, then `MilestoneRankJourney.tsx` —
// where the month started, what it moved, and where it ended.
const KPIS: readonly { label: string; value: string }[] = [
  { label: "Matches", value: "96" },
  { label: "Win rate", value: "58.3%" },
  { label: "Avg KDA", value: "3.41" },
  { label: "Time played", value: "41h" },
];

export function MilestoneMark(): React.ReactElement {
  return (
    <div aria-hidden className="grid gap-2.5">
      <MarkNote>the month in numbers</MarkNote>
      <StatStrip stats={KPIS} columns={4} />

      <div className="grid gap-1.5 border-t border-line-1 pt-2">
        <MarkNote>rank journey</MarkNote>
        <div className="flex items-center gap-3 border border-line-1 bg-surface px-3 py-2">
          <span className="flex min-w-0 items-center gap-2">
            <Image
              src={rankEmblemUrl("PLATINUM")}
              alt=""
              width={30}
              height={30}
              unoptimized
              className="shrink-0"
            />
            <Stat label="Month start" value="Plat III" />
          </span>
          <span className="mx-auto shrink-0 text-center">
            <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-text-faint">
              Net LP
            </p>
            <p className="font-mono text-[13px] font-bold tabular-nums text-accent">+214</p>
          </span>
          <span className="flex min-w-0 items-center gap-2">
            <Stat label="Now" value="Plat I" />
            <Image
              src={rankEmblemUrl("PLATINUM")}
              alt=""
              width={30}
              height={30}
              unoptimized
              className="shrink-0"
            />
          </span>
        </div>
      </div>

      <p className="text-[10.5px] text-text-muted">
        Measured against last month, not against a global mean.
      </p>
    </div>
  );
}

// ── Leaderboard ───────────────────────────────────────────────────────────
// `app/(app)/leaderboard/PageClient.tsx`: medals for the top three, then the rank, the crest,
// the record, the win rate and the LP moved — in its order and under its own headings.
const MEDALS = ["🥇", "🥈", "🥉"] as const;

const BOARD: readonly { tier: string; rank: string; record: string; wr: string; lp: string }[] = [
  { tier: "DIAMOND", rank: "Diamond II", record: "31W 12L", wr: "72%", lp: "+284" },
  { tier: "DIAMOND", rank: "Diamond IV", record: "27W 14L", wr: "66%", lp: "+241" },
  { tier: "EMERALD", rank: "Emerald I", record: "24W 15L", wr: "62%", lp: "+198" },
  { tier: "EMERALD", rank: "Emerald II", record: "22W 16L", wr: "58%", lp: "+164" },
];

export function LeaderboardMark(): React.ReactElement {
  return (
    <div aria-hidden className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <MarkNote>fastest climbers</MarkNote>
        <span className="flex gap-1">
          <span className="border border-accent px-1 py-px font-mono text-[7.5px] uppercase tracking-[0.1em] text-accent">
            This week
          </span>
          <span className="border border-line-1 px-1 py-px font-mono text-[7.5px] uppercase tracking-[0.1em] text-text-faint">
            This month
          </span>
        </span>
      </div>

      <div className="grid gap-1">
        {BOARD.map((row, i) => (
          <div key={row.rank} className="flex items-center gap-2 bg-surface px-2 py-1.5">
            <span className="w-4 shrink-0 text-center font-mono text-[11px] tabular-nums text-text-muted">
              {MEDALS[i] ?? i + 1}
            </span>
            <Image
              src={rankEmblemUrl(row.tier)}
              alt=""
              width={20}
              height={20}
              unoptimized
              className="shrink-0"
            />
            {/* No invented summoner names: a leaderboard of made-up people reads as a claim
                about who is on it. The rank is what the row is actually ranked by. */}
            <span className="min-w-0 flex-1 truncate text-[10.5px] text-text">{row.rank}</span>
            <span className="shrink-0 font-mono text-[9.5px] tabular-nums text-text-muted">
              {row.record}
            </span>
            <span className="w-[30px] shrink-0 text-right font-mono text-[9.5px] tabular-nums text-text-body">
              {row.wr}
            </span>
            <span className="w-[34px] shrink-0 text-right font-mono text-[10px] tabular-nums text-accent">
              {row.lp}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Badges ────────────────────────────────────────────────────────────────
// `app/(app)/achievements/PageClient.tsx` splits the catalogue into "Earned (n)" and
// "Locked (n)" and colours each tile by its tier. The four tiers and their hex values are
// `TIER_COLORS`/`TIER_LABEL` in `src/types/achievement.ts` — bronze, silver, gold, platinum.
const TIERS: readonly { label: string; color: string }[] = [
  { label: "Bronze", color: "#CD7F32" },
  { label: "Silver", color: "#C0C0C0" },
  { label: "Gold", color: "#FFD700" },
  { label: "Platinum", color: "#E5E4E2" },
];

export function BadgesMark(): React.ReactElement {
  return (
    <div aria-hidden className="grid gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <MarkNote>earned (18)</MarkNote>
        <MarkNote>locked (34)</MarkNote>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {TIERS.map((t) => (
          <div
            key={t.label}
            className="grid place-items-center gap-1 border bg-surface px-1 py-2"
            style={{ borderColor: `${t.color}55` }}
          >
            <span
              className="block h-4 w-4 rotate-45 border"
              style={{ borderColor: t.color, background: `${t.color}33` }}
            />
            <span
              className="font-mono text-[7.5px] uppercase tracking-[0.12em]"
              style={{ color: t.color }}
            >
              {t.label}
            </span>
          </div>
        ))}
        {/* The locked half of the grid, dimmed rather than hidden — the real screen shows what
            is still out there, which is the reason anyone opens it twice. */}
        {TIERS.map((t) => (
          <div
            key={`locked-${t.label}`}
            className="grid place-items-center gap-1 border border-line-1 bg-surface-dark px-1 py-2 opacity-45"
          >
            <span className="block h-4 w-4 rotate-45 border border-line-1 bg-surface-2" />
            <span className="font-mono text-[7.5px] uppercase tracking-[0.12em] text-text-faint">
              Locked
            </span>
          </div>
        ))}
      </div>

      <p className="border-t border-line-1 pt-2 text-[10.5px] text-text-muted">
        Earned from your match history, not from logging in.
      </p>
    </div>
  );
}
