import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { submitAction } from "@/domains/draft/server";
import { handleMutation, mutationBody } from "../../_shared";

// null is a passed ban. The engine rejects it on a pick step, so the route does
// not need to know which kind of step is up.
const body = mutationBody.extend({
  championKey: z.string().trim().min(1).max(40).nullable(),
});

interface RouteParams {
  params: { code: string };
}

export async function POST(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  return handleMutation(req, body, (input) =>
    submitAction(params.code, input.gameNumber, input.token, input.championKey)
  );
}
