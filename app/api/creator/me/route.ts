import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/withAuth";
import { Errors } from "@/lib/api/errors";
import { apiSuccess } from "@/lib/api/response";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";
import { enableKit, getKit, saveSettings } from "@/domains/creator/services/creatorProfileService";
import { MAX_DELAY_SECONDS } from "@/domains/creator/session";

export const dynamic = "force-dynamic";

const RANK_TIERS = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
  "CHALLENGER",
] as const;

const SettingsBody = z.object({
  enabled: z.boolean(),
  riotAccountId: z.string().uuid().nullable().default(null),
  displayName: z.string().trim().min(1).max(32).nullable().default(null),
  streamSafe: z.boolean(),
  delaySeconds: z.number().int().min(0).max(MAX_DELAY_SECONDS),
  theme: z.enum(["dark", "light", "transparent"]),
  // Hex only. The value is interpolated into a style attribute on the overlay,
  // so anything looser would be a CSS injection into a page the streamer's
  // viewers are watching.
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Accent colour must be a hex value."),
  goalTier: z.enum(RANK_TIERS).nullable().default(null),
  goalDivision: z.enum(["I", "II", "III", "IV"]).nullable().default(null),
  twitchHandle: z.string().trim().max(64).nullable().default(null),
  kickHandle: z.string().trim().max(64).nullable().default(null),
  youtubeHandle: z.string().trim().max(64).nullable().default(null),
});

export const GET = withAuth(async (_req: NextRequest, { userId }): Promise<NextResponse> => {
  const kit = await getKit(userId);
  return apiSuccess({ kit });
});

// Enabling is idempotent, so this is safe to retry — a second call returns the
// existing key rather than breaking the OBS source the first one produced.
export const POST = withAuth(async (_req: NextRequest, { userId }): Promise<NextResponse> => {
  const rl = await checkRateLimit(`creator-enable:${userId}`, { limit: 10, windowMs: 3_600_000 });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const kit = await enableKit(userId);
  return apiSuccess({ kit }, 201);
});

export const PUT = withAuth(async (req: NextRequest, { userId }): Promise<NextResponse> => {
  const rl = await checkRateLimit(`creator-save:${userId}`, { limit: 60, windowMs: 3_600_000 });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const parsed = SettingsBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    throw Errors.validation(parsed.error.issues[0]?.message ?? "Invalid settings.");

  const result = await saveSettings(userId, parsed.data);
  if (!result.ok) throw Errors.validation(result.reason);

  return apiSuccess({ kit: result.kit });
});
