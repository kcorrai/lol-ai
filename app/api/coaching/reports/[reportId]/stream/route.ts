import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

const POLL_INTERVAL_MS = 2_000;
const MAX_DURATION_MS = 3 * 60 * 1000; // 3 minute hard cap

function sseEvent(event: string, data: Record<string, unknown>): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { reportId: string } }
): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { reportId } = params;
  const userId = session.user.id;

  // Verify the report belongs to this user before streaming
  const report = await prisma.coachingReport.findFirst({
    where: { id: reportId, riotAccount: { userId } },
    select: { id: true, status: true },
  });

  if (!report) {
    return new Response("Not found", { status: 404 });
  }

  // If already terminal, return immediately with a single event
  if (report.status === "complete" || report.status === "failed") {
    const body = sseEvent("status", { status: report.status }) + sseEvent("done", { status: report.status });
    return new Response(body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const started = Date.now();

      const send = (event: string, data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(sseEvent(event, data)));
      };

      send("connected", { reportId });

      const poll = async () => {
        if (req.signal.aborted) {
          controller.close();
          return;
        }

        if (Date.now() - started > MAX_DURATION_MS) {
          send("timeout", { reportId });
          controller.close();
          return;
        }

        const current = await prisma.coachingReport.findFirst({
          where: { id: reportId },
          select: { status: true },
        });

        const status = current?.status ?? "failed";
        send("status", { status });

        if (status === "complete" || status === "failed") {
          send("done", { status });
          controller.close();
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        await poll();
      };

      poll().catch(() => {
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
