import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPairingRequest } from "@/domains/desktop/services/desktopPairingRequestService";
import { Errors } from "@/lib/api/errors";
import { apiSuccess } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";

export const dynamic = "force-dynamic";

// GET /api/desktop/pairing-request/[requestId] — what the approval page draws.
//
// Behind the session like any other settings read. It answers with what the machine
// said about itself and when it asked, and grants nothing: approving is a separate
// POST, because a link that pairs a machine by being visited is a link that can be
// sent to somebody.
export function GET(
  req: NextRequest,
  { params }: { params: { requestId: string } }
): Promise<NextResponse> {
  return withAuth(async (): Promise<NextResponse> => {
    // The column is `uuid`, so a malformed id reaches Postgres as an error and the
    // caller would see a 500 where they should see a 404.
    if (!z.string().uuid().safeParse(params.requestId).success) {
      throw Errors.notFound("Pairing request");
    }

    const request = await getPairingRequest(params.requestId);
    if (!request) throw Errors.notFound("Pairing request");

    return apiSuccess(request);
  })(req);
}
