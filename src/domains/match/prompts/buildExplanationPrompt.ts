interface ParticipantContext {
  championName: string;
  itemIds: number[];
  kills: number;
  deaths: number;
  assists: number;
  won: boolean;
  gameDurationMinutes: number;
}

export function buildBuildExplanationSystemPrompt(): string {
  return `You are a League of Legends build analysis coach. I will provide you with real match data. Analyze the items the player bought and respond like an experienced coach, not like an AI.

Always respond in valid JSON format. Return only the pure JSON object, do not use markdown code blocks.`;
}

export function buildBuildExplanationUserPrompt(
  participant: ParticipantContext,
  enemyChampions: string[],
  itemNames: Record<number, string>
): string {
  const kda = `${participant.kills}/${participant.deaths}/${participant.assists}`;
  const outcome = participant.won ? "Won" : "Lost";
  const nonZeroItems = participant.itemIds
    .filter((id) => id > 0)
    .map((id, i) => `${i + 1}. ${itemNames[id] ?? `Unknown Item (ID: ${id})`}`);

  const itemCount = nonZeroItems.length;

  return `Analyze this match:

Player: ${participant.championName}
KDA: ${kda} — ${outcome}
Game Duration: ${participant.gameDurationMinutes} minutes
Enemy Team: ${enemyChampions.join(", ")}

The player's inventory has EXACTLY ${itemCount} items (order matters):
${nonZeroItems.join("\n")}

RULES:
- The "items" array must have EXACTLY ${itemCount} elements — no more, no less.
- Each element must match the order above precisely (1st item → items[0], 2nd item → items[1], …).
- In the "itemName" field, use the exact name from the list above, do not change it.
- All items above are from Riot Games' official DDragon database and EXIST in the current season. Do NOT use phrases like "doesn't exist in-game", "removed", or "old season" — this information would be wrong.
- If you don't recognize an item name, it may be due to your knowledge cutoff date; still provide a reasonable analysis based on the item's role in the meta.

Respond in this JSON format:
{
  "summary": "General build analysis — 2-3 sentences",
  "items": [
    {
      "itemName": "The exact name from the list above",
      "wasGoodChoice": true,
      "reasoning": "Why it was a good or bad choice",
      "betterAlternative": "A better alternative item name (or null)",
      "whenToChoose": "When this item should be purchased"
    }
  ],
  "buildPath": "What would have been the ideal build order for this game — brief summary",
  "biggestMistake": "The biggest mistake in this build (or null)"
}

Return only JSON.`;
}
