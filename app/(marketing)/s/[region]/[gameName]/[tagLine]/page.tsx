import { notFound } from "next/navigation";
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

const TIER_COLORS: Record<string, string> = {
  IRON: "#4a4a5a", BRONZE: "#a05336", SILVER: "#a8b8c8",
  GOLD: "#c89b3c", PLATINUM: "#3cba8c", EMERALD: "#00be93",
  DIAMOND: "#576bce", MASTER: "#9e4fc6", GRANDMASTER: "#e84057", CHALLENGER: "#f4c874",
};

const POSITION_LABELS: Record<string, string> = {
  TOP: "Üst", JUNGLE: "Orman", MIDDLE: "Orta", BOTTOM: "Alt", UTILITY: "Destek", FILL: "—",
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
  const description = `${name} League of Legends istatistikleri (${server}). ${rankStr}${wr !== null ? ` · %${wr} WR` : ""}${topChamp ? ` · En çok: ${topChamp.championName}` : ""}. AI koç analizi al.`;

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
    title: `${name} ${server} — LoL İstatistikleri & AI Koç`,
    description,
    keywords: [
      name, decodedName, server, "League of Legends", "LoL stats",
      "LoL istatistik", "rank", "AI koç", "coaching",
      ...(topChamp ? [topChamp.championName] : []),
    ],
    alternates: { canonical: pageUrl },
    openGraph: {
      type: "profile",
      url: pageUrl,
      title: `${name} — ${rankStr} · LoL AI Coach`,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${name} LoL istatistikleri` }],
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
    if (result.error.code === "NOT_FOUND") notFound();
    if (result.error.code === "RATE_LIMIT") {
      return (
        <div className="flex min-h-[40vh] items-center justify-center p-8 text-center">
          <p className="text-text-muted">Riot API şu an meşgul. Birkaç saniye sonra tekrar dene.</p>
        </div>
      );
    }
    notFound();
  }

  const { summoner, rank, recentMatches, topChampions } = result.data;
  const iconUrl = profileIconUrl(summoner.profileIconId);
  const rankEmblem = rank ? rankEmblemUrl(rank.tier) : null;
  const tierColor = rank ? (TIER_COLORS[rank.tier] ?? "#a5b4fc") : null;
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
        ? `League of Legends oyuncusu. ${rank.tier} ${rank.division} · ${rank.lp} LP`
        : "League of Legends oyuncusu.",
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Brand bar */}
      <div className="border-b border-white/5 px-6 py-3">
        <Link href="/" className="font-display text-base font-bold text-accent hover:opacity-80">
          LoL AI Coach
        </Link>
      </div>

      <div className="mx-auto max-w-lg px-4 py-8 space-y-4">

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
                  className="rounded-full border-2 border-accent/40 shadow-[0_0_16px_rgba(200,155,60,0.2)]" />
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
                    <span className="text-sm font-semibold" style={{ color: tierColor ?? "#a5b4fc" }}>
                      {rank.tier.charAt(0)}{rank.tier.slice(1).toLowerCase()} {rank.division} · {rank.lp} LP
                    </span>
                    {winRate !== null && (
                      <span className="text-xs text-text-muted">%{winRate} KO</span>
                    )}
                  </div>
                )}
                {!rank && <p className="mt-0.5 text-sm text-text-muted">Unranked</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Top champions */}
        {topChampions.length > 0 && (
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-text-muted/60">
              Son Maçlarda En Çok
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
                      <span className="text-xs text-text-muted">{c.games} maç</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full"
                        style={{ width: `${c.winRate}%`, background: c.winRate >= 55 ? "#4ade80" : c.winRate >= 50 ? "#c89b3c" : "#f87171" }} />
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-semibold"
                    style={{ color: c.winRate >= 55 ? "#4ade80" : c.winRate >= 50 ? "#c89b3c" : "#f87171" }}>
                    %{c.winRate}
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
              Son Maçlar
            </h2>
            <div className="space-y-2">
              {recentMatches.map((m, i) => (
                <div key={i} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${m.win ? "bg-success/5 border border-success/15" : "bg-danger/5 border border-danger/15"}`}>
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg">
                    <Image fill alt={m.championName}
                      src={`https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${normalizeChampionKey(m.championName)}_0.jpg`}
                      className="object-cover object-top scale-125" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-text">{m.championName}</p>
                    <p className="text-[10px] text-text-muted">{POSITION_LABELS[m.position] ?? m.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-text">{m.kills}/{m.deaths}/{m.assists}</p>
                    <p className={`text-[10px] font-bold ${m.win ? "text-success" : "text-danger"}`}>
                      {m.win ? "Galibiyet" : "Mağlubiyet"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="rounded-2xl border border-accent/30 p-5 text-center"
          style={{ background: "linear-gradient(135deg, rgba(200,155,60,0.08) 0%, rgba(88,70,180,0.06) 100%)" }}>
          <p className="mb-1 text-sm font-semibold text-text">
            {summoner.gameName} için AI koç analizi al
          </p>
          <p className="mb-4 text-xs text-text-muted">
            Nerede hata yapıyorsun? Koçun söylüyor.
          </p>
          <Link href={`/register?ref=summoner`}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-background transition-opacity hover:opacity-90">
            Ücretsiz AI Analiz Al →
          </Link>
        </div>

        {/* Search another */}
        <p className="text-center text-xs text-text-muted">
          Başka bir oyuncu ara:{" "}
          <Link href="/#demo" className="text-accent hover:underline">Ana sayfa demo →</Link>
        </p>
      </div>
    </div>
  );
}
