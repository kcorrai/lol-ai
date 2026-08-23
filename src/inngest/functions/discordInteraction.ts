import { runBotRequest, type BotRequest } from "@/domains/discord";
import { inngest } from "@/inngest/client";
import { editOriginalResponse } from "@/lib/discord/rest";
import { logger } from "@/lib/utils/logger";

export interface DiscordInteractionPayload {
  request: BotRequest;
  applicationId: string;
  // Valid for 15 minutes from the interaction, which is the real deadline on
  // this function — not the 300s Inngest allows it.
  token: string;
}

/**
 * Does the work behind a deferred Discord interaction.
 *
 * The endpoint has 3 seconds to ACK, which a cold start plus a Riot round-trip
 * does not fit, so it defers and the answer is delivered here by replacing the
 * "thinking…" placeholder.
 *
 * One retry, not the usual two: the user is staring at a spinner, and a second
 * retry would more often deliver a card long after they gave up than rescue one.
 */
export const discordInteractionWorker = inngest.createFunction(
  {
    id: "discord-interaction",
    triggers: [{ event: "discord/interaction.received" }],
    retries: 1,
  },
  async ({ event }) => {
    const { request, applicationId, token } = event.data as DiscordInteractionPayload;

    const payload = await runBotRequest(request);
    await editOriginalResponse(applicationId, token, payload);

    logger.info(
      `[discord] answered /${request.command}${request.subcommand ? ` ${request.subcommand}` : ""}`
    );
    return { command: request.command };
  }
);
