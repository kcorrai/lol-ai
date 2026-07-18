import { prisma } from "@/lib/db/prisma";

const POLL_INTERVAL_MS = 2_000;
const MAX_DURATION_MS = 3 * 60 * 1000; // 3 minute hard cap

export const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
} as const;

function sseEvent(event: string, data: Record<string, unknown>): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// Single-shot body for a report that is already terminal.
export function terminalStatusBody(status: string): string {
  return sseEvent("status", { status }) + sseEvent("done", { status });
}

// Server-Sent-Events stream that polls the report status until it is terminal,
// the client disconnects, or the hard duration cap is hit.
export function createReportStatusStream(
  reportId: string,
  signal: AbortSignal
): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const started = Date.now();

      const send = (event: string, data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(sseEvent(event, data)));
      };

      send("connected", { reportId });

      const poll = async () => {
        if (signal.aborted) {
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
}
