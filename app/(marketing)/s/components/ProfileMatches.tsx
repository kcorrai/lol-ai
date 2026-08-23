"use client";

import { useMemo, useState } from "react";
import { queueLabel } from "@/domains/match/archive/archiveLabels";
import { usePublicMatches } from "@/hooks/usePublicMatches";
import type { PreviewMatch, PreviewScoreboard } from "@/types/preview";
import { ProfileMatchRow } from "./ProfileMatchRow";

interface Props {
  matches: PreviewMatch[];
  scoreboards: Record<string, PreviewScoreboard>;
  puuid: string | null;
  region: string;
  gameName: string;
  tagLine: string;
}

const ALL = "ALL";

export function ProfileMatches({
  matches,
  scoreboards,
  puuid,
  region,
  gameName,
  tagLine,
}: Props): React.ReactElement | null {
  const [queue, setQueue] = useState<string>(ALL);
  // The hook stays idle until the visitor asks for more, so a profile view is one server render
  // and no client request at all.
  const [paging, setPaging] = useState(false);

  const pages = usePublicMatches({
    region,
    gameName,
    tagLine,
    serverRendered: matches.length,
    enabled: paging,
  });

  // One clock for the whole list, so ten rows cannot disagree about what "3h ago" means. Read at
  // render rather than in an effect: these stamps are coarse enough that a stale minute is
  // invisible, and a state-backed clock would re-render every row for nothing.
  const now = useMemo(() => Date.now(), []);

  // Memoised so the `?? []` fallback is not a fresh array on every render, which would defeat
  // both memos below.
  const loaded = useMemo(() => pages.data?.pages ?? [], [pages.data]);

  const allMatches = useMemo(
    () => [...matches, ...loaded.flatMap((p) => p.matches)],
    [matches, loaded]
  );
  const allScoreboards = useMemo(() => {
    const merged: Record<string, PreviewScoreboard> = { ...scoreboards };
    for (const page of loaded) Object.assign(merged, page.scoreboards);
    return merged;
  }, [scoreboards, loaded]);

  // Only offer the queues this player actually has — the same rule the signed-in archive uses.
  // A tab that filters to nothing is worse than no tab.
  const queues = useMemo(() => {
    const present = new Set<string>();
    for (const m of allMatches) if (m.queueType) present.add(m.queueType);
    return Array.from(present).sort();
  }, [allMatches]);

  const visible = queue === ALL ? allMatches : allMatches.filter((m) => m.queueType === queue);

  if (matches.length === 0) return null;

  // Before the first click there is no page to ask, so assume there is more; after it, the
  // server's own answer decides.
  const canLoadMore = paging ? pages.hasNextPage : true;
  const busy = pages.isFetching;

  return (
    <section className="notch border border-border bg-surface p-5">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
        <p className="hud-label">{`// Last ${allMatches.length} matches`}</p>

        {queues.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {[ALL, ...queues].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQueue(q)}
                aria-pressed={queue === q}
                className={`border px-2.5 py-1 font-mono text-[10px] uppercase tracking-label transition-colors ${
                  queue === q
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-text-muted hover:text-text"
                }`}
              >
                {q === ALL ? "All" : queueLabel(q)}
              </button>
            ))}
          </div>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-text-muted">No games in that queue yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {visible.map((m) => (
            <ProfileMatchRow
              key={m.matchId}
              match={m}
              scoreboard={allScoreboards[m.matchId] ?? null}
              puuid={puuid}
              region={region}
              now={now}
            />
          ))}
        </ul>
      )}

      {canLoadMore && (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (paging) void pages.fetchNextPage();
            else setPaging(true);
          }}
          className="mt-4 w-full border border-border py-2 font-mono text-[11px] uppercase tracking-label text-text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {busy ? "Loading…" : "Load more matches"}
        </button>
      )}

      {pages.isError && (
        <p className="mt-2 text-center text-[12px] text-danger">
          Could not load more matches. Try again in a moment.
        </p>
      )}
    </section>
  );
}
