import Link from "next/link";
import { getAdminMetrics } from "@/domains/admin/services/adminMetricsService";
import { formatCount } from "@/lib/uiLocale";

const RANGES = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-4">
      <p className="text-xs uppercase tracking-widest text-text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-text">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-text-muted">{sub}</p>}
    </div>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  const range = Number(searchParams.range ?? 30);
  const validRange = RANGES.map((r) => r.value).includes(range) ? range : 30;
  const metrics = await getAdminMetrics(validRange);

  const funnelMax = metrics.funnel.registered || 1;
  const funnelSteps = [
    { label: "Signed up", count: metrics.funnel.registered },
    { label: "Connected Riot", count: metrics.funnel.riotConnected },
    { label: "First Report", count: metrics.funnel.firstReport },
    { label: "Pro Plan", count: metrics.funnel.proPlan },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">Growth Analytics</h1>
          <p className="mt-1 text-sm text-text-muted">User growth and feature usage</p>
        </div>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <Link
              key={r.value}
              href={`/admin/analytics?range=${r.value}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                validRange === r.value
                  ? "bg-accent text-background"
                  : "border border-border text-text-muted hover:text-text"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="DAU" value={metrics.dau} sub="active last 24h" />
        <Stat label="MAU" value={metrics.mau} sub="active last 30 days" />
        <Stat label="Total Users" value={metrics.totalUsers} />
        <Stat label="Pro Users" value={metrics.proUsers} />
        <Stat label="Conversion Rate" value={`${metrics.conversionRate}%`} sub="free → pro" />
      </div>

      {/* Sub stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="New Signups (7 days)" value={metrics.newSignupsLast7Days} />
      </div>

      {/* Funnel */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-5 text-xs font-bold uppercase tracking-widest text-text-muted">
          Signup Funnel
        </h2>
        <div className="space-y-3">
          {funnelSteps.map((step, i) => {
            const pct = Math.round((step.count / funnelMax) * 100);
            const colors = ["bg-accent", "bg-info", "bg-accent", "bg-success"];
            return (
              <div key={step.label} className="flex items-center gap-4">
                <p className="w-28 shrink-0 text-xs text-text-muted">{step.label}</p>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={`h-full rounded-full ${colors[i]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="w-16 text-right text-sm font-semibold text-text">
                  {formatCount(step.count)}
                </p>
                <p className="w-10 text-right text-xs text-text-muted">{pct}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature usage */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-text-muted">
          Feature Usage
        </h2>
        <p className="mb-5 text-xs text-text-muted">Last {validRange} days</p>
        <div className="space-y-3">
          {metrics.featureUsage.map((f) => {
            const max = metrics.featureUsage[0]?.count || 1;
            const pct = Math.round((f.count / max) * 100);
            return (
              <div key={f.label} className="flex items-center gap-4">
                <p className="w-36 shrink-0 text-xs text-text-muted">{f.label}</p>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-accent/60" style={{ width: `${pct}%` }} />
                </div>
                <p className="w-16 text-right text-sm font-semibold text-text">
                  {formatCount(f.count)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-text-muted">
        Check AI spending:{" "}
        <Link href="/admin/ai-cost" className="text-accent hover:underline">
          AI Cost Dashboard →
        </Link>
      </p>
    </div>
  );
}
