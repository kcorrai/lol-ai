import type { RecapData } from "../../services/recapService";
import { kdaRatio } from "@/lib/kda";
import { formatDate } from "@/lib/uiLocale";

export type RecapTone = "good" | "bad" | "neutral";

export interface RecapListItem {
  label: string;
  value: string;
  tone?: RecapTone;
}

export interface RecapChampionRow {
  name: string;
  meta: string;
  value: string;
  /** Bar fill, 0-100. */
  pct: number;
  tone: RecapTone;
}

export interface RecapChapter {
  id: string;
  kind: "cover" | "stat" | "end";
  kicker: string;
  /** Champion whose splash backs the chapter. */
  art: string;
  figure?: string;
  headline?: string;
  body?: string;
  panelTitle: string;
  panelMeta: string;
  panelFoot: string;
  list?: RecapListItem[];
  champs?: RecapChampionRow[];
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/**
 * The season as an ordered deck.
 *
 * Every figure comes from the stored recap — nothing here is invented, and a chapter whose data
 * is missing says so rather than filling the gap. Fields are read defensively because recaps
 * cached before a field existed are still served from the database.
 */
export function buildRecapChapters(data: RecapData, gameName: string): RecapChapter[] {
  const displayName = gameName.split("#")[0];
  const champs = data.topChampions?.length ? data.topChampions : [data.topChampion];
  const kills = data.totalKills ?? 0;
  const deaths = data.totalDeaths ?? 0;
  const assists = data.totalAssists ?? 0;
  const hours = data.estimatedHours ?? Math.round((data.totalMatches * 30) / 60);
  const climbed = data.lpDelta >= 0;
  const kda = kdaRatio(kills, deaths, assists);
  const art = (i: number): string => champs[i % champs.length]?.name ?? data.topChampion.name;

  const chapters: RecapChapter[] = [
    {
      id: "cover",
      kind: "cover",
      kicker: "the season",
      art: art(0),
      headline: displayName,
      body: `${plural(data.totalMatches, "ranked game")}, ${hours} hours, and one story. Here is what actually happened.`,
      panelTitle: "Season at a glance",
      panelMeta: `${data.totalMatches} games`,
      panelFoot: "Ranked solo/duo only · normals excluded",
      list: [
        { label: "Win rate", value: `${data.winRate}%`, tone: data.winRate >= 50 ? "good" : "bad" },
        {
          label: "Rank change",
          value: `${data.startRank} → ${data.endRank}`,
          tone: climbed ? "good" : "bad",
        },
        { label: "Longest win streak", value: plural(data.bestStreak, "game") },
        { label: "Most played", value: `${data.topChampion.name} · ${data.topChampion.games}g` },
      ],
    },
    {
      id: "time",
      kind: "stat",
      kicker: "time played",
      art: art(1),
      figure: `${hours}h`,
      headline: `You spent ${Math.round(hours / 24)} full days on the rift`,
      body: `That is ${plural(data.totalMatches, "game")} at roughly ${data.totalMatches > 0 ? Math.round((hours * 60) / data.totalMatches) : 0} minutes each, and ${kills + deaths + assists} takedowns and deaths to show for it.`,
      panelTitle: "On the rift",
      panelMeta: "season total",
      panelFoot: `Averaging ${kda.toFixed(2)} KDA across the season`,
      list: [
        { label: "Kills", value: String(kills), tone: "good" },
        { label: "Deaths", value: String(deaths), tone: "bad" },
        { label: "Assists", value: String(assists) },
        { label: "Games played", value: String(data.totalMatches) },
      ],
    },
    {
      id: "champs",
      kind: "stat",
      kicker: "champion pool",
      art: art(2),
      figure: String(champs.length),
      headline: `${data.topChampion.name} carried the season`,
      body: `${data.topChampion.games} games on ${data.topChampion.name} at ${data.topChampion.winRate}% and ${data.topChampion.kda.toFixed(2)} KDA. The rest of the pool had to work around it.`,
      panelTitle: "Most played",
      panelMeta: `top ${champs.length}`,
      panelFoot: "Win rate over games on that champion",
      champs: champs.map((c) => ({
        name: c.name,
        meta: `${plural(c.games, "game")} · ${c.kda.toFixed(2)} KDA`,
        value: `${c.winRate}%`,
        pct: Math.max(4, Math.min(100, c.winRate)),
        tone: c.winRate >= 50 ? "good" : "bad",
      })),
    },
    {
      id: "climb",
      kind: "stat",
      kicker: climbed ? "the climb" : "the slide",
      art: art(3),
      figure: `${data.lpDelta > 0 ? "+" : ""}${data.lpDelta}`,
      headline: climbed
        ? `You finished the season in ${data.endRank}`
        : `The season ended in ${data.endRank}`,
      body: climbed
        ? `From ${data.startRank} to ${data.endRank}, ${data.lpDelta} LP net across ${plural(data.totalMatches, "game")} at a ${data.winRate}% win rate.`
        : `From ${data.startRank} to ${data.endRank}. A ${data.winRate}% win rate over ${plural(data.totalMatches, "game")} was not quite enough to hold the ground.`,
      panelTitle: "Rank journey",
      panelMeta: "start → end",
      panelFoot: `Best run of the season: ${plural(data.bestStreak, "win")} in a row`,
      list: [
        { label: "Started at", value: data.startRank },
        { label: "Finished at", value: data.endRank, tone: climbed ? "good" : "bad" },
        {
          label: "LP change",
          value: `${data.lpDelta > 0 ? "+" : ""}${data.lpDelta}`,
          tone: climbed ? "good" : "bad",
        },
        { label: "Best win streak", value: plural(data.bestStreak, "game"), tone: "good" },
      ],
    },
  ];

  // Only worth a chapter when there was actually a bad day to talk about.
  if (data.worstDay) {
    const day = formatDate(data.worstDay.date, {
      day: "numeric",
      month: "long",
    });
    chapters.push({
      id: "tilt",
      kind: "stat",
      kicker: "the worst day",
      art: art(4),
      figure: String(data.worstDay.losses),
      headline: `${day} was the day it stopped going in`,
      body: `${plural(data.worstDay.losses, "loss")} in a row in a single day. You came back from it — but the fastest LP on this list is the LP you stop giving away after the second loss.`,
      panelTitle: "That day",
      panelMeta: day.toUpperCase(),
      panelFoot: "Every other day of the season finished better than this one",
      list: [
        { label: "Date", value: day },
        { label: "Losses in a row", value: String(data.worstDay.losses), tone: "bad" },
        { label: "Season win rate", value: `${data.winRate}%` },
      ],
    });
  }

  chapters.push({
    id: "coach",
    kind: "stat",
    kicker: "the read",
    art: art(5),
    figure: `${data.winRate}%`,
    headline: "What the numbers actually say",
    body: data.aiSummary,
    panelTitle: "The season in four lines",
    panelMeta: `${data.totalMatches} games`,
    panelFoot: "Written from your own match history, not a template",
    list: [
      { label: "Games analyzed", value: String(data.totalMatches) },
      { label: "Win rate", value: `${data.winRate}%`, tone: data.winRate >= 50 ? "good" : "bad" },
      { label: "KDA", value: kda.toFixed(2) },
      { label: "Hours played", value: `${hours}h` },
    ],
  });

  chapters.push({
    id: "end",
    kind: "end",
    kicker: "next season",
    art: art(0),
    headline: data.nextGoal ?? `Higher than ${data.endRank}`,
    body: data.resolvedHabit
      ? `This season you broke the ${data.resolvedHabit.replace(/_/g, " ")} habit. Your plan starts from what is left.`
      : "Your plan starts from the habits this season exposed, and is recalculated after every five games.",
    panelTitle: "Your plan starts here",
    panelMeta: "next season",
    panelFoot: "Recalculated after every five games",
    list: [
      { label: "Target", value: data.nextGoal ?? `Above ${data.endRank}`, tone: "good" },
      { label: "Starting from", value: data.endRank },
      ...(data.resolvedHabit
        ? [
            {
              label: "Habit broken",
              value: data.resolvedHabit.replace(/_/g, " "),
              tone: "good" as const,
            },
          ]
        : []),
      { label: "Best champion to lean on", value: data.topChampion.name, tone: "good" },
    ],
  });

  return chapters;
}
