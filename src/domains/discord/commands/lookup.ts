import type { BotRequest } from "@/domains/discord/request";
import { resolveTarget, type RiotTarget } from "@/domains/discord/resolveTarget";
import { championsCard } from "@/domains/discord/views/championsCard";
import { profileCard } from "@/domains/discord/views/profileCard";
import { rankCard } from "@/domains/discord/views/rankCard";
import { errorCard } from "@/domains/discord/views/shell";
import { buildAccountPreview } from "@/domains/riot";
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

function targetErrorCard(reason: "missing" | "malformed" | "bad-region"): DiscordMessagePayload {
  if (reason === "missing") {
    return errorCard(
      "Which account?",
      "Pass a Riot ID — `riot-id: Faker#KR1`. Run `/lolai link` once and you can leave it out."
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
