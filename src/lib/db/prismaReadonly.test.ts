import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The module builds a PrismaClient at import time, so the cases that assert on the exported client
// need a fresh module registry with the environment already set — same shape as prisma.test.ts.
// The cases that only assert on the decision use the resolver directly and construct nothing.
const ORIGINAL = { ...process.env };

function withEnv(env: Record<string, string | undefined>): void {
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

async function importWith(env: Record<string, string | undefined>): Promise<{
  readonlyClient: unknown;
  primaryClient: unknown;
}> {
  vi.resetModules();
  withEnv(env);
  vi.spyOn(console, "warn").mockImplementation(() => {});

  const { prismaReadonly } = await import("@/lib/db/prismaReadonly");
  const { prisma } = await import("@/lib/db/prisma");
  return { readonlyClient: prismaReadonly, primaryClient: prisma };
}

beforeEach(() => vi.resetModules());
afterEach(() => {
  process.env = { ...ORIGINAL };
  vi.restoreAllMocks();
});

describe("resolveReadonlyDatasource", () => {
  /**
   * With no replica configured this module used to construct a second PrismaClient against the
   * same URL the primary already pools. On serverless that doubles the connections an invocation
   * holds — the P2024 exhaustion prisma.ts warns about — and buys nothing, because both clients
   * talk to the same server.
   */
  it("reuses the primary when no replica is configured", async () => {
    withEnv({
      DATABASE_READONLY_POOLER_URL: undefined,
      DATABASE_READONLY_URL: undefined,
      DATABASE_POOLER_URL: undefined,
      DATABASE_URL: "postgresql://u:p@db.example.com:5432/app",
    });
    const { resolveReadonlyDatasource } = await import("@/lib/db/prismaReadonly");

    expect(resolveReadonlyDatasource()).toEqual({
      url: "postgresql://u:p@db.example.com:5432/app",
      reusePrimary: true,
    });
  });

  it("reuses the primary when the replica url is the primary's pooler url", async () => {
    withEnv({
      DATABASE_READONLY_POOLER_URL: undefined,
      DATABASE_READONLY_URL: "postgresql://u:p@pooler.example.com/app?pgbouncer=true",
      DATABASE_POOLER_URL: "postgresql://u:p@pooler.example.com/app?pgbouncer=true",
      DATABASE_URL: "postgresql://u:p@db.example.com:5432/app",
    });
    const { resolveReadonlyDatasource } = await import("@/lib/db/prismaReadonly");

    expect(resolveReadonlyDatasource().reusePrimary).toBe(true);
  });

  it("wants its own client when a real replica is configured", async () => {
    withEnv({
      DATABASE_READONLY_POOLER_URL: undefined,
      DATABASE_READONLY_URL: "postgresql://u:p@replica.example.com:5432/app",
      DATABASE_POOLER_URL: undefined,
      DATABASE_URL: "postgresql://u:p@db.example.com:5432/app",
    });
    const { resolveReadonlyDatasource } = await import("@/lib/db/prismaReadonly");

    expect(resolveReadonlyDatasource()).toEqual({
      url: "postgresql://u:p@replica.example.com:5432/app",
      reusePrimary: false,
    });
  });

  it("prefers the replica's own pooler url over its direct one", async () => {
    withEnv({
      DATABASE_READONLY_POOLER_URL: "postgresql://u:p@replica-pooler.example.com/app",
      // Would have matched the primary and been reused, had it won.
      DATABASE_READONLY_URL: "postgresql://u:p@db.example.com:5432/app",
      DATABASE_POOLER_URL: undefined,
      DATABASE_URL: "postgresql://u:p@db.example.com:5432/app",
    });
    const { resolveReadonlyDatasource } = await import("@/lib/db/prismaReadonly");

    expect(resolveReadonlyDatasource()).toEqual({
      url: "postgresql://u:p@replica-pooler.example.com/app",
      reusePrimary: false,
    });
  });
});

describe("prismaReadonly", () => {
  it("is the primary client itself when no replica is configured", async () => {
    const { readonlyClient, primaryClient } = await importWith({
      DATABASE_READONLY_POOLER_URL: undefined,
      DATABASE_READONLY_URL: undefined,
      DATABASE_POOLER_URL: undefined,
      DATABASE_URL: "postgresql://u:p@db.example.com:5432/app",
    });

    expect(readonlyClient).toBe(primaryClient);
  });
});
