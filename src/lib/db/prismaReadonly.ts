import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/utils/logger";

const globalForPrismaReadonly = globalThis as unknown as {
  prismaReadonly: PrismaClient | undefined;
};

function createReadonlyClient(): PrismaClient {
  const url = process.env.DATABASE_READONLY_URL ?? process.env.DATABASE_URL;

  const client = new PrismaClient({
    datasources: { db: { url } },
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

  return client;
}

export const prismaReadonly =
  globalForPrismaReadonly.prismaReadonly ?? createReadonlyClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrismaReadonly.prismaReadonly = prismaReadonly;
}
