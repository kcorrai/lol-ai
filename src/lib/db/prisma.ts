import { PrismaClient, Prisma } from "@prisma/client";
import * as Sentry from "@sentry/nextjs";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  // In production on Vercel, prefer the Neon pgbouncer pooler URL.
  // Serverless functions are short-lived; connection_limit=1 prevents pool exhaustion
  // because pgbouncer handles multiplexing at the database layer.
  const url = process.env.DATABASE_POOLER_URL ?? process.env.DATABASE_URL;

  // Only override datasources when a url is actually configured. Passing
  // `{ db: { url: undefined } }` makes PrismaClient throw at construction, which
  // crashes any test that imports a db-touching module at collection time.
  return new PrismaClient({
    ...(url ? { datasources: { db: { url } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Monitor connection pool exhaustion in Sentry so we can detect when
// Neon pooler limits are hit across concurrent function invocations.
prisma.$use(async (params, next) => {
  try {
    return await next(params);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      (err.code === "P2024" || err.code === "P1001")
    ) {
      Sentry.captureException(err, {
        tags: { prisma_error_code: err.code, layer: "db_pool" },
      });
    }
    throw err;
  }
});
