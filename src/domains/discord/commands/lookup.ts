import type { BotRequest } from "@/domains/discord/request";
import {
  resolveTarget,
  type RiotTarget,
  type TargetReason,
} from "@/domains/discord/resolveTarget";
import { championsCard } from "@/domains/discord/views/championsCard";
import { liveCard } from "@/domains/discord/views/liveCard";
import { matchCard } from "@/domains/discord/views/matchCard";
import { profileCard } from "@/domains/discord/views/profileCard";
import { rankCard } from "@/domains/discord/views/rankCard";
import { card, errorCard } from "@/domains/discord/views/shell";
import { textDisplay } from "@/lib/discord/components";
import { buildAccountPreview, getLastMatchSummary, getLiveDraftForRiotId } from "@/domains/riot";
import { RIOT_REGION_CONFIG } from "@/domains/riot/config/regions";
import { ApiError } from "@/lib/api/errors";
import type { DiscordMessagePayload } from "@/lib/discord/componentTypes";
import type { PreviewResponse } from "@/types/preview";

type CardRenderer = (
  preview: PreviewResponse,
  req: BotRequest,
  profilePath: string
) => DiscordMessagePayload;

// There is no per-Riot-ID page on the site yet, so the button lands on the
// analyse form. Deep-linking it is a follow-up, not a reason to omit the link.
const ANALYSE_PATH = "/";

function regionName(region: string): string {
  return RIOT_REGION_CONFIG[region as keyof typeof RIOT_REGION_CONFIG]?.label ?? region.toUpperCase();
}

function targetErrorCard(reason: TargetReason): DiscordMessagePayload {
  if (reason === "missing") {
    return errorCard(
      "Which account?",
      "Pass a Riot ID — `riot-id: Faker#KR1`. Run `/lolai link` once and you can leave it out."
    );
  }
  if (reason === "no-riot-account") {
    return errorCard(
      "No Riot account connected",
      "Your Discord is linked, but that account has no Riot account on it yet. Connect one in Settings → Accounts, or pass `riot-id:` here."
    );
  }
  if (reason === "malformed") {
    return errorCard("That is not a Riot ID", "It needs the tag too — `Faker#KR1`, not `Faker`.");
  }
  return errorCard(
    "Unknown region",
    `Pick one from the list: ${Object.keys(RIOT_REGION_CONFIG).join(", ")}.`
  );
}

function lookupErrorCard(error: unknown, target: RiotTarget): DiscordMessagePayload {
  const status = error instanceof ApiError ? error.statusCode : 0;
  const name = `${target.gameName}#${target.tagLine}`;

  if (status === 404) {
    const hint = target.regionInferred
      ? ` I looked on ${regionName(target.region)} — add \`region:\` if they play elsewhere.`
      : "";
    return errorCard("No such account", `Riot has no **${name}** on that region.${hint}`);
  }
  if (status === 429) {
    return errorCard("Riot is throttling us", "Too many lookups at once. Try again in a minute.");
  }
  throw error;
}

/** The three preview-backed commands differ only in how they draw the result. */
function previewCommand(render: CardRenderer) {
  return async (req: BotRequest): Promise<DiscordMessagePayload> => {
    const resolved = await resolveTarget(req);
    if (!resolved.ok) return targetErrorCard(resolved.reason);

    const { target } = resolved;
    try {
      const preview = await buildAccountPreview(target.gameName, target.tagLine, target.region);
      return render(preview, { ...req, region: target.region }, ANALYSE_PATH);
    } catch (error) {
      return lookupErrorCard(error, target);
    }
  };
}

export const rankCommand = previewCommand(rankCard);
export const profileCommand = previewCommand(profileCard);
export const championsCommand = previewCommand(championsCard);

export async function matchCommand(req: BotRequest): Promise<DiscordMessagePayload> {
  const resolved = await resolveTarget(req);
  if (!resolved.ok) return targetErrorCard(resolved.reason);

  const { target } = resolved;
  try {
    const match = await getLastMatchSummary(target.gameName, target.tagLine, target.region);
    if (!match) {
      return errorCard(
        "No games to show",
        `Riot has no match history for **${target.gameName}#${target.tagLine}**.`
      );
    }
    return matchCard(match, { ...req, region: target.region }, ANALYSE_PATH);
  } catch (error) {
    return lookupErrorCard(error, target);
  }
}

export async function liveCommand(req: BotRequest): Promise<DiscordMessagePayload> {
  const resolved = await resolveTarget(req);
  if (!resolved.ok) return targetErrorCard(resolved.reason);

  const { target } = resolved;
  const riotId = `${target.gameName}#${target.tagLine}`;
  try {
    const live = await getLiveDraftForRiotId(target.gameName, target.tagLine, target.region);
    if (!live.inGame) {
      // Not an error — "they are not playing" is a perfectly good answer, and
      // an ephemeral red box would be the wrong shape for it.
      return card([
        textDisplay(`### 💤 Not in game\n**${riotId}** is not in a game right now.`),
      ]);
    }
    return liveCard(live, riotId, { ...req, region: target.region }, ANALYSE_PATH);
  } catch (error) {
    return lookupErrorCard(error, target);
  }
}
