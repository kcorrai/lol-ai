import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac, timingSafeEqual } from "crypto";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    webhookEvent: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  },
}));

// Spied so the constant-time guarantee is assertable. Every other behaviour in
// this file passes just as happily against a plain `===`, so without this the
// suite would green-light a timing-attackable rewrite.
vi.mock("crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("crypto")>();
  return { ...actual, timingSafeEqual: vi.fn(actual.timingSafeEqual) };
});

import {
  verifyLsWebhookSignature,
  buildEventKey,
  claimWebhookEvent,
  markWebhookEventProcessed,
} from "./lsWebhookVerify";
import { prisma } from "@/lib/db/prisma";
import type { LsSubscriptionAttributes } from "@/lib/lemonsqueezy/types";

const SECRET = "whsec_test_secret";

function sign(body: string, secret = SECRET): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

const VALID_BODY = JSON.stringify({
  meta: { event_name: "subscription_created" },
  data: { id: "sub_123", attributes: { status: "active" } },
});

function attrs(overrides: Partial<LsSubscriptionAttributes> = {}): LsSubscriptionAttributes {
  return {
    customer_id: 1,
    status: "active",
    renews_at: "2026-08-20T00:00:00.000Z",
    ends_at: null,
    trial_ends_at: null,
    cancelled: false,
    pause: null,
    ...overrides,
  };
}

describe("verifyLsWebhookSignature", () => {
  it("accepts a signature produced with the shared secret", () => {
    expect(verifyLsWebhookSignature(VALID_BODY, sign(VALID_BODY), SECRET)).toBe(true);
  });

  // The forgery cases. Each of these returning true would mean anyone can POST a
  // subscription_created event and grant themselves a paid plan.
  it("rejects a body tampered with after signing", () => {
    const signature = sign(VALID_BODY);
    const tampered = VALID_BODY.replace("sub_123", "sub_999");

    expect(verifyLsWebhookSignature(tampered, signature, SECRET)).toBe(false);
  });

  it("rejects a signature produced with a different secret", () => {
    const forged = sign(VALID_BODY, "attacker_secret");

    expect(verifyLsWebhookSignature(VALID_BODY, forged, SECRET)).toBe(false);
  });

  it("rejects a signature that is valid for a different body", () => {
    const otherBody = JSON.stringify({ meta: { event_name: "subscription_expired" } });

    expect(verifyLsWebhookSignature(VALID_BODY, sign(otherBody), SECRET)).toBe(false);
  });

  // timingSafeEqual throws on unequal buffer lengths and Buffer.from(_, "hex")
  // silently truncates garbage — hence the try/catch in the implementation.
  // These assert it degrades to false rather than throwing a 500.
  it.each([
    ["empty", ""],
    ["not hex", "zzzz-not-hex-zzzz"],
    ["truncated hex", sign(VALID_BODY).slice(0, 32)],
    ["over-long hex", sign(VALID_BODY) + "abcd"],
  ])("rejects a %s signature without throwing", (_label, signature) => {
    expect(() => verifyLsWebhookSignature(VALID_BODY, signature, SECRET)).not.toThrow();
    expect(verifyLsWebhookSignature(VALID_BODY, signature, SECRET)).toBe(false);
  });

  it("rejects an empty secret", () => {
    expect(verifyLsWebhookSignature(VALID_BODY, sign(VALID_BODY), "")).toBe(false);
  });

  // A byte-by-byte `===` would satisfy every other test in this file while
  // leaking the expected signature through response timing. This is the only
  // test that fails if someone "simplifies" the comparison.
  it("compares in constant time rather than with ===", () => {
    vi.mocked(timingSafeEqual).mockClear();

    verifyLsWebhookSignature(VALID_BODY, sign(VALID_BODY), SECRET);

    expect(timingSafeEqual).toHaveBeenCalledTimes(1);
  });

  it("is sensitive to a single flipped character in the signature", () => {
    const signature = sign(VALID_BODY);
    const flipped =
      (signature[0] === "a" ? "b" : "a") + signature.slice(1);

    expect(verifyLsWebhookSignature(VALID_BODY, flipped, SECRET)).toBe(false);
  });
});

describe("buildEventKey", () => {
  it("is stable across retries of the identical event", () => {
    const a = buildEventKey("subscription_updated", "sub_1", attrs());
    const b = buildEventKey("subscription_updated", "sub_1", attrs());

    expect(a).toBe(b);
  });

  // Each of these must produce a distinct key, or a genuinely new event would be
  // swallowed by the idempotency check as a duplicate.
  it.each([
    ["event name", () => buildEventKey("subscription_cancelled", "sub_1", attrs())],
    ["subscription id", () => buildEventKey("subscription_updated", "sub_2", attrs())],
    ["status", () => buildEventKey("subscription_updated", "sub_1", attrs({ status: "cancelled" }))],
    [
      "renewal date",
      () => buildEventKey("subscription_updated", "sub_1", attrs({ renews_at: "2026-09-20T00:00:00.000Z" })),
    ],
  ])("changes when the %s differs", (_label, build) => {
    const base = buildEventKey("subscription_updated", "sub_1", attrs());

    expect(build()).not.toBe(base);
  });

  it("falls back to ends_at when renews_at is null", () => {
    const key = buildEventKey(
      "subscription_cancelled",
      "sub_1",
      attrs({ renews_at: null, ends_at: "2026-08-01T00:00:00.000Z" })
    );

    expect(key).toContain("2026-08-01T00:00:00.000Z");
  });

  it("tolerates both dates being null", () => {
    const key = buildEventKey("subscription_expired", "sub_1", attrs({ renews_at: null, ends_at: null }));

    expect(key).toBe("subscription_expired:sub_1:active:");
  });
});

describe("claimWebhookEvent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("claims a first-seen event, leaving it unstamped", async () => {
    vi.mocked(prisma.webhookEvent.create).mockResolvedValue({} as never);

    await expect(claimWebhookEvent("evt-1")).resolves.toBe(true);
    expect(prisma.webhookEvent.create).toHaveBeenCalledWith({
      data: { eventKey: "evt-1", processedAt: null },
    });
  });

  // The unique constraint is the lock: under concurrent deliveries exactly one
  // insert wins, and the loser must not run the handler in parallel.
  it("refuses a concurrent delivery whose insert lost the race", async () => {
    vi.mocked(prisma.webhookEvent.create).mockRejectedValue(new Error("Unique constraint failed"));
    vi.mocked(prisma.webhookEvent.findUnique).mockResolvedValue({
      processedAt: new Date(),
    } as never);

    await expect(claimWebhookEvent("evt-1")).resolves.toBe(false);
  });

  // The bug this task fixes. Previously the key was written before dispatch, so a
  // failed handler made every retry look like a duplicate and the paid
  // subscription was silently never applied. An unstamped row now means the
  // previous attempt did not finish, so the retry is allowed to run it again.
  it("re-claims an event whose previous attempt failed before finishing", async () => {
    vi.mocked(prisma.webhookEvent.create).mockRejectedValue(new Error("Unique constraint failed"));
    vi.mocked(prisma.webhookEvent.findUnique).mockResolvedValue({ processedAt: null } as never);

    await expect(claimWebhookEvent("evt-1")).resolves.toBe(true);
  });

  it("refuses when the row vanished between insert and lookup", async () => {
    vi.mocked(prisma.webhookEvent.create).mockRejectedValue(new Error("Unique constraint failed"));
    vi.mocked(prisma.webhookEvent.findUnique).mockResolvedValue(null as never);

    await expect(claimWebhookEvent("evt-1")).resolves.toBe(false);
  });
});

describe("markWebhookEventProcessed", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stamps the claimed event so later deliveries count as duplicates", async () => {
    vi.mocked(prisma.webhookEvent.update).mockResolvedValue({} as never);

    await markWebhookEventProcessed("evt-1");

    expect(prisma.webhookEvent.update).toHaveBeenCalledWith({
      where: { eventKey: "evt-1" },
      data: { processedAt: expect.any(Date) },
    });
  });
});
