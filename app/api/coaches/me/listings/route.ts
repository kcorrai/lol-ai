import { NextRequest, NextResponse } from "next/server";
import { createListing, listOwnListings } from "@/domains/marketplace";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { ListingBody } from "@/domains/marketplace/listingSchema";

export const dynamic = "force-dynamic";

// GET /api/coaches/me/listings — everything the coach sells, active or not.
export const GET = withAuth(async (_req: NextRequest, { userId }): Promise<NextResponse> => {
  return apiSuccess({ listings: await listOwnListings(userId) });
});

// POST /api/coaches/me/listings — add one.
export const POST = withAuth(async (req: NextRequest, { userId }): Promise<NextResponse> => {
  const parsed = ListingBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    throw Errors.validation(parsed.error.issues[0]?.message ?? "Invalid listing.");
  }

  const result = await createListing(userId, parsed.data);

  if (!result.ok) {
    if (result.reason === "no-profile") throw Errors.notFound("Coach profile");
    throw Errors.validation(result.detail ?? "That listing is not valid.");
  }

  return apiSuccess({ listing: result.listing }, 201);
});
