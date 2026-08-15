import { NextRequest, NextResponse } from "next/server";
import { undoAction } from "@/domains/draft/server";
import { handleMutation, mutationBody } from "../../_shared";

interface RouteParams {
  params: { code: string };
}

export async function POST(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  return handleMutation(req, mutationBody, (input) =>
    undoAction(params.code, input.gameNumber, input.token)
  );
}
