import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateListing, setListingActive, deleteListing } from "@/domains/marketplace";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { ListingBody } from "@/domains/marketplace/listingSchema";

export const dynamic = "force-dynamic";

// Either a full edit or just the on-sale switch — the switch is one click in
// the UI and should not have to round-trip a whole listing to work.
const PatchBody = z.union([ListingBody, z.object({ isActive: z.boolean() })]);

// PATCH /api/coaches/me/listings/[listingId]
export function PATCH(
  req: NextRequest,
  { params }: { params: { listingId: string } }
): Promise<NextResponse> {
  return withAuth(async (r, { userId }): Promise<NextResponse> => {
    const parsed = PatchBody.safeParse(await r.json().catch(() => null));
    if (!parsed.success) {
      throw Errors.validation(parsed.error.issues[0]?.message ?? "Invalid listing.");
    }

    if ("isActive" in parsed.data) {
      const moved = await setListingActive(userId, params.listingId, parsed.data.isActive);
      if (!moved) throw Errors.notFound("Listing");
      return apiSuccess({ isActive: parsed.data.isActive });
    }

    const result = await updateListing(userId, params.listingId, parsed.data);
    if (!result.ok) {
      if (result.reason === "not-found") throw Errors.notFound("Listing");
      if (result.reason === "no-profile") throw Errors.notFound("Coach profile");
      throw Errors.validation(result.detail ?? "That listing is not valid.");
    }

    return apiSuccess({ listing: result.listing });
  })(req);
}

// DELETE /api/coaches/me/listings/[listingId]
export function DELETE(
  req: NextRequest,
  { params }: { params: { listingId: string } }
): Promise<NextResponse> {
  return withAuth(async (_r, { userId }): Promise<NextResponse> => {
    const result = await deleteListing(userId, params.listingId);

    if (!result.ok) {
      if (result.reason === "not-found") throw Errors.notFound("Listing");
      if (result.reason === "no-profile") throw Errors.notFound("Coach profile");
      // Booked at least once: the row is what tells a dispute what was sold.
      throw Errors.conflict(result.detail ?? "This listing cannot be deleted.");
    }

    return apiSuccess({ deleted: true });
  })(req);
}
