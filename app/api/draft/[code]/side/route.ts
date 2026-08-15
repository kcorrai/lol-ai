import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { setBlueTeam } from "@/domains/draft/server";
import { handleMutation, mutationBody } from "../../_shared";

// Which team sits on blue for this game. Blue always acts first in the sequence,
// so this is how "first selection" is expressed (docs/DRAFT_ROOM.md §3).
const body = mutationBody.extend({ blueTeam: z.union([z.literal(1), z.literal(2)]) });

interface RouteParams {
  params: { code: string };
}

export async function POST(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  return handleMutation(req, body, (input) =>
    setBlueTeam(params.code, input.gameNumber, input.token, input.blueTeam)
  );
}
