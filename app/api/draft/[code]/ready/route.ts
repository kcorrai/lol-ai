import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { setReady } from "@/domains/draft/server";
import { handleMutation, mutationBody } from "../../_shared";

const body = mutationBody.extend({ ready: z.boolean() });

interface RouteParams {
  params: { code: string };
}

export async function POST(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  return handleMutation(req, body, (input) =>
    setReady(params.code, input.gameNumber, input.token, input.ready)
  );
}
