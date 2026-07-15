import type { MetaMover, MetaReport } from "@/domains/meta";

// A ~200-word, data-driven patch summary. Every figure comes from the live
// snapshot so the copy is unique per patch (Google's scaled-content guard).
export function metaSummary(r: MetaReport, gamePatch: string): string {
  const games = r.matchCount ? `${r.matchCount.toLocaleString()} ranked games` : "millions of ranked games";
  const parts: string[] = [
    `Patch ${gamePatch} has reshaped the League of Legends meta. Across ${games} analyzed this patch, champion power rankings shifted as buffs, nerfs and item changes landed.`,
  ];

  const c0 = r.climbers[0];
  if (c0) {
    parts.push(
      `The single biggest winner is ${c0.name}, climbing ${c0.delta} spots to overall rank ${c0.rank} with a ${c0.winRate.toFixed(1)}% win rate at a ${c0.pickRate.toFixed(1)}% pick rate.`
    );
  }
  const c1 = r.climbers[1];
  if (c1) {
    parts.push(`${c1.name} is close behind, up ${c1.delta} places and now a genuine priority pick.`);
  }

  const f0 = r.fallers[0];
  if (f0) {
    parts.push(
      `On the other end, ${f0.name} took the hardest hit, dropping ${Math.abs(f0.delta)} spots to rank ${f0.rank} (${f0.winRate.toFixed(1)}% win rate) — worth benching until it recovers.`
    );
  }
  const f1 = r.fallers[1];
  if (f1) {
    parts.push(`${f1.name} also slipped ${Math.abs(f1.delta)} places out of favor.`);
  }

  parts.push(
    `In total, ${r.climbers.length} champions gained meaningful ground while ${r.fallers.length} lost it this patch. If you are climbing ranked, prioritize the risers below, respect the new counters they create, and avoid first-picking the fallers into unfavorable drafts. Every ranking here is computed from real ranked results and refreshes automatically each patch, so this report always reflects the current ${gamePatch} meta rather than theorycraft.`
  );
  return parts.join(" ");
}

export interface MetaFaqItem {
  question: string;
  answer: string;
}

export function metaFaq(r: MetaReport, gamePatch: string): MetaFaqItem[] {
  const names = (movers: MetaMover[]): string =>
    movers.slice(0, 3).map((m) => m.name).join(", ") || "several champions";
  return [
    {
      question: `Who are the biggest winners in patch ${gamePatch}?`,
      answer: `${names(r.climbers)} climbed the most in overall rank this patch, based on real ranked win rate and pick rate.`,
    },
    {
      question: `Which champions got worse in patch ${gamePatch}?`,
      answer: `${names(r.fallers)} fell the most in the rankings this patch and are weaker picks right now.`,
    },
    {
      question: `How often is the patch meta report updated?`,
      answer: `It refreshes automatically from live ranked data every patch, so it always reflects the current ${gamePatch} meta.`,
    },
  ];
}
