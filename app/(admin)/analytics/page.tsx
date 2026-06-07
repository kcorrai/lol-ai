import Link from "next/link";
import { getAdminMetrics } from "@/domains/admin/services/adminMetricsService";

const RANGES = [
  { label: "7 gün", value: 7 },
  { label: "30 gün", value: 30 },
  { label: "90 gün", value: 90 },
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
    { label: "Kayıt", count: metrics.funnel.registered },
    { label: "Riot Bağlı", count: metrics.funnel.riotConnected },
    { label: "İlk Rapor", count: metrics.funnel.firstReport },
    { label: "Pro Plan", count: metrics.funnel.proPlan },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">Büyüme Analitiği</h1>
          <p className="mt-1 text-sm text-text-muted">Kullanıcı büyümesi ve özellik kullanımı</p>
        </div>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <Link
              key={r.value}
              href={`/analytics?range=${r.value}`}
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
        <Stat label="DAU" value={metrics.dau} sub="son 24 saat aktif" />
        <Stat label="MAU" value={metrics.mau} sub="son 30 gün aktif" />
        <Stat label="Toplam Kullanıcı" value={metrics.totalUsers} />
        <Stat label="Pro Kullanıcı" value={metrics.proUsers} />
        <Stat label="Dönüşüm Oranı" value={`%${metrics.conversionRate}`} sub="free → pro" />
      </div>

      {/* Sub stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Yeni Kayıt (7 gün)" value={metrics.newSignupsLast7Days} />
      </div>

      {/* Funnel */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-5 text-xs font-bold uppercase tracking-widest text-text-muted">Kayıt Hunisi</h2>
        <div className="space-y-3">
          {funnelSteps.map((step, i) => {
            const pct = Math.round((step.count / funnelMax) * 100);
            const colors = ["bg-accent", "bg-blue-500", "bg-purple-500", "bg-success"];
            return (
              <div key={step.label} className="flex items-center gap-4">
                <p className="w-28 shrink-0 text-xs text-text-muted">{step.label}</p>
                <div className="flex-1 overflow-hidden rounded-full bg-surface-2 h-2">
                  <div
                    className={`h-full rounded-full ${colors[i]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="w-16 text-right text-sm font-semibold text-text">{step.count.toLocaleString()}</p>
                <p className="w-10 text-right text-xs text-text-muted">{pct}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature usage */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-text-muted">Özellik Kullanımı</h2>
        <p className="mb-5 text-xs text-text-muted">Son {validRange} gün</p>
        <div className="space-y-3">
          {metrics.featureUsage.map((f) => {
            const max = metrics.featureUsage[0]?.count || 1;
            const pct = Math.round((f.count / max) * 100);
            return (
              <div key={f.label} className="flex items-center gap-4">
                <p className="w-36 shrink-0 text-xs text-text-muted">{f.label}</p>
                <div className="flex-1 overflow-hidden rounded-full bg-surface-2 h-2">
                  <div className="h-full rounded-full bg-accent/60" style={{ width: `${pct}%` }} />
                </div>
                <p className="w-16 text-right text-sm font-semibold text-text">{f.count.toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nav to AI cost */}
      <p className="text-xs text-text-muted">
        AI harcamalarına bak:{" "}
        <Link href="/ai-cost" className="text-accent hover:underline">AI Cost Dashboard →</Link>
      </p>
    </div>
  );
}
