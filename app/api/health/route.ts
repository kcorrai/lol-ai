import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

interface ServiceStatus {
  ok: boolean;
  latencyMs?: number;
}

/**
 * The reason a check failed goes to the log, never to the caller.
 *
 * This endpoint is unauthenticated — an uptime probe has to reach it — and the
 * failures it reports are database and Redis client errors. Those carry hosts,
 * ports, database names and sometimes the connection string itself, so returning
 * the message handed an anonymous visitor a map of the infrastructure precisely
 * when the infrastructure was in trouble. A monitor only needs ok/degraded.
 */
function failed(service: string, err: unknown): ServiceStatus {
  logger.error(`[health] ${service} check failed`, err);
  return { ok: false };
}

async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    return failed("database", err);
  }
}

async function checkRedis(): Promise<ServiceStatus> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return { ok: true, latencyMs: 0 }; // not configured — not a failure
  }

  const start = Date.now();
  try {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
    await redis.ping();
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    return failed("redis", err);
  }
}

export async function GET(): Promise<NextResponse> {
  const [db, redis] = await Promise.all([checkDatabase(), checkRedis()]);

  const allOk = db.ok && redis.ok;
  const status = allOk ? 200 : 503;

  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      services: {
        database: db,
        redis: redis,
      },
    },
    { status }
  );
}
