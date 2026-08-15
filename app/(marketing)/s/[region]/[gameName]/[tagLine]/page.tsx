import type { Metadata } from "next";
import Link from "next/link";
import { PlayerSearchBar } from "@/components/search/PlayerSearchBar";
import { rankLine } from "@/lib/riot/rankDisplay";
import { regionLabel } from "@/lib/riot/regions";
import { loadProfile } from "../../../loadProfile";
import { ProfileHero } from "../../../components/ProfileHero";
import { ProfileChampions } from "../../../components/ProfileChampions";
import { ProfileRoles } from "../../../components/ProfileRoles";
import { ProfileMatches } from "../../../components/ProfileMatches";
import { ProfileNotFound } from "../../../components/ProfileNotFound";

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
  const name = `${gameName}#${tagLine}`;
  const server = regionLabel(region);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";
  const pageUrl = `${appUrl}/s/${params.region}/${params.gameName}/${params.tagLine}`;

  // Shares a cached load with the page component below — see loadProfile.
  const result = await loadProfile(gameName, tagLine, region);

  // A miss still renders a useful page, but it is not a page worth indexing — without this it is
  // a soft 404, since a page component cannot set a status code.
  if (!result.ok) {
    return {
      title: `${name} ${server} — not found | LaneIQ`,
      robots: { index: false, follow: true },
    };
  }

  const data = result.data;
  const rank = data?.rank ?? null;
  const topChamp = data?.topChampions[0];
  const totalGames = rank ? rank.wins + rank.losses : 0;
  const wr = totalGames > 0 ? Math.round((rank!.wins / totalGames) * 100) : null;

  const rankStr = rankLine(rank);
  const description = `${name} League of Legends stats (${server}). ${rankStr}${
    wr !== null ? ` · ${wr}% WR` : ""
  }${topChamp ? ` · Most: ${topChamp.championName}` : ""}. Free LaneIQ profile — no login.`;

  const ogParams = new URLSearchParams({
    name,
    region: server,
    rank: rankStr,
    ...(wr !== null ? { wr: String(wr) } : {}),
    ...(topChamp ? { champ: topChamp.championName } : {}),
    ...(rank ? { tier: rank.tier } : {}),
  });

  return {
    title: `${name} ${server} — LoL Stats | LaneIQ`,
    description,
    keywords: [name, gameName, server, "League of Legends", "LoL stats", "rank", "AI coach"],
    alternates: { canonical: pageUrl },
    openGraph: {
      type: "profile",
      url: pageUrl,
      title: `${name} — ${rankStr} · LaneIQ`,
      description,
      images: [
        {
          url: `${appUrl}/api/og/summoner?${ogParams.toString()}`,
          width: 1200,
          height: 630,
          alt: `${name} LoL stats`,
        },
      ],
      siteName: "LaneIQ",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} — ${rankStr}`,
      description,
      images: [`${appUrl}/api/og/summoner?${ogParams.toString()}`],
    },
  };
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

  const { summoner, rank, recentMatches, topChampions, aiInsight } = result.data;
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
    <div className="mx-auto max-w-[980px] space-y-4 px-4 py-7">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Searching the next player is the most likely next action on this page, so the box is
          here rather than only in the header. */}
      <div className="max-w-[420px]">
        <PlayerSearchBar placeholder="Search another player" />
      </div>

      <ProfileHero data={result.data} region={region} />

      <div className="grid gap-4 md:grid-cols-2 md:items-start">
        <div className="grid gap-4">
          <ProfileChampions champions={topChampions} totalGames={recentMatches.length} />
          <ProfileRoles matches={recentMatches} />
        </div>
        <ProfileMatches matches={recentMatches} />
      </div>

      {aiInsight && (
        <section className="notch border border-l-[3px] border-border border-l-accent bg-surface p-5">
          <p className="hud-label mb-2">{"// Read"}</p>
          <p className="text-[14px] leading-relaxed text-text-body">{aiInsight}</p>
        </section>
      )}

      <section className="notch bg-hero-fade border border-accent/30 p-6 text-center">
        <p className="font-display text-lg font-bold uppercase text-text">
          Where {summoner.gameName} is losing games
        </p>
        <p className="mx-auto mt-1.5 max-w-[420px] text-sm text-text-muted">
          The full report reads twenty games, not ten, and tells you which habit is costing you
          the most LP.
        </p>
        <Link
          href="/register?ref=summoner"
          className="tag-cut mt-5 inline-flex h-11 items-center gap-2 bg-accent px-6 font-display text-xs font-bold uppercase tracking-[0.1em] text-background transition-colors hover:bg-acid-400"
        >
          Get the free AI report →
        </Link>
      </section>
    </div>
  );
}
