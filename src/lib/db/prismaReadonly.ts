import { PrismaClient, Prisma } from "@prisma/client";
import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/utils/logger";
import { prisma } from "@/lib/db/prisma";

const globalForPrismaReadonly = globalThis as unknown as {
  prismaReadonly: PrismaClient | undefined;
};

/** What `prisma.ts` resolves for the primary. Kept in step with it deliberately — see below. */
function primaryUrl(): string | undefined {
  return process.env.DATABASE_POOLER_URL ?? process.env.DATABASE_URL;
}

/**
 * Whether a separate read client is warranted, and what it should connect to.
 *
 * Separated from the construction so the decision can be tested without building a PrismaClient:
 * this is the part with a rule in it, and it is the part that was wrong.
 *
 * `reusePrimary` means no replica is configured and a second client would be a second connection
 * pool against the database the primary is already pooling. On serverless that doubles the
 * connections each invocation holds — the exact P2024 exhaustion `prisma.ts` warns about — and
 * buys nothing, because both clients would be talking to the same server.
 */
export function resolveReadonlyDatasource(): { url: string | undefined; reusePrimary: boolean } {
  // Read replica uses its own pooler URL when available.
  const url =
    process.env.DATABASE_READONLY_POOLER_URL ?? process.env.DATABASE_READONLY_URL ?? primaryUrl();

  return { url, reusePrimary: url === primaryUrl() };
}

function createReadonlyClient(): PrismaClient {
  const { url, reusePrimary } = resolveReadonlyDatasource();

  // The cost of reusing is the slow-query warning below, which only exists on this client. That is
  // worth giving up in the configuration where it watches the same database the primary already
  // serves; where a real replica is configured the URLs differ and it comes back.
  if (reusePrimary) return prisma;

  // Only override datasources when a url is configured — passing an undefined
  // url makes PrismaClient throw at construction (breaks test collection).
  const client = new PrismaClient({
    ...(url ? { datasources: { db: { url } } } : {}),
    log: [
      { emit: "event", level: "query" },
      { emit: "stdout", level: "error" },
    ],
  });

  // Log queries slower than 500ms to catch analytics N+1 and missing indexes
  client.$on("query", (e) => {
    if (e.duration > 500) {
      logger.warn("slow-query-readonly", {
        duration: e.duration,
        query: e.query.slice(0, 200),
      });
    }
  });

  client.$use(async (params, next) => {
    try {
      return await next(params);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        (err.code === "P2024" || err.code === "P1001")
      ) {
        Sentry.captureException(err, {
          tags: { prisma_error_code: err.code, layer: "db_pool_readonly" },
        });
      }
      throw err;
    }
  });

  return client;
}

export const prismaReadonly = globalForPrismaReadonly.prismaReadonly ?? createReadonlyClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrismaReadonly.prismaReadonly = prismaReadonly;
}
