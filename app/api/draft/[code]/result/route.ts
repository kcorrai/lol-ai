import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { setGameResult } from "@/domains/draft/server";
import { handleMutation, mutationBody } from "../../_shared";

const body = mutationBody.extend({ winnerSide: z.enum(["BLUE", "RED"]) });

interface RouteParams {
  params: { code: string };
}

export async function POST(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  return handleMutation(req, body, (input) =>
    setGameResult(params.code, input.gameNumber, input.token, input.winnerSide)
  );
}
