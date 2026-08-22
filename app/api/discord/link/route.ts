import { NextRequest } from "next/server";
import { linkDiscordAccount } from "@/domains/discord/linkService";
import { readLinkToken } from "@/domains/discord/linkToken";
import { Errors } from "@/lib/api/errors";
import { apiSuccess } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";

export const dynamic = "force-dynamic";

// POST /api/discord/link — completes the handshake /lolai link started.
//
// The token proves which Discord account asked; the session proves which
// LoL AI Coach account is answering. Neither half alone is enough, which is
// what makes this safe without an OAuth round trip.
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw Errors.validation("Invalid JSON body");
  }

  const token = (body as { token?: unknown } | null)?.token;
  if (typeof token !== "string" || token.length === 0) {
    throw Errors.validation("Missing link token");
  }

  const claims = readLinkToken(token);
  if (!claims) {
    throw Errors.validation("This link has expired or is not valid. Run /lolai link again.");
  }

  const outcome = await linkDiscordAccount(userId, claims.discordUserId, claims.discordUsername);
  if (outcome === "taken") {
    throw Errors.conflict("That Discord account is already linked to a different profile.");
  }

  return apiSuccess({ discordUsername: claims.discordUsername });
});
