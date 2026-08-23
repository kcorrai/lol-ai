import { linkCommand, statusCommand, unlinkCommand } from "@/domains/discord/commands/account";
import { coachCommand } from "@/domains/discord/commands/coach";
import { helpCommand } from "@/domains/discord/commands/help";
import {
  championsCommand,
  liveCommand,
  matchCommand,
  profileCommand,
  rankCommand,
} from "@/domains/discord/commands/lookup";
import type { BotRequest } from "@/domains/discord/request";
import { errorCard } from "@/domains/discord/views/shell";
import { checkRateLimit } from "@/lib/api/rateLimit";
import type { DiscordMessagePayload } from "@/lib/discord/componentTypes";
import { logger } from "@/lib/utils/logger";

type CommandHandler = (req: BotRequest) => Promise<DiscordMessagePayload>;

// Most commands cost a Riot call, and a Discord server can hold thousands of
// people sharing one Riot API key. This is a backstop on that shared budget,
// keyed per Discord user rather than per guild so one busy server cannot lock
// everyone else out.
const BOT_LIMIT = { limit: 20, windowMs: 60_000 };

const HANDLERS: Record<string, CommandHandler> = {
  rank: rankCommand,
  profile: profileCommand,
  champions: championsCommand,
  match: matchCommand,
  live: liveCommand,
  coach: coachCommand,
  lolai: async (req) => {
    switch (req.subcommand) {
      case "link":
        return linkCommand(req);
      case "status":
        return statusCommand(req);
      case "unlink":
        return unlinkCommand(req);
      default:
        return helpCommand();
    }
  },
};

export async function runBotRequest(req: BotRequest): Promise<DiscordMessagePayload> {
  const rate = await checkRateLimit(`discord-bot:${req.discordUserId}`, BOT_LIMIT);
  if (!rate.allowed) {
    const seconds = Math.ceil(rate.retryAfterMs / 1000);
    return errorCard(
      "Slow down",
      `You have used all ${rate.limit} lookups for this minute. Try again in ${seconds}s.`
    );
  }

  const handler = HANDLERS[req.command];
  if (!handler) {
    return errorCard("Unknown command", `\`/${req.command}\` is not a command this bot knows.`);
  }

  try {
    return await handler(req);
  } catch (error) {
    // The worker has already ACKed, so there is no status code to return — the
    // only way the user hears about this is the card, and the only way we do is
    // the log.
    logger.error(`[discord] /${req.command} failed`, error);
    return errorCard(
      "Something went wrong",
      "That lookup failed. It is usually the Riot API being slow — try again in a moment."
    );
  }
}
