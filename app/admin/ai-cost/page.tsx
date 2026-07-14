import Link from "next/link";
import { getAiCostSummary } from "@/domains/admin/services/aiCostService";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-4">
      <p className="text-xs uppercase tracking-widest text-text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-text">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-text-muted">{sub}</p>}
    </div>
  );
}

export default async function AiCostPage() {
  const data = await getAiCostSummary();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text">AI Cost Dashboard</h1>
        <p className="mt-1 text-sm text-text-muted">
          Data aggregated from <code className="text-xs">ai_analyses</code> table
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today"
          value={`$${data.todayCostUsd.toFixed(4)}`}
          sub={`${data.todayTokens.toLocaleString()} tokens`}
        />
        <StatCard
          label="This Month"
          value={`$${data.monthCostUsd.toFixed(4)}`}
        />
        <StatCard
          label="Cache Hit Rate"
          value={`${data.todayCacheHitRate}%`}
          sub="Today"
        />
        <StatCard
          label="Avg Latency"
          value={`${data.avgLatencyMs}ms`}
          sub={`${data.totalCalls} total requests`}
        />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-text">Usage by Model</h2>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="px-4 py-2 text-left text-xs font-medium text-text-muted">Model</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-text-muted">Requests</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-text-muted">Tokens</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-text-muted">Cost</th>
              </tr>
            </thead>
            <tbody>
              {data.byModel.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-xs text-text-muted">
                    No data yet
                  </td>
                </tr>
              ) : (
                data.byModel.map((row) => (
                  <tr key={row.model} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 font-mono text-xs text-text">{row.model}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-text">{row.calls}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-text">
                      {row.tokens.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-text">
                      ${row.costUsd.toFixed(4)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-text">Most Expensive Requests</h2>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="px-4 py-2 text-left text-xs font-medium text-text-muted">Report</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-text-muted">Model</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-text-muted">Cost</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-text-muted">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.topReports.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-xs text-text-muted">
                    No data yet
                  </td>
                </tr>
              ) : (
                data.topReports.map((row, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 font-mono text-xs text-text-muted">
                      {row.reportId ? row.reportId.slice(0, 8) + "…" : "—"}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-text">{row.model}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-text">
                      ${row.costUsd.toFixed(5)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-text-muted">
                      {new Date(row.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-text">User Rating Statistics (last 30 days)</h2>
        <div className="grid gap-4 sm:grid-cols-3 mb-4">
          <StatCard label="Avg Rating" value={data.ratings.avgRating > 0 ? data.ratings.avgRating.toFixed(2) : "—"} sub="out of 5" />
          <StatCard label="Low-rated (≤2)" value={String(data.ratings.lowRatedReports.length)} sub="Last 30 days" />
          <StatCard label="Distribution" value={`${data.ratings.distribution["5"] ?? 0} × ⭐⭐⭐⭐⭐`} sub={`${data.ratings.distribution["1"] ?? 0} × ⭐`} />
        </div>

        <div className="mb-4 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="px-4 py-2 text-left text-xs font-medium text-text-muted">Report Type</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-text-muted">Avg Rating</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-text-muted">Count</th>
              </tr>
            </thead>
            <tbody>
              {data.ratings.byReportType.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-xs text-text-muted">No ratings yet</td></tr>
              ) : (
                data.ratings.byReportType.map((row) => (
                  <tr key={row.reportType} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 font-mono text-xs text-text">{row.reportType}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-text">{row.avgRating.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-text">{row.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data.ratings.lowRatedReports.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-border">
            <p className="border-b border-border bg-surface-2 px-4 py-2 text-xs font-medium text-text-muted">Low-rated Reports (rating ≤ 2)</p>
            {data.ratings.lowRatedReports.map((r) => (
              <div key={r.reportId} className="border-b border-border px-4 py-3 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-text-muted">{r.reportId.slice(0, 8)}…</span>
                  <span className="text-xs text-destructive">★ {r.rating} — {r.reportType}</span>
                  <span className="text-xs text-text-muted">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                {r.feedback && (
                  <p className="mt-1 text-xs text-text-muted italic">&quot;{r.feedback}&quot;</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-text-muted">
        Check growth metrics:{" "}
        <Link href="/admin/analytics" className="text-accent hover:underline">Growth Analytics →</Link>
      </p>
    </div>
  );
}
