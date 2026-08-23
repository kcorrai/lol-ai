import type { Metadata } from "next";
import Link from "next/link";
import { PlayerSearchBar } from "@/components/search/PlayerSearchBar";
import { getBenchmarkForTier } from "@/domains/analysis";
import { rankLine } from "@/lib/riot/rankDisplay";
import { loadProfile } from "../../../loadProfile";
import { ProfileHero } from "../../../components/ProfileHero";
import { ProfileChampions } from "../../../components/ProfileChampions";
import { ProfileFormStrip } from "../../../components/ProfileFormStrip";
import { ProfileMastery } from "../../../components/ProfileMastery";
import { ProfileRoles } from "../../../components/ProfileRoles";
import { ProfileMatches } from "../../../components/ProfileMatches";
import { ProfileNotFound } from "../../../components/ProfileNotFound";
import { ClaimProfileButton } from "../../../components/ClaimProfileButton";
import { profileMetadata } from "../../../components/profileMetadata";
import { jsonLdProps } from "@/lib/security/jsonLd";

export const dynamic = "force-dynamic";

interface Props {
  params: { region: string; gameName: string; tagLine: string };
}

function decode(params: Props["params"]) {
  return {
    gameName: decodeURIComponent(params.gameName),
    tagLine: decodeURIComponent(params.tagLine),
    region: params.region.toLowerCase(),
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { gameName, tagLine, region } = decode(params);
  // Shares a cached load with the page component below — see loadProfile.
  const result = await loadProfile(gameName, tagLine, region);
  return profileMetadata(result, { gameName, tagLine, region, path: params });
}

/**
 * The tier averages, or null if they cannot be read.
 *
 * This page is derived entirely from Riot data and has been careful since TASK-285 that a cache
 * or database outage costs it nothing — `loadProfile` guards both. Benchmarks are the one thing
 * on it that reaches Postgres, and unguarded they undid that: with the database down, a *ranked*
 * player's profile threw while an unranked one rendered fine. A missing benchmark is already a
 * supported state, so it is the right thing to degrade to.
 */
async function tierBenchmarks(tier: string) {
  try {
    return await getBenchmarkForTier(tier);
  } catch {
    return null;
  }
}

export default async function SummonerPage({ params }: Props): Promise<React.ReactElement> {
  const { gameName, tagLine, region } = decode(params);
  const result = await loadProfile(gameName, tagLine, region);

  if (!result.ok) {
    return (
      <ProfileNotFound
        riotId={`${gameName}#${tagLine}`}
        region={region}
        rateLimited={result.reason === "rate-limited"}
      />
    );
  }

  const { summoner, rank, recentMatches, topChampions, aiInsight, mastery, scoreboards, puuid } =
    result.data;

  // Null for an unranked player, and the form strip then simply has nothing to compare against.
  const benchmarks = rank ? await tierBenchmarks(rank.tier) : null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `${summoner.gameName}#${summoner.tagLine} — LoL Stats`,
    url: `${appUrl}/s/${params.region}/${params.gameName}/${params.tagLine}`,
    mainEntity: {
      "@type": "Person",
      name: `${summoner.gameName}#${summoner.tagLine}`,
      description: rank
        ? `League of Legends player. ${rankLine(rank)}`
        : "League of Legends player.",
    },
  };

  return (
    <div className="mx-auto max-w-[1240px] space-y-4 px-4 py-7">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdProps(jsonLd)} />

      {/* Searching the next player is the most likely next action on this page, so the box is
          here rather than only in the header. */}
      <div className="max-w-[420px]">
        <PlayerSearchBar placeholder="Search another player" />
      </div>

      <ProfileHero data={result.data} region={region} />

      {/* Rail + main, the shape every stats site converged on: the identity and the pool stay
          fixed on the left while the match list — the thing people scroll — takes the width it
          needs for an expanded scoreboard. */}
      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        <div className="grid gap-4">
          <ProfileChampions champions={topChampions} totalGames={recentMatches.length} />
          <ProfileMastery mastery={mastery} />
          <ProfileRoles matches={recentMatches} />

          {aiInsight && (
            <section className="notch border border-l-[3px] border-border border-l-accent bg-surface p-5">
              <p className="hud-label mb-2">{"// Read"}</p>
              <p className="text-[14px] leading-relaxed text-text-body">{aiInsight}</p>
            </section>
          )}
        </div>

        <div className="grid gap-4">
          <ProfileFormStrip
            matches={recentMatches}
            benchmarks={benchmarks}
            tierLabel={rank ? rank.tier : null}
          />
          <ProfileMatches
            matches={recentMatches}
            scoreboards={scoreboards}
            puuid={puuid}
            region={region}
            gameName={summoner.gameName}
            tagLine={summoner.tagLine}
          />
        </div>
      </div>

      <section className="notch bg-hero-fade border border-accent/30 p-6 text-center">
        <p className="font-display text-lg font-bold uppercase text-text">
          Where {summoner.gameName} is losing games
        </p>
        <p className="mx-auto mt-1.5 max-w-[440px] text-sm text-text-muted">
          The full report reads twenty games, not ten, and tells you which habit is costing you the
          most LP. Claiming this profile is the whole setup — the Riot ID is already known.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <ClaimProfileButton
            target={{ region, gameName: summoner.gameName, tagLine: summoner.tagLine }}
          />
          <Link
            href="/register?ref=summoner"
            className="font-mono text-[11px] uppercase tracking-label text-text-muted transition-colors hover:text-text"
          >
            Not me — just sign up →
          </Link>
        </div>
      </section>
    </div>
  );
}
