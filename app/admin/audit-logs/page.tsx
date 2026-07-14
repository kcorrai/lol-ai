import { getAuditLogs } from "@/lib/audit/auditService";

interface SearchParams {
  userId?: string;
  action?: string;
  from?: string;
  to?: string;
  page?: string;
}

function formatDate(d: Date): string {
  return d.toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "medium" });
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(0, parseInt(params.page ?? "0", 10));

  const { logs, total, pageSize } = await getAuditLogs(
    {
      userId: params.userId || undefined,
      action: params.action || undefined,
      fromDate: params.from ? new Date(params.from) : undefined,
      toDate: params.to ? new Date(params.to) : undefined,
    },
    page,
    50
  );

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-text">Audit Logs</h1>
        <p className="text-sm text-text-muted">{total} records</p>
      </div>

      {/* Filter form */}
      <form className="flex flex-wrap gap-3 rounded-xl border border-border bg-surface p-4">
        <input
          name="userId"
          defaultValue={params.userId ?? ""}
          placeholder="User ID"
          className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-xs text-text placeholder:text-text-muted"
        />
        <input
          name="action"
          defaultValue={params.action ?? ""}
          placeholder="Action (e.g. riot.)"
          className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-xs text-text placeholder:text-text-muted"
        />
        <input
          type="date"
          name="from"
          defaultValue={params.from ?? ""}
          className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-xs text-text"
        />
        <input
          type="date"
          name="to"
          defaultValue={params.to ?? ""}
          className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-xs text-text"
        />
        <button
          type="submit"
          className="rounded-md bg-accent px-4 py-1.5 text-xs font-semibold text-background"
        >
          Filter
        </button>
      </form>

      {/* Logs table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="min-w-full text-xs">
          <thead className="bg-surface-2">
            <tr>
              <th className="px-4 py-2 text-left text-text-muted">Date</th>
              <th className="px-4 py-2 text-left text-text-muted">Action</th>
              <th className="px-4 py-2 text-left text-text-muted">User ID</th>
              <th className="px-4 py-2 text-left text-text-muted">Resource ID</th>
              <th className="px-4 py-2 text-left text-text-muted">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-surface-2/40">
                <td className="whitespace-nowrap px-4 py-2 text-text-muted">
                  {formatDate(new Date(log.createdAt))}
                </td>
                <td className="px-4 py-2 font-mono text-text">{log.action}</td>
                <td className="px-4 py-2 text-text-muted">
                  {log.userId ? log.userId.slice(0, 8) + "…" : "—"}
                </td>
                <td className="px-4 py-2 text-text-muted">
                  {log.resourceId ? log.resourceId.slice(0, 8) + "…" : "—"}
                </td>
                <td className="px-4 py-2 text-text-muted">{log.ipAddress ?? "—"}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-text-muted">
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>
            Page {page + 1} / {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 0 && (
              <a
                href={`?${new URLSearchParams({ ...params, page: String(page - 1) })}`}
                className="rounded-md border border-border px-3 py-1.5 hover:bg-surface-2"
              >
                ← Previous
              </a>
            )}
            {page < totalPages - 1 && (
              <a
                href={`?${new URLSearchParams({ ...params, page: String(page + 1) })}`}
                className="rounded-md border border-border px-3 py-1.5 hover:bg-surface-2"
              >
                Next →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
