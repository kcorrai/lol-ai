import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { updateProfileSettings, getProfileSettings } from "@/domains/identity/services/profileService";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/user/profile-settings
export const GET = withAuth(async (_req, { userId }) => {
  const settings = await getProfileSettings(userId);
  return apiSuccess(settings);
});

// PATCH /api/user/profile-settings
export const PATCH = withAuth(async (req: NextRequest, { userId }) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw Errors.validation("Invalid JSON body");
  }

  if (typeof body !== "object" || body === null) throw Errors.validation("Invalid body");
  const data = body as Record<string, unknown>;

  const allowed = ["profilePublic", "showRank", "showWR", "showBadges", "showChampions"] as const;
  const update: Record<string, boolean> = {};
  for (const key of allowed) {
    if (key in data) {
      if (typeof data[key] !== "boolean") throw Errors.validation(`${key} must be boolean`);
      update[key] = data[key] as boolean;
    }
  }

  const { profilePublic, ...rest } = update as { profilePublic?: boolean } & Record<string, boolean>;
  await updateProfileSettings(userId, { profilePublic, ...rest });

  return apiSuccess({ ok: true });
});
