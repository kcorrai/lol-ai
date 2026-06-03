import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { submitRating } from "@/domains/coaching/services/reportService";

const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(500).optional(),
});

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const reportId = req.nextUrl.pathname.split("/").at(-2) ?? "";
  if (!reportId) throw Errors.validation("Missing reportId");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw Errors.validation("Invalid JSON body");
  }

  const parsed = ratingSchema.safeParse(body);
  if (!parsed.success) throw Errors.validation(parsed.error.issues[0].message);

  await submitRating(reportId, userId, parsed.data.rating, parsed.data.feedback);
  return apiSuccess({ rated: true });
});
