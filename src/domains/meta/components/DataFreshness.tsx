import { formatGamePatch } from "@/domains/meta";

// Hours since an ISO timestamp (server-rendered; 0 when the time is in the future).
function hoursAgo(iso: string): number {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.max(0, Math.round((Date.now() - then) / 3_600_000));
}

// A visible freshness strip for data pages: "Data updated Xh ago · Patch 26.14 ·
// N ranked games analyzed". `patch` is the raw Data Dragon version.
export function DataFreshness({
  fetchedAt,
  patch,
  matchCount,
  gamesLabel = "ranked games analyzed",
  className = "",
}: {
  fetchedAt: string;
  patch: string;
  matchCount?: number;
  gamesLabel?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted ${className}`}>
      <span>Data updated {hoursAgo(fetchedAt)}h ago</span>
      <span aria-hidden>·</span>
      <span>Patch {formatGamePatch(patch)}</span>
      {matchCount ? (
        <>
          <span aria-hidden>·</span>
          <span>{matchCount.toLocaleString()} {gamesLabel}</span>
        </>
      ) : null}
    </div>
  );
}
