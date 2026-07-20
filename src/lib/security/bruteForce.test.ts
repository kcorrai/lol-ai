import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@sentry/nextjs", () => ({ captureEvent: vi.fn() }));
vi.mock("@/lib/utils/logger", () => ({ logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/audit/auditService", () => ({ audit: vi.fn().mockResolvedValue(undefined) }));

import { recordFailedAttempt, clearFailedAttempts } from "./bruteForce";
import * as Sentry from "@sentry/nextjs";

const MAX_ATTEMPTS = 5;

// The module keeps its fallback counters in a module-level Map that nothing
// exposes for clearing. Rather than reaching into module internals, every test
// uses its own identifier — which also mirrors production, where the key is a
// per-user/per-IP string.
let seq = 0;
function freshId(): string {
  seq += 1;
  return `test-identifier-${seq}`;
}

beforeEach(() => {
  vi.clearAllMocks();
  // No Upstash config → the in-memory fallback path is the one under test.
  vi.stubEnv("KV_REST_API_URL", "");
  vi.stubEnv("KV_REST_API_TOKEN", "");
});

afterEach(() => vi.unstubAllEnvs());

describe("recordFailedAttempt", () => {
  it("allows the attempts below the threshold", async () => {
    const id = freshId();

    for (let i = 1; i < MAX_ATTEMPTS; i++) {
      await expect(recordFailedAttempt(id)).resolves.toBeUndefined();
    }
  });

  it("throws TOO_MANY_ATTEMPTS on the attempt that reaches the threshold", async () => {
    const id = freshId();

    for (let i = 1; i < MAX_ATTEMPTS; i++) await recordFailedAttempt(id);

    await expect(recordFailedAttempt(id)).rejects.toThrow("TOO_MANY_ATTEMPTS");
  });

  it("keeps throwing once locked out", async () => {
    const id = freshId();

    for (let i = 1; i < MAX_ATTEMPTS; i++) await recordFailedAttempt(id);
    await expect(recordFailedAttempt(id)).rejects.toThrow();

    await expect(recordFailedAttempt(id)).rejects.toThrow("TOO_MANY_ATTEMPTS");
  });

  // Counters must not be global: one attacker hammering an account cannot be
  // allowed to lock every other user out.
  it("counts each identifier separately", async () => {
    const attacker = freshId();
    const bystander = freshId();

    for (let i = 1; i < MAX_ATTEMPTS; i++) await recordFailedAttempt(attacker);
    await expect(recordFailedAttempt(attacker)).rejects.toThrow();

    await expect(recordFailedAttempt(bystander)).resolves.toBeUndefined();
  });

  it("reports the lockout to Sentry", async () => {
    const id = freshId();

    for (let i = 1; i < MAX_ATTEMPTS; i++) await recordFailedAttempt(id);
    await expect(recordFailedAttempt(id)).rejects.toThrow();

    expect(Sentry.captureEvent).toHaveBeenCalledWith(
      expect.objectContaining({ level: "warning", message: "Brute force attempt detected" })
    );
  });

  // The window is fixed, not sliding: the counter resets once resetAt passes,
  // so a slow guesser is not locked out forever.
  it("starts a fresh window after the previous one expires", async () => {
    const id = freshId();
    const start = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(start);

    for (let i = 1; i < MAX_ATTEMPTS; i++) await recordFailedAttempt(id);

    // 15 minutes and change later
    vi.spyOn(Date, "now").mockReturnValue(start + 16 * 60 * 1000);
    await expect(recordFailedAttempt(id)).resolves.toBeUndefined();

    vi.mocked(Date.now).mockRestore();
  });
});

describe("clearFailedAttempts", () => {
  // Called after a successful login, so a user who mistypes twice then succeeds
  // does not carry those failures into their next session.
  it("resets the counter so the full allowance returns", async () => {
    const id = freshId();

    for (let i = 1; i < MAX_ATTEMPTS; i++) await recordFailedAttempt(id);
    await clearFailedAttempts(id);

    for (let i = 1; i < MAX_ATTEMPTS; i++) {
      await expect(recordFailedAttempt(id)).resolves.toBeUndefined();
    }
  });

  it("is a no-op for an identifier that was never seen", async () => {
    await expect(clearFailedAttempts(freshId())).resolves.toBeUndefined();
  });
});
