import { NextRequest } from "next/server";
import { checkRateLimit, getIp } from "@/lib/api/rateLimit";
import { isOverlayKeyFormat } from "@/domains/creator/overlayKey";
import { getOverlayPayload } from "@/domains/creator/services/overlayDataService";
import { renderChatCommand } from "@/domains/creator/services/chatCommandService";
import { isChatCommand } from "@/domains/creator/types";

export const dynamic = "force-dynamic";

// GET /api/overlay/[key]/chat/[command] — no auth, plain text.
//
// Fetched by the streamer's own chat bot through `$(urlfetch …)`, so the whole
// contract is: one line, `text/plain`, and never a JSON envelope — a bot pastes
// the body verbatim, and `{"data":…}` in chat is what a broken command looks
// like. That is also why every failure answers 200 with a readable sentence
// rather than a status code: a 404 body would be pasted into chat as-is.

function line(text: string): Response {
  return new Response(text, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { key: string; command: string } }
): Promise<Response> {
  if (!isOverlayKeyFormat(params.key)) return line("This LaneIQ command is not set up correctly.");
  if (!isChatCommand(params.command)) return line("Unknown LaneIQ command.");

  const rl = await checkRateLimit(`overlay-chat:${params.key}:${getIp(req)}`, {
    limit: 60,
    windowMs: 60_000,
  });
  if (!rl.allowed) return line("LaneIQ is catching its breath — try again in a moment.");

  const result = await getOverlayPayload(params.key);
  if (!result) return line("This LaneIQ command is not set up correctly.");

  return line(renderChatCommand(params.command, result.payload));
}
