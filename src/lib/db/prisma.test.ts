import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The module builds a PrismaClient at import time, so each case needs a fresh module registry with
// the environment already set the way the case is about.
const ORIGINAL = { ...process.env };

async function importWith(env: Record<string, string | undefined>): Promise<string[]> {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  await import("@/lib/db/prisma");
  return warn.mock.calls.map((c) => String(c[0]));
}

beforeEach(() => vi.resetModules());
afterEach(() => {
  process.env = { ...ORIGINAL };
  vi.restoreAllMocks();
});

describe("pooled connection check", () => {
  // The comment in prisma.ts describes a property of the env var's value, which the repository
  // cannot confirm. Concurrent match ingest is what makes an unpooled URL matter: it multiplies
  // direct connections rather than pooled ones, and surfaces as P2024.
  it("warns in production when the resolved url is not pooled", async () => {
    const warnings = await importWith({
      NODE_ENV: "production",
      DATABASE_POOLER_URL: undefined,
      DATABASE_URL: "postgresql://u:p@db.example.com:5432/app",
    });

    expect(warnings.join(" ")).toContain("DATABASE_POOLER_URL");
  });

  it("stays quiet when pgbouncer is on the connection string", async () => {
    const warnings = await importWith({
      NODE_ENV: "production",
      DATABASE_POOLER_URL: "postgresql://u:p@db.example.com:5432/app?pgbouncer=true",
    });

    expect(warnings).toEqual([]);
  });

  it("recognises a Neon pooler host even without the query parameter", async () => {
    const warnings = await importWith({
      NODE_ENV: "production",
      DATABASE_POOLER_URL: "postgresql://u:p@ep-cool-name-pooler.eu-central-1.aws.neon.tech/app",
    });

    expect(warnings).toEqual([]);
  });

  // Local development runs against a hand-started native cluster with no pooler in front of it.
  // Warning there would train everyone to ignore the message.
  it("says nothing outside production", async () => {
    const warnings = await importWith({
      NODE_ENV: "development",
      DATABASE_POOLER_URL: undefined,
      DATABASE_URL: "postgresql://lolai:pw@localhost:5432/lolai_dev",
    });

    expect(warnings).toEqual([]);
  });
});
