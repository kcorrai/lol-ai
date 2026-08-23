"use client";

import { useState } from "react";
import Link from "next/link";
import posthog from "posthog-js";
import { useSession } from "next-auth/react";
import { useYouVsPros } from "@/hooks/useYouVsPros";
import { REGIONS, DEFAULT_REGION } from "@/lib/riot/regions";
import { splitRiotId } from "@/lib/riot/riotId";
import { buildComparison, formatMetric, isLowSample } from "@/domains/esports/comparison";
import type { PlayerChampionAverages } from "@/domains/esports/comparison";
import type { ProChampionAverages } from "@/domains/esports/types";

function track(event: string, properties: Record<string, unknown>): void {
  // The provider only initialises when a key is configured, so this is a no-op
  // in development rather than a crash.
  if (posthog.__loaded) posthog.capture(event, properties);
}

function Row({
  label,
  pro,
  you,
  reading,
}: {
  label: string;
  pro: string;
  you: string;
  reading: string | null;
}): React.ReactElement {
  return (
    <tr className="border-b border-border/60 align-top last:border-0">
      <th scope="row" className="px-3 py-2 text-left font-normal text-text-body">
        {label}
        {reading && <span className="mt-0.5 block text-xs text-text-faint">{reading}</span>}
      </th>
      <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-text">{pro}</td>
      <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-text">{you}</td>
    </tr>
  );
}

function Comparison({
  championName,
  pro,
  proGames,
  you,
  label,
}: {
  championName: string;
  pro: ProChampionAverages;
  proGames: number;
  you: PlayerChampionAverages;
  label: string;
}): React.ReactElement {
  const rows = buildComparison(pro, you);

  return (
    <div className="mt-4">
      {isLowSample(you) && (
        <p className="mb-3 text-sm text-text-muted">
          Only {you.games} {you.games === 1 ? "game" : "games"} on {championName} in that history.
          The numbers are below, but nothing is read into a sample this small.
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[22rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th scope="col" className="hud-label px-3 py-2 font-normal" />
              <th scope="col" className="hud-label px-3 py-2 text-right font-normal">
                Pros ({proGames})
              </th>
              <th scope="col" className="hud-label px-3 py-2 text-right font-normal">
                {label} ({you.games})
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Row
                key={row.key}
                label={row.label}
                pro={formatMetric(row.pro, row.format)}
                you={formatMetric(row.you, row.format)}
                reading={row.reading}
              />
            ))}
          </tbody>
        </table>
      </div>

      {you.creepScore === null && (
        // The absent rows are the reason to sign in, so say which they are
        // rather than showing a shorter table with no explanation.
        <p className="mt-3 text-xs text-text-faint">
          CS, gold and warding need your match history synced — Riot&apos;s public data carries
          results and KDA only.
        </p>
      )}
    </div>
  );
}

/**
 * The champion page's conversion step.
 *
 * Nothing is fetched on page view: the signed-out path reaches Riot for a
 * stranger's account, and arriving on a page is not a request to do that. It
 * runs when someone asks.
 */
export function YouVsThePros({
  championId,
  championName,
  pro,
  proGames,
}: {
  championId: string;
  championName: string;
  pro: ProChampionAverages;
  proGames: number;
}): React.ReactElement {
  const { status } = useSession();
  const lookup = useYouVsPros();
  const [riotId, setRiotId] = useState("");
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [error, setError] = useState<string | null>(null);

  const signedIn = status === "authenticated";

  function submit(event: React.FormEvent): void {
    event.preventDefault();
    setError(null);

    const parts = splitRiotId(riotId);
    if (!parts) {
      setError("Enter a Riot ID as Name#TAG.");
      return;
    }

    track("esports_you_vs_pros_submit", { champion: championId, source: "riot-id", region });
    lookup.mutate(
      { champion: championId, gameName: parts.gameName, tagLine: parts.tagLine, region },
      { onError: (err) => setError(err.message) }
    );
  }

  function loadMine(): void {
    setError(null);
    track("esports_you_vs_pros_submit", { champion: championId, source: "connected" });
    lookup.mutate({ champion: championId }, { onError: (err) => setError(err.message) });
  }

  const result = lookup.data;

  return (
    <section className="gaming-card notch mt-12 px-4 py-4">
      <h2 className="font-display text-xl font-extrabold uppercase text-text md:text-2xl">
        You vs the pros
      </h2>
      <p className="mt-1 text-sm text-text-muted">
        You play {championName}. How does your line compare?
      </p>

      {signedIn ? (
        <button
          type="button"
          onClick={loadMine}
          disabled={lookup.isPending}
          className="mt-3 bg-accent px-4 py-2 font-display text-sm font-bold uppercase text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {lookup.isPending ? "Reading your games…" : "Compare my games"}
        </button>
      ) : (
        <form onSubmit={submit} className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={riotId}
            onChange={(event) => setRiotId(event.target.value)}
            placeholder="Name#TAG"
            aria-label="Your Riot ID"
            className="min-w-0 flex-1 border border-border bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
          />
          <select
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            aria-label="Region"
            className="border border-border bg-surface-2 px-2 py-2 font-mono text-xs uppercase text-text-body focus:border-accent focus:outline-none"
          >
            {REGIONS.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={lookup.isPending}
            className="bg-accent px-4 py-2 font-display text-sm font-bold uppercase text-background transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {lookup.isPending ? "Looking…" : "Compare"}
          </button>
        </form>
      )}

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      {result && !result.averages && (
        <p className="mt-3 text-sm text-text-muted">
          No recent {championName} games found for {result.riotId ?? "that account"}. The comparison
          needs at least one.
        </p>
      )}

      {result?.averages && (
        <>
          <Comparison
            championName={championName}
            pro={pro}
            proGames={proGames}
            you={result.averages}
            label={result.source === "connected" ? "You" : (result.riotId ?? "You")}
          />

          {/* Stated once, plainly, next to the numbers rather than behind a
              tooltip: these are not like-for-like games. */}
          <p className="mt-3 text-xs text-text-faint">
            Pro games are stage games on a fresh patch with a full draft and a coached team behind
            them. Solo queue is not that, and the gap in these rows is partly the format rather than
            the player.
          </p>

          <Link
            href={result.source === "connected" ? "/dashboard" : "/register"}
            onClick={() =>
              track("esports_you_vs_pros_cta", { champion: championId, source: result.source })
            }
            className="mt-4 inline-block text-sm text-accent hover:underline"
          >
            {result.source === "connected"
              ? "See the full breakdown on your dashboard →"
              : "Get the full breakdown — free →"}
          </Link>
        </>
      )}
    </section>
  );
}
