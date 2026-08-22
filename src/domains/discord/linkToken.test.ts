import { beforeAll, describe, expect, it } from "vitest";
import { createLinkToken, readLinkToken } from "@/domains/discord/linkToken";

const CLAIMS = { discordUserId: "123456789", discordUsername: "kaan" };
const NOW = 1_750_000_000_000;
const TEN_MINUTES = 10 * 60 * 1000;

describe("discord link token", () => {
  beforeAll(() => {
    process.env.AUTH_ENCRYPTION_KEY = "a".repeat(64);
  });

  it("round-trips the claims", () => {
    const token = createLinkToken(CLAIMS, NOW);

    expect(readLinkToken(token, NOW + 1000)).toEqual(CLAIMS);
  });

  it("is URL-safe, so it survives being pasted into a link button", () => {
    expect(createLinkToken(CLAIMS, NOW)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("expires ten minutes after it was minted", () => {
    const token = createLinkToken(CLAIMS, NOW);

    expect(readLinkToken(token, NOW + TEN_MINUTES - 1)).toEqual(CLAIMS);
    expect(readLinkToken(token, NOW + TEN_MINUTES + 1)).toBeNull();
  });

  // The authentication tag is the whole reason this uses encryptString rather
  // than plain base64: a flipped byte must fail, not decode to another user.
  it("rejects a token that has been altered", () => {
    const token = createLinkToken(CLAIMS, NOW);
    const flipped = token.slice(0, -2) + (token.endsWith("A") ? "B" : "A");

    expect(readLinkToken(flipped, NOW)).toBeNull();
  });

  it("rejects garbage without throwing", () => {
    expect(readLinkToken("", NOW)).toBeNull();
    expect(readLinkToken("not-a-token", NOW)).toBeNull();
    expect(readLinkToken(Buffer.from("v2:zz:zz:zz").toString("base64url"), NOW)).toBeNull();
  });
});
