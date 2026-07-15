import type { RoleTierList, TierListEntry } from "@/domains/meta";

// A ~100-word, data-driven paragraph for a role tier list page. Every number is
// pulled from the live snapshot so the text is unique per lane and per patch.
export function tierBlurb(laneLabel: string, list: RoleTierList, patch: string): string {
  const entries = list.entries;
  const top = entries[0];
  if (!top) return "";

  const sTier = entries.filter((e) => e.tier === 1);
  const sNames = sTier.slice(0, 3).map((e) => e.name);
  const biggestClimber = biggestMover(entries, "up");
  const biggestFaller = biggestMover(entries, "down");

  const parts: string[] = [
    `This is the League of Legends ${laneLabel} tier list for patch ${patch}, ranked by real ranked win rate across ${entries.length.toLocaleString()} tracked ${laneLabel} champions.`,
    `${top.name} leads the lane with a ${top.winRate.toFixed(1)}% win rate at a ${top.pickRate.toFixed(1)}% pick rate.`,
  ];
  if (sNames.length > 0) {
    parts.push(
      `The strongest picks (S-tier) this patch are ${listWords(sNames)}, the safest blind picks if you want to climb.`
    );
  }
  if (biggestClimber) {
    parts.push(
      `${biggestClimber.name} is the biggest riser, climbing ${rankDelta(biggestClimber)} spots since last patch.`
    );
  }
  if (biggestFaller) {
    parts.push(`${biggestFaller.name} has fallen ${rankDelta(biggestFaller)} spots and is worth benching.`);
  }
  parts.push("Rankings update automatically every patch.");
  return parts.join(" ");
}

function rankDelta(e: TierListEntry): number {
  return Math.abs(e.prevPatchRank - e.rank);
}

// Finds the entry with the largest rank change in the given direction.
function biggestMover(entries: TierListEntry[], dir: "up" | "down"): TierListEntry | null {
  let best: TierListEntry | null = null;
  let bestDelta = 0;
  for (const e of entries) {
    if (!e.rank || !e.prevPatchRank) continue;
    const delta = e.prevPatchRank - e.rank; // positive = climbed
    const signed = dir === "up" ? delta : -delta;
    if (signed > bestDelta) {
      bestDelta = signed;
      best = e;
    }
  }
  return bestDelta >= 3 ? best : null; // ignore noise
}

function listWords(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
