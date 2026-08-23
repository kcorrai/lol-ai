import { generateKeyPairSync, sign as cryptoSign } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyDiscordSignature } from "@/lib/discord/verify";

function makeKeypair() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  // Discord hands out the raw 32-byte key, which is the tail of the SPKI DER.
  const der = publicKey.export({ format: "der", type: "spki" }) as Buffer;
  return { privateKey, publicKeyHex: der.subarray(der.length - 32).toString("hex") };
}

function signRequest(
  privateKey: Parameters<typeof cryptoSign>[2],
  timestamp: string,
  body: string
) {
  return cryptoSign(null, Buffer.from(timestamp + body, "utf8"), privateKey).toString("hex");
}

describe("verifyDiscordSignature", () => {
  const timestamp = "1750000000";
  const rawBody = JSON.stringify({ type: 1 });

  it("accepts a signature produced by the matching key", () => {
    const { privateKey, publicKeyHex } = makeKeypair();
    const signature = signRequest(privateKey, timestamp, rawBody);

    expect(verifyDiscordSignature({ rawBody, signature, timestamp, publicKeyHex })).toBe(true);
  });

  it("rejects a body that changed after signing", () => {
    const { privateKey, publicKeyHex } = makeKeypair();
    const signature = signRequest(privateKey, timestamp, rawBody);

    expect(
      verifyDiscordSignature({
        rawBody: JSON.stringify({ type: 2 }),
        signature,
        timestamp,
        publicKeyHex,
      })
    ).toBe(false);
  });

  it("rejects a replayed body under a different timestamp", () => {
    const { privateKey, publicKeyHex } = makeKeypair();
    const signature = signRequest(privateKey, timestamp, rawBody);

    expect(
      verifyDiscordSignature({ rawBody, signature, timestamp: "1750000001", publicKeyHex })
    ).toBe(false);
  });

  it("rejects a signature from a different key", () => {
    const { privateKey } = makeKeypair();
    const other = makeKeypair();
    const signature = signRequest(privateKey, timestamp, rawBody);

    expect(
      verifyDiscordSignature({ rawBody, signature, timestamp, publicKeyHex: other.publicKeyHex })
    ).toBe(false);
  });

  it("returns false rather than throwing on malformed input", () => {
    const { publicKeyHex } = makeKeypair();

    expect(verifyDiscordSignature({ rawBody, signature: null, timestamp, publicKeyHex })).toBe(
      false
    );
    expect(verifyDiscordSignature({ rawBody, signature: "ab", timestamp, publicKeyHex })).toBe(
      false
    );
    expect(
      verifyDiscordSignature({ rawBody, signature: "zz".repeat(64), timestamp, publicKeyHex })
    ).toBe(false);
    expect(
      verifyDiscordSignature({
        rawBody,
        signature: "00".repeat(64),
        timestamp,
        publicKeyHex: "beef",
      })
    ).toBe(false);
  });

  it("returns false when the public key env var is unset", () => {
    const { privateKey } = makeKeypair();
    const signature = signRequest(privateKey, timestamp, rawBody);

    expect(verifyDiscordSignature({ rawBody, signature, timestamp, publicKeyHex: undefined })).toBe(
      false
    );
  });
});
