import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { fetchPublicSummonerData } from "@/lib/riot/publicSummoner";
import { profileIconUrl, championIconUrl, rankEmblemUrl } from "@/lib/ddragon";
import { normalizeChampionKey } from "@/lib/ddragon";

export const dynamic = "force-dynamic";

interface Props {
  params: { region: string; gameName: string; tagLine: string };
}

// Rank crest colours are game data, not brand — they stay off the accent ladder
// and match the `rank.*` scale in tailwind.config.ts.
const TIER_COLORS: Record<string, string> = {
  IRON: "#8C8C8C", BRONZE: "#CD7F32", SILVER: "#C0C0C0",
  GOLD: "#FFC24B", PLATINUM: "#00C0A0", EMERALD: "#50C878",
  DIAMOND: "#B9F2FF", MASTER: "#9B59B6", GRANDMASTER: "#E74C3C", CHALLENGER: "#F1C40F",
};

const POSITION_LABELS: Record<string, string> = {
  TOP: "Top", JUNGLE: "Jungle", MIDDLE: "Mid", BOTTOM: "Bot", UTILITY: "Support", FILL: "—",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region, gameName, tagLine } = params;
  const decodedName = decodeURIComponent(gameName);
  const decodedTag = decodeURIComponent(tagLine);
  const name = `${decodedName}#${decodedTag}`;
  const server = region.toUpperCase();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";
  const pageUrl = `${appUrl}/s/${region}/${gameName}/${tagLine}`;

  // Fetch data for rich OG tags (best-effort)
  const result = await fetchPublicSummonerData(decodedName, decodedTag, region.toLowerCase());
  const data = result.ok ? result.data : null;
  const rank = data?.rank;
  const topChamp = data?.topChampions[0];
  const totalGames = rank ? rank.wins + rank.losses : 0;
  const wr = totalGames > 0 ? Math.round((rank!.wins / totalGames) * 100) : null;

  const rankStr = rank
    ? `${rank.tier.charAt(0)}${rank.tier.slice(1).toLowerCase()} ${rank.division} · ${rank.lp} LP`
    : "Unranked";
  const description = `${name} League of Legends stats (${server}). ${rankStr}${wr !== null ? ` · ${wr}% WR` : ""}${topChamp ? ` · Most: ${topChamp.championName}` : ""}. Get AI coach analysis.`;

  const ogParams = new URLSearchParams({
    name,
    region: server,
    rank: rankStr,
    ...(wr !== null ? { wr: String(wr) } : {}),
    ...(topChamp ? { champ: topChamp.championName } : {}),
    ...(rank ? { tier: rank.tier } : {}),
  });
  const ogImageUrl = `${appUrl}/api/og/summoner?${ogParams.toString()}`;

  return {
    title: `${name} ${server} — LoL Stats & AI Coach`,
    description,
    keywords: [
      name, decodedName, server, "League of Legends", "LoL stats",
      "LoL stats", "rank", "AI coach", "coaching",
      ...(topChamp ? [topChamp.championName] : []),
    ],
    alternates: { canonical: pageUrl },
    openGraph: {
      type: "profile",
      url: pageUrl,
      title: `${name} — ${rankStr} · LoL AI Coach`,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${name} LoL stats` }],
      siteName: "LoL AI Coach",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} — ${rankStr}`,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function SummonerPage({ params }: Props) {
  const gameName = decodeURIComponent(params.gameName);
  const tagLine = decodeURIComponent(params.tagLine);
  const region = params.region.toLowerCase();

  const result = await fetchPublicSummonerData(gameName, tagLine, region);

  if (!result.ok) {
    const displayName = `${gameName}#${tagLine}`;
    const displayRegion = region.toUpperCase();

    if (result.error.code === "RATE_LIMIT") {
      return (
        <div className="min-h-screen bg-background">
          <div className="border-b border-white/5 px-6 py-3">
            <Link href="/" className="font-display text-base font-bold text-accent hover:opacity-80">LoL AI Coach</Link>
          </div>
          <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
            <p className="mb-2 text-5xl font-bold text-text-muted/20">⏳</p>
            <h1 className="mb-2 text-xl font-bold text-text">Riot API is busy</h1>
            <p className="mb-6 text-sm text-text-muted">Try again in a few seconds.</p>
            <Link href="/" className="rounded-md bg-accent px-5 py-2 text-sm font-semibold text-background hover:opacity-90">Go to Home</Link>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
          <p className="mb-3 text-5xl font-bold text-text-muted/20">🔍</p>
          <h1 className="mb-2 text-xl font-bold text-text">{displayName} not found</h1>
          <p className="mb-6 max-w-sm text-sm text-text-muted">
            This player doesn&apos;t exist on the {displayRegion} server or their username may have changed.
          </p>
          <Link href="/" className="rounded-md bg-accent px-5 py-2 text-sm font-semibold text-background hover:opacity-90">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const { summoner, rank, recentMatches, topChampions } = result.data;
  const iconUrl = profileIconUrl(summoner.profileIconId);
  const rankEmblem = rank ? rankEmblemUrl(rank.tier) : null;
  const tierColor = rank ? (TIER_COLORS[rank.tier] ?? "#A7BCB5") : null;
  const totalRanked = rank ? rank.wins + rank.losses : 0;
  const winRate = totalRanked > 0 ? Math.round((rank!.wins / totalRanked) * 100) : null;
  const featuredChamp = topChampions[0]?.championName ?? null;
  const splashUrl = featuredChamp
    ? `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${normalizeChampionKey(featuredChamp)}_0.jpg`
    : null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `${summoner.gameName}#${summoner.tagLine} — LoL Stats`,
    url: `${appUrl}/s/${region}/${params.gameName}/${params.tagLine}`,
    mainEntity: {
      "@type": "Person",
      name: `${summoner.gameName}#${summoner.tagLine}`,
      description: rank
        ? `League of Legends player. ${rank.tier} ${rank.division} · ${rank.lp} LP`
        : "League of Legends player.",
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* No brand bar here — this route sits under app/(marketing), whose layout
          already renders MarketingHeader. A local one stacked a second wordmark
          directly beneath the real nav. */}

      <div className="mx-auto max-w-3xl px-4 py-8 space-y-4">

        {/* Hero card */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface">
          {splashUrl && (
            <>
              <Image fill alt="" aria-hidden src={splashUrl}
                className="object-cover object-[60%_15%] opacity-[0.12]"
                style={{ filter: "blur(2px) saturate(0.45)" }} />
              <div className="absolute inset-0 bg-gradient-to-b from-surface/60 via-surface/85 to-surface" />
            </>
          )}
          <div className="relative p-5">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <Image src={iconUrl} alt={summoner.gameName} width={64} height={64} unoptimized
                  className="rounded-full border-2 border-accent/40 shadow-[0_0_16px_rgba(198,255,61,0.2)]" />
                <span className="absolute -bottom-1 -right-1 rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-bold text-text-muted ring-1 ring-border">
                  {summoner.summonerLevel}
                </span>
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-xl font-bold text-text">
                  {summoner.gameName}
                  <span className="ml-1 text-text-muted/60">#{summoner.tagLine}</span>
                </h1>
                <p className="mt-0.5 text-xs text-text-muted uppercase tracking-wider">{region.toUpperCase()}</p>
                {rank && (
                  <div className="mt-1.5 flex items-center gap-2">
                    {rankEmblem && (
                      <Image src={rankEmblem} alt={rank.tier} width={20} height={20} unoptimized />
                    )}
                    <span className="text-sm font-semibold" style={{ color: tierColor ?? "#A7BCB5" }}>
                      {rank.tier.charAt(0)}{rank.tier.slice(1).toLowerCase()} {rank.division} · {rank.lp} LP
                    </span>
                    {winRate !== null && (
                      <span className="text-xs text-text-muted">{winRate}% WR</span>
                    )}
                  </div>
                )}
                {!rank && <p className="mt-0.5 text-sm text-text-muted">Unranked</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid — champions + matches side by side on desktop */}
        <div className="grid gap-4 md:grid-cols-2 md:items-start">
        {/* Top champions */}
        {topChampions.length > 0 && (
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-text-muted/60">
              Most Played Recently
            </h2>
            <div className="space-y-3">
              {topChampions.map((c, i) => (
                <div key={c.championName} className="flex items-center gap-3">
                  <span className="w-4 shrink-0 text-xs text-text-muted/40">{i + 1}</span>
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-border">
                    <Image fill alt={c.championName}
                      src={championIconUrl(c.championName)}
                      className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text">{c.championName}</span>
                      <span className="text-xs text-text-muted">{c.games} matches</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full"
                        style={{ width: `${c.winRate}%`, background: c.winRate >= 55 ? "#C6FF3D" : c.winRate >= 50 ? "#C6FF3D" : "#f87171" }} />
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-semibold"
                    style={{ color: c.winRate >= 55 ? "#C6FF3D" : c.winRate >= 50 ? "#C6FF3D" : "#f87171" }}>
                    {c.winRate}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent matches */}
        {recentMatches.length > 0 && (
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-text-muted/60">
              Recent Matches
            </h2>
            <div className="space-y-2">
              {recentMatches.map((m, i) => (
                <div key={i} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${m.win ? "bg-success/5 border border-success/15" : "bg-danger/5 border border-danger/15"}`}>
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-border">
                    <Image fill alt={m.championName}
                      src={championIconUrl(m.championName)}
                      className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-text">{m.championName}</p>
                    <p className="text-[10px] text-text-muted">{POSITION_LABELS[m.position] ?? m.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-text">{m.kills}/{m.deaths}/{m.assists}</p>
                    <p className={`text-[10px] font-bold ${m.win ? "text-success" : "text-danger"}`}>
                      {m.win ? "Victory" : "Defeat"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-accent/30 p-5 text-center"
          style={{ background: "linear-gradient(135deg, rgba(198,255,61,0.08) 0%, rgba(198,255,61,0) 100%)" }}>
          <p className="mb-1 text-sm font-semibold text-text">
            Get AI coach analysis for {summoner.gameName}
          </p>
          <p className="mb-4 text-xs text-text-muted">
            Where are you making mistakes? Your coach knows.
          </p>
          <Link href={`/register?ref=summoner`}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-background transition-opacity hover:opacity-90">
            Get Free AI Analysis →
          </Link>
        </div>

        {/* Search another */}
        <p className="text-center text-xs text-text-muted">
          Search another player:{" "}
          <Link href="/#demo" className="text-accent hover:underline">home demo →</Link>
        </p>
      </div>
    </div>
  );
}
