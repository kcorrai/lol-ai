import type { BotRequest } from "@/domains/discord/request";
import { errorCard } from "@/domains/discord/views/shell";
import { inngest } from "@/inngest/client";
import type { DiscordMessagePayload } from "@/lib/discord/componentTypes";
import {
  InteractionResponseType,
  InteractionType,
  type CommandInteraction,
  type ComponentInteraction,
} from "@/lib/discord/interactionTypes";
import { logger } from "@/lib/utils/logger";

export interface InteractionResponse {
  type: number;
  data?: DiscordMessagePayload;
}

/**
 * Acknowledges an interaction and hands the actual work to Inngest.
 *
 * A button press updates the message it is attached to; a slash command posts a
 * new one. Either way the ACK has to be out inside 3 seconds, so nothing here
 * touches Riot or the database.
 *
 * If the event cannot be queued the answer is delivered immediately instead —
 * a deferred ACK that is never followed up leaves Discord showing "thinking…"
 * for fifteen minutes, which is a worse failure than saying so.
 */
export async function deferToWorker(
  interaction: CommandInteraction | ComponentInteraction,
  request: BotRequest
): Promise<InteractionResponse> {
  try {
    await inngest.send({
      name: "discord/interaction.received",
      data: {
        request,
        applicationId: interaction.application_id,
        token: interaction.token,
      },
    });
  } catch (error) {
    logger.error("[discord] could not queue the interaction", error);
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: errorCard(
        "Temporarily unavailable",
        "The bot could not reach its job queue, so it cannot answer right now. Try again in a minute."
      ),
    };
  }

  return {
    type:
      interaction.type === InteractionType.MessageComponent
        ? InteractionResponseType.DeferredUpdateMessage
        : InteractionResponseType.DeferredChannelMessageWithSource,
  };
}
