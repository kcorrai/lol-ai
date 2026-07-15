import type { ChampionBuild, PositionStats } from "@/domains/meta";
import type { ItemInfo } from "@/lib/ddragon/itemsData";
import type { RuneInfo } from "@/lib/ddragon/runesData";

interface BuildTextInput {
  name: string;
  laneLabel: string;
  gamePatch: string;
  overallTier: number;
  stats: PositionStats;
  build: ChampionBuild;
  items: Map<number, ItemInfo>;
  runes: Map<number, RuneInfo>;
  topCounterNames: string[];
}

export interface BuildFaq {
  question: string;
  answer: string;
}

const TIER_WORD: Record<number, string> = {
  1: "top-tier",
  2: "strong",
  3: "balanced",
  4: "situational",
  5: "off-meta",
};

function itemNames(ids: number[], items: Map<number, ItemInfo>): string {
  const names = ids.map((id) => items.get(id)?.name).filter(Boolean) as string[];
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function scalingSentence(build: ChampionBuild, name: string): string {
  const early = build.gameLengths.find((g) => g.minutes === 0)?.winRate;
  const late = build.gameLengths.find((g) => g.minutes === 40)?.winRate;
  if (early === undefined || late === undefined) return "";
  if (late >= early + 1)
    return ` It scales well — its win rate climbs to ${late.toFixed(1)}% in games past 40 minutes, so playing for the late game pays off`;
  if (early >= late + 1)
    return ` ${name} is an early-game champion (${early.toFixed(1)}% before 25 minutes) that wants to close games out before it falls off`;
  return ` It performs consistently across game lengths`;
}

export function buildIntro(i: BuildTextInput): string {
  const tier = TIER_WORD[i.overallTier] ?? "viable";
  // ARAM has no bans, so its snapshot reports a 0 ban rate — omit that clause.
  const rates =
    i.stats.banRate > 0
      ? `${i.stats.pickRate.toFixed(1)}% pick rate, ${i.stats.banRate.toFixed(1)}% ban rate`
      : `${i.stats.pickRate.toFixed(1)}% pick rate`;
  return (
    `${i.name} is currently a ${tier} ${i.laneLabel} pick on patch ${i.gamePatch}, holding a ` +
    `${i.stats.winRate.toFixed(1)}% win rate across ${i.stats.games.toLocaleString()} games ` +
    `(${rates}).` +
    `${scalingSentence(i.build, i.name)}. The setup below is the highest-win-rate build from real games this patch, not theorycraft.`
  );
}

export function buildReasoning(i: BuildTextInput): string {
  const core = itemNames(i.build.coreItems?.ids ?? [], i.items);
  const keystoneId = i.build.runes?.primaryRuneIds[0] ?? 0;
  const keystone = i.runes.get(keystoneId)?.name;
  const parts: string[] = [];
  if (i.build.starterItems) {
    parts.push(`Start ${itemNames(i.build.starterItems.ids, i.items)} and rush ${core || "the core items"}`);
  } else if (core) {
    parts.push(`Rush ${core}`);
  }
  if (i.build.coreItems) parts.push(`this core wins ${i.build.coreItems.winRate.toFixed(1)}% of ${i.laneLabel} games`);
  if (keystone) parts.push(`${keystone} is the keystone of choice`);
  if (i.build.skillMaxOrder.length > 0) parts.push(`most players max ${i.build.skillMaxOrder.join(" → ")}`);
  return parts.join("; ") + ".";
}

// VideoGame + ItemList + FAQPage structured data for a build page.
export function buildJsonLd(i: BuildTextInput, coreItemNames: string[]): object[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "VideoGame",
      name: `${i.name} — League of Legends`,
      gamePlatform: "PC",
      author: { "@type": "Organization", name: "Riot Games" },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${i.name} ${i.laneLabel} core build — Patch ${i.gamePatch}`,
      itemListElement: coreItemNames.map((n, idx) => ({ "@type": "ListItem", position: idx + 1, name: n })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: buildFaq(i).map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
  ];
}

export function buildFaq(i: BuildTextInput): BuildFaq[] {
  const core = itemNames(i.build.coreItems?.ids ?? [], i.items);
  const keystoneName = i.runes.get(i.build.runes?.primaryRuneIds[0] ?? 0)?.name ?? "the meta keystone";
  const primaryPath = i.runes.get(i.build.runes?.primaryPageId ?? 0)?.name ?? "";
  const secondaryPath = i.runes.get(i.build.runes?.secondaryPageId ?? 0)?.name ?? "";

  const faq: BuildFaq[] = [
    {
      question: `What are the best runes for ${i.name} ${i.laneLabel}?`,
      answer: `${keystoneName}${primaryPath ? ` in ${primaryPath}` : ""}${secondaryPath ? ` with ${secondaryPath} secondary` : ""} is the highest-win-rate rune page this patch${i.build.runes ? ` (${i.build.runes.winRate.toFixed(1)}% win rate)` : ""}.`,
    },
    {
      question: `What is the best build for ${i.name}?`,
      answer: core
        ? `Rush ${core}. It wins ${i.build.coreItems!.winRate.toFixed(1)}% of ${i.laneLabel} games on patch ${i.gamePatch}.`
        : `Build around ${i.name}'s highest-win-rate core items shown above, updated every patch.`,
    },
    {
      question: `Is ${i.name} good on patch ${i.gamePatch}?`,
      answer: `${i.name} has a ${i.stats.winRate.toFixed(1)}% win rate in ${i.laneLabel} this patch, which makes it a ${TIER_WORD[i.overallTier] ?? "viable"} pick.`,
    },
  ];
  if (i.topCounterNames.length > 0) {
    faq.push({
      question: `Who counters ${i.name}?`,
      answer: `${i.topCounterNames.slice(0, 3).join(", ")} are among the strongest counters to ${i.name} ${i.laneLabel} this patch, by ranked win rate.`,
    });
  }
  return faq;
}
