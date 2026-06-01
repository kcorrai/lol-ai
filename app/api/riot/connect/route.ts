import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { connectAccount } from "@/domains/riot/services/accountService";
import { VALID_REGIONS } from "@/domains/riot/services/riotApiClient";

const connectSchema = z.object({
  gameName: z.string().min(1).max(16),
  tagLine: z.string().min(2).max(5),
  region: z.enum(VALID_REGIONS as [string, ...string[]]),
});

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw Errors.validation("Invalid JSON body");
  }

  const parsed = connectSchema.safeParse(body);
  if (!parsed.success) throw Errors.validation(parsed.error.issues[0].message);

  const account = await connectAccount(
    userId,
    parsed.data.gameName,
    parsed.data.tagLine,
    parsed.data.region
  );

  return apiSuccess(account, 201);
});
