import { NextRequest, NextResponse } from "next/server";
import {
  deferToWorker,
  handleAutocomplete,
  parseCommandInteraction,
  parseComponentInteraction,
} from "@/domains/discord";
import {
  InteractionResponseType,
  InteractionType,
  type DiscordInteraction,
} from "@/lib/discord/interactionTypes";
import { verifyDiscordSignature } from "@/lib/discord/verify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Discord's Interactions endpoint. It has 3 seconds to answer, so it verifies,
// normalises and hands off — every answer is built by the Inngest worker.
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
    case InteractionType.MessageComponent: {
      const request =
        interaction.type === InteractionType.ApplicationCommand
          ? parseCommandInteraction(interaction)
          : parseComponentInteraction(interaction);

      // Nothing actionable — a button whose custom_id predates the current
      // encoding, or an interaction with no user on it. Acknowledging without a
      // message beats showing an error nobody can act on.
      if (!request) {
        return NextResponse.json({ type: InteractionResponseType.DeferredUpdateMessage });
      }
      return NextResponse.json(await deferToWorker(interaction, request));
    }

    default:
      return NextResponse.json({ type: InteractionResponseType.DeferredUpdateMessage });
  }
}
