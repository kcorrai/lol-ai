import { NextRequest, NextResponse } from "next/server";
import {
  handleAutocomplete,
  parseCommandInteraction,
  parseComponentInteraction,
  type BotRequest,
} from "@/domains/discord";
import { inngest } from "@/inngest/client";
import {
  InteractionResponseType,
  InteractionType,
  type DiscordInteraction,
} from "@/lib/discord/interactionTypes";
import { verifyDiscordSignature } from "@/lib/discord/verify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Discord's Interactions endpoint. It has 3 seconds to answer, so it verifies,
// hands the work to Inngest and ACKs with a deferred response — the worker
// replaces the placeholder once the answer exists.
export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.text();

  const verified = verifyDiscordSignature({
    rawBody,
    signature: req.headers.get("x-signature-ed25519"),
    timestamp: req.headers.get("x-signature-timestamp"),
    publicKeyHex: process.env.DISCORD_PUBLIC_KEY,
  });
  // 401 is required, not merely tidy: Discord probes a new endpoint URL with a
  // deliberately invalid signature and refuses to save it unless it is rejected.
  if (!verified) return new NextResponse("invalid request signature", { status: 401 });

  let interaction: DiscordInteraction;
  try {
    interaction = JSON.parse(rawBody) as DiscordInteraction;
  } catch {
    return new NextResponse("malformed payload", { status: 400 });
  }

  let request: BotRequest | null = null;
  switch (interaction.type) {
    case InteractionType.Ping:
      return NextResponse.json({ type: InteractionResponseType.Pong });
    case InteractionType.Autocomplete:
      // Inline: autocomplete has no deferred response type, so it reads the
      // player index and never touches the Riot API.
      return NextResponse.json({
        type: InteractionResponseType.AutocompleteResult,
        data: { choices: await handleAutocomplete(interaction) },
      });
    case InteractionType.ApplicationCommand:
      request = parseCommandInteraction(interaction);
      break;
    case InteractionType.MessageComponent:
      request = parseComponentInteraction(interaction);
      break;
    default:
      break;
  }

  // Nothing actionable — a modal submit, or a button whose custom_id predates
  // the current encoding. Acknowledging without a message beats a visible error.
  if (!request) {
    return NextResponse.json({ type: InteractionResponseType.DeferredUpdateMessage });
  }

  await inngest.send({
    name: "discord/interaction.received",
    data: { request, applicationId: interaction.application_id, token: interaction.token },
  });

  return NextResponse.json({
    type:
      interaction.type === InteractionType.MessageComponent
        ? InteractionResponseType.DeferredUpdateMessage
        : InteractionResponseType.DeferredChannelMessageWithSource,
  });
}
