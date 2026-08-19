"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLanePhase } from "@/hooks/useLanePhase";
import type { LanePhaseMarker, LanePhasePoint } from "@/domains/match";

interface LanePhaseChartProps {
  matchId: string;
}

type Metric = "goldDiff" | "xpDiff" | "csDiff";

const METRICS: { key: Metric; label: string }[] = [
  { key: "goldDiff", label: "Gold" },
  { key: "xpDiff", label: "XP" },
  { key: "csDiff", label: "CS" },
];

const AHEAD = "#C6FF3D";
const BEHIND = "#ef4444";

function Shell({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <section className="notch border border-border bg-surface">{children}</section>;
}

function Header({ subtitle }: { subtitle: string }): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line-1 px-5 py-3">
      <span className="font-mono text-[10.5px] uppercase tracking-label text-text-muted">
        {"// LANE PHASE"}
      </span>
      <span className="font-mono text-[10.5px] uppercase tracking-wide text-fg-4">{subtitle}</span>
    </div>
  );
}

/**
 * The lane, minute by minute, as a difference against the player opposite.
 *
 * Everything else on this page is an end-of-game total, which can say a lane was lost but never
 * when. Zero is the line that matters, so it is drawn explicitly and the curve is coloured by
 * which side of it the game ended on.
 */
export function LanePhaseChart({ matchId }: LanePhaseChartProps): React.JSX.Element | null {
  const [metric, setMetric] = useState<Metric>("goldDiff");
  const { data, isLoading, isError } = useLanePhase(matchId);

  if (isLoading) {
    return (
      <Shell>
        <Header subtitle="Loading" />
        <div className="animate-pulse p-5">
          <div className="h-48 w-full bg-surface-dark" />
        </div>
      </Shell>
    );
  }

  // A 404 here means the match was synced before the timeline was captured — expected for every
  // older game, and not a failure worth an error state.
  if (isError || !data) {
    return (
      <Shell>
        <Header subtitle="No record" />
        <p className="px-5 py-6 text-sm text-text-muted">
          No timeline was recorded for this match. Games synced from now on carry one.
        </p>
      </Shell>
    );
  }

  if (!data.opponent || data.points.length === 0) {
    return (
      <Shell>
        <Header subtitle="No opponent" />
        <p className="px-5 py-6 text-sm text-text-muted">
          Nobody was assigned to {data.position.toLowerCase()} on the other team, so there is
          nothing to measure this lane against.
        </p>
      </Shell>
    );
  }

  const final = data.points[data.points.length - 1][metric];
  const colour = final >= 0 ? AHEAD : BEHIND;
  const byMinute = new Map<number, LanePhasePoint>(data.points.map((p) => [p.minute, p]));
  // Only markers that land on a minute the curve actually has, so a dot cannot float off the line.
  const dots = data.markers.filter((m: LanePhaseMarker) => byMinute.has(m.minute));

  return (
    <Shell>
      <Header subtitle={`${data.championName} vs ${data.opponent.championName}`} />

      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
        <div className="flex gap-1">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`notch-sm border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-label transition-colors ${
                m.key === metric
                  ? "border-acid-500 text-acid-500"
                  : "border-line-2 text-fg-3 hover:text-fg-1"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <span className="font-mono text-sm font-bold tabular-nums" style={{ color: colour }}>
          {final >= 0 ? "+" : ""}
          {final} at {data.points[data.points.length - 1].minute}m
        </span>
      </div>

      <div className="px-2 pb-4 pt-3">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data.points} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="minute"
              unit="m"
              tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "#0d0f1a",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 4,
                fontSize: 12,
              }}
              labelFormatter={(m) => `${m} min`}
              formatter={(value) => {
                // Recharts types this as ValueType | undefined; the series is always numeric.
                const n = typeof value === "number" ? value : 0;
                return [`${n >= 0 ? "+" : ""}${n}`, "Difference"];
              }}
            />
            {/* Zero is the whole reading: above it you were ahead, below it you were behind. */}
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.35)" strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey={metric}
              stroke={colour}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            {dots.map((m, i) => (
              <ReferenceDot
                key={`${m.kind}-${m.minute}-${i}`}
                x={m.minute}
                y={byMinute.get(m.minute)![metric]}
                r={4}
                fill={m.side === "player" ? BEHIND : AHEAD}
                stroke="#0d0f1a"
                strokeWidth={1.5}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {dots.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line-1 px-5 py-3">
          {dots.slice(0, 8).map((m, i) => (
            <span
              key={`${m.kind}-${m.minute}-legend-${i}`}
              className="font-mono text-[10px] uppercase tracking-wide text-fg-4"
            >
              <span className={m.side === "player" ? "text-danger" : "text-acid-500"}>
                {m.minute}m
              </span>{" "}
              {m.label}
            </span>
          ))}
        </div>
      )}
    </Shell>
  );
}
