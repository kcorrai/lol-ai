import type { Metadata } from "next";
import { rankLine } from "@/lib/riot/rankDisplay";
import { regionLabel } from "@/lib/riot/regions";
import type { ProfileResult } from "../loadProfile";
import { buildProfileForm } from "./profileForm";

interface Identity {
  gameName: string;
  tagLine: string;
  region: string;
  /** The raw, still-encoded path segments, so the canonical URL matches the one that was requested. */
  path: { region: string; gameName: string; tagLine: string };
}

/**
 * The profile page's `<head>`.
 *
 * Split out of the page so it stays inside the component size cap (CLAUDE.md §3.3); it is one
 * pure function of an already-loaded profile, which also makes it the easiest half to read.
 */
export function profileMetadata(result: ProfileResult, id: Identity): Metadata {
  const name = `${id.gameName}#${id.tagLine}`;
  const server = regionLabel(id.region);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";
  const pageUrl = `${appUrl}/s/${id.path.region}/${id.path.gameName}/${id.path.tagLine}`;

  // A miss still renders a useful page, but it is not a page worth indexing — without this it is
  // a soft 404, since a page component cannot set a status code.
  if (!result.ok) {
    return {
      title: `${name} ${server} — not found | LaneIQ`,
      robots: { index: false, follow: true },
    };
  }

  const data = result.data;
  const rank = data.rank;
  const topChamp = data.topChampions[0];
  const totalGames = rank ? rank.wins + rank.losses : 0;
  const wr = totalGames > 0 ? Math.round((rank!.wins / totalGames) * 100) : null;
  const rankStr = rankLine(rank);

  // The averages go in the description because they are what a searcher is actually after, and
  // they are the half of the snippet a bare rank line never distinguishes two players by.
  const form = buildProfileForm(data.recentMatches, null);
  const formStr = form.metrics
    .filter((m) => m.label === "KDA" || m.label === "CS / min")
    .map((m) => `${m.value} ${m.label}`)
    .join(" · ");

  const description = `${name} League of Legends stats (${server}). ${rankStr}${
    wr !== null ? ` · ${wr}% WR` : ""
  }${topChamp ? ` · Most: ${topChamp.championName}` : ""}${
    formStr ? ` · ${formStr}` : ""
  }. Free LaneIQ profile — no login.`;

  const ogParams = new URLSearchParams({
    name,
    region: server,
    rank: rankStr,
    ...(wr !== null ? { wr: String(wr) } : {}),
    ...(topChamp ? { champ: topChamp.championName } : {}),
    ...(rank ? { tier: rank.tier } : {}),
  });
  const ogImage = `${appUrl}/api/og/summoner?${ogParams.toString()}`;

  return {
    title: `${name} ${server} — LoL Stats | LaneIQ`,
    description,
    keywords: [name, id.gameName, server, "League of Legends", "LoL stats", "rank", "AI coach"],
    alternates: { canonical: pageUrl },
    openGraph: {
      type: "profile",
      url: pageUrl,
      title: `${name} — ${rankStr} · LaneIQ`,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${name} LoL stats` }],
      siteName: "LaneIQ",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} — ${rankStr}`,
      description,
      images: [ogImage],
    },
  };
}
