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
          Aggregated from <code className="text-xs">ai_analyses</code> table
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
          sub={`${data.totalCalls} total calls`}
        />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-text">Usage by Model</h2>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="px-4 py-2 text-left text-xs font-medium text-text-muted">Model</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-text-muted">Calls</th>
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
        <h2 className="mb-3 text-sm font-semibold text-text">Most Expensive Calls</h2>
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

      <p className="text-xs text-text-muted">
        Büyüme metriklerine bak:{" "}
        <Link href="/analytics" className="text-accent hover:underline">Büyüme Analitiği →</Link>
      </p>
    </div>
  );
}
