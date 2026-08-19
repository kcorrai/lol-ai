import { PrismaClient, Prisma } from "@prisma/client";
import * as Sentry from "@sentry/nextjs";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Warns once when the resolved database URL is not actually pooled in production.
 *
 * The comment below describes a property of the environment variable's *value*, which no amount of
 * reading the repository can confirm. That was tolerable while every invocation opened one
 * connection at a time. It stopped being tolerable when the sync began ingesting matches
 * concurrently: if DATABASE_POOLER_URL is unset in some environment we fall through to
 * DATABASE_URL, and the concurrency then multiplies direct connections instead of pooled ones —
 * which surfaces as the P2024 the middleware below already watches for.
 *
 * A warning rather than a throw: an unpooled connection still works, and refusing to start over it
 * would take the site down to prevent a slowdown. Same shape as the Redis cache's
 * warn-once-on-misconfiguration.
 */
function warnIfUnpooled(url: string | undefined): void {
  if (process.env.NODE_ENV !== "production" || !url) return;
  if (url.includes("pgbouncer=true") || url.includes("-pooler.")) return;

  // eslint-disable-next-line no-console -- the logging service imports this module; using it here
  // would be a require cycle, and this fires at most once per process at construction.
  console.warn(
    "[db] DATABASE_POOLER_URL is missing or not a pooled connection string. Concurrent work " +
      "(match ingest) will open direct connections and can exhaust the database's limit — watch " +
      "for P2024. Set DATABASE_POOLER_URL to the Neon pooler URL with pgbouncer=true."
  );
}

function createPrismaClient(): PrismaClient {
  // In production on Vercel, prefer the Neon pgbouncer pooler URL.
  // Serverless functions are short-lived; connection_limit=1 prevents pool exhaustion
  // because pgbouncer handles multiplexing at the database layer.
  const url = process.env.DATABASE_POOLER_URL ?? process.env.DATABASE_URL;
  warnIfUnpooled(url);

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
