import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Must be a real constructor — the module under test calls `new Inngest(...)`,
// and an arrow-function mock is not newable.
vi.mock("inngest", () => ({
  Inngest: class {
    id = "lol-ai-coach";
  },
}));

// The guard runs as a module-load side effect, so each case needs a fresh
// module registry — importing once and re-reading env would not re-run it.
async function loadClient(): Promise<void> {
  vi.resetModules();
  await import("./client");
}

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllEnvs());

describe("inngest client signing-key guard", () => {
  it("refuses to load in production without a signing key", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("INNGEST_SIGNING_KEY", "");

    await expect(loadClient()).rejects.toThrow(/INNGEST_SIGNING_KEY is required in production/);
  });

  it("loads in production when the signing key is present", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("INNGEST_SIGNING_KEY", "signkey-prod-abc123");

    await expect(loadClient()).resolves.toBeUndefined();
  });

  // Local development and CI run without the key on purpose — the SDK's dev mode
  // is correct there, and failing closed outside production would just break both.
  it.each(["development", "test"])("loads without a key in %s", async (env) => {
    vi.stubEnv("NODE_ENV", env);
    vi.stubEnv("INNGEST_SIGNING_KEY", "");

    await expect(loadClient()).resolves.toBeUndefined();
  });

  // `next build` runs with NODE_ENV=production but serves no requests, and the
  // signing key is legitimately absent from build environments. Without this
  // exemption the guard would fail the build instead of the deployment —
  // verified against this repo, where .env.local has INNGEST_EVENT_KEY but no
  // INNGEST_SIGNING_KEY, so `npm run build` would have started failing.
  it("does not block the production build phase", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    vi.stubEnv("INNGEST_SIGNING_KEY", "");

    await expect(loadClient()).resolves.toBeUndefined();
  });

  it("still throws at runtime after a build that had no key", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PHASE", "");
    vi.stubEnv("INNGEST_SIGNING_KEY", "");

    await expect(loadClient()).rejects.toThrow(/INNGEST_SIGNING_KEY is required/);
  });
});
