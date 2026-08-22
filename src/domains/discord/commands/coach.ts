import { getLinkedIdentity } from "@/domains/discord/linkService";
import type { BotRequest } from "@/domains/discord/request";
import { coachCard, coachUpsellCard } from "@/domains/discord/views/coachCard";
import { errorCard } from "@/domains/discord/views/shell";
import { getActiveHabits, getPlayerPerformanceProfile } from "@/domains/analysis";
import { checkIsPro } from "@/lib/auth/authorization";
import type { DiscordMessagePayload } from "@/lib/discord/componentTypes";

// How many recent games the profile is built from. Matches what the site's own
// improvement view asks for, so the bot and the website never disagree.
const GAMES_ANALYZED = 20;

/**
 * The one command that only works for a linked account.
 *
 * Everything else the bot does reads public Riot data; this reads a habit
 * history that belongs to a specific profile, so there is no Riot ID that could
 * stand in for being logged in.
 */
export async function coachCommand(req: BotRequest): Promise<DiscordMessagePayload> {
  const identity = await getLinkedIdentity(req.discordUserId);
  if (!identity) {
    return errorCard(
      "Not linked",
      "`/coach` reads your own history, so it needs `/lolai link` first."
    );
  }
  if (!identity.riotAccount) {
    return errorCard(
      "No Riot account connected",
      "Connect a Riot account in Settings → Accounts and `/coach` will have something to read."
    );
  }

  if (!(await checkIsPro(identity.userId))) return coachUpsellCard();

  const riotAccountId = identity.riotAccount.id;
  const [profile, habits] = await Promise.all([
    getPlayerPerformanceProfile(riotAccountId, GAMES_ANALYZED),
    getActiveHabits(riotAccountId),
  ]);

  if (profile.gamesAnalyzed === 0) {
    return errorCard(
      "Nothing to read yet",
      "No ranked games have been synced for that account. Open the dashboard once to pull your history in."
    );
  }

  return coachCard({
    riotId: `${identity.riotAccount.gameName}#${identity.riotAccount.tagLine}`,
    profile,
    habits,
  });
}
