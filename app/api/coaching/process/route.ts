import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runCoachingPipeline } from "@/domains/coaching/pipeline/coachingPipeline";
import type { ReportType } from "@prisma/client";

const processSchema = z.object({
  reportId: z.string().uuid(),
  riotAccountId: z.string().uuid(),
  matchIds: z.array(z.string().uuid()),
  reportType: z.enum(["session_review", "champion_focus", "climb_roadmap"]),
  focusArea: z.string().optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const parsed = processSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { reportId, riotAccountId, matchIds, reportType, focusArea } = parsed.data;

  await runCoachingPipeline(reportId, riotAccountId, matchIds, reportType as ReportType, focusArea);

  return NextResponse.json({ ok: true });
}
