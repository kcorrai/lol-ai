import { PrismaClient, Prisma } from "@prisma/client";
import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/utils/logger";

const globalForPrismaReadonly = globalThis as unknown as {
  prismaReadonly: PrismaClient | undefined;
};

function createReadonlyClient(): PrismaClient {
  // Read replica uses its own pooler URL when available.
  const url =
    process.env.DATABASE_READONLY_POOLER_URL ??
    process.env.DATABASE_READONLY_URL ??
    process.env.DATABASE_POOLER_URL ??
    process.env.DATABASE_URL;

  // Only override datasources when a url is configured — passing an undefined
  // url makes PrismaClient throw at construction (breaks test collection).
  const client = new PrismaClient({
    ...(url ? { datasources: { db: { url } } } : {}),
    log:
      process.env.NODE_ENV === "development"
        ? [
            { emit: "event", level: "query" },
            { emit: "stdout", level: "error" },
          ]
        : [{ emit: "event", level: "query" }, { emit: "stdout", level: "error" }],
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

export const prismaReadonly =
  globalForPrismaReadonly.prismaReadonly ?? createReadonlyClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrismaReadonly.prismaReadonly = prismaReadonly;
}
