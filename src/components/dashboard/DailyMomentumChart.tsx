"use client";

import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { useDailyMomentum } from "@/hooks/useDailyMomentum";
import { mergeSeries, type MomentumMetric } from "@/domains/analysis/services/dailyMomentum";

interface Props {
  riotAccountId: string | null | undefined;
}

const METRICS: { key: MomentumMetric; label: string; unit?: string; domain?: [number, number] }[] = [
  { key: "kda", label: "KDA" },
  { key: "csPerMin", label: "CS/min" },
  { key: "visionScore", label: "Vision" },
  { key: "winRate", label: "Win rate", unit: "%", domain: [0, 100] },
];

const SELF_COLOR = "#c89b3c";
const DUO_COLOR = "#3b82f6";

const formatDate = (d: string): string =>
  new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short" });

export function DailyMomentumChart({ riotAccountId }: Props) {
  const [metric, setMetric] = useState<MomentumMetric>("kda");
  const { data, isLoading } = useDailyMomentum(riotAccountId);

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-2xl border border-border bg-surface p-5">
        <div className="h-3 w-32 rounded bg-border" />
        <div className="mt-4 h-44 w-full rounded bg-border" />
      </div>
    );
  }

  if (!data || data.self.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-bold text-text">Daily Momentum</h2>
        <p className="mt-2 text-sm text-text-muted">
          Once you have a few days of games, this shows how you&apos;re trending day by day.
        </p>
      </div>
    );
  }

  const active = METRICS.find((m) => m.key === metric)!;
  const chartData = mergeSeries(data.self, data.duo?.points ?? [], metric).map((p) => ({
    ...p,
    date: formatDate(p.date),
  }));
  const duoLabel = data.duo ? `${data.duo.gameName}#${data.duo.tagLine}` : null;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" />
          <h2 className="font-display text-lg font-bold text-text">Daily Momentum</h2>
        </div>
        <div className="flex flex-wrap gap-1">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                m.key === metric
                  ? "bg-accent/15 text-accent"
                  : "text-text-muted hover:bg-surface-2 hover:text-text"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} tickLine={false} />
          <YAxis
            domain={active.domain ?? ["auto", "auto"]}
            unit={active.unit}
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#0d0f1a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "rgba(255,255,255,0.6)" }}
          />
          {duoLabel && <Legend wrapperStyle={{ fontSize: 11 }} />}
          {/* connectNulls bridges days off — the gap is "didn't play", not a drop to zero. */}
          <Line
            type="monotone"
            dataKey="self"
            name="You"
            stroke={SELF_COLOR}
            strokeWidth={2}
            dot={{ fill: SELF_COLOR, r: 3 }}
            connectNulls
          />
          {duoLabel && (
            <Line
              type="monotone"
              dataKey="duo"
              name={duoLabel}
              stroke={DUO_COLOR}
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ fill: DUO_COLOR, r: 3 }}
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      {!duoLabel && (
        <p className="mt-3 text-xs text-text-muted">
          Pick a duo to compare your days against theirs.
        </p>
      )}
    </div>
  );
}
