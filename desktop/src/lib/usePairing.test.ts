import { describe, expect, it } from "vitest";
import { pairingStateFor } from "./usePairing";

/**
 * The hook itself needs a DOM and this suite runs in node, which is why the decision it
 * makes is a function rather than a branch inside the effect — the same shape as
 * `parseCollapsed`.
 *
 * What is pinned here is one rule: the app may say "yes", it may say "no", and it may say
 * "I could not tell", but it may never say "no" when it means the third. The credential
 * store used to answer `false` for both "there is no entry" and "I could not be asked", and
 * the app then told a player holding a working token that nothing was stored for it.
 */
describe("pairingStateFor", () => {
  const message = "could not reach LoL AI Coach: connection refused";

  it("is offline when the store holds a token and the website is out of reach", () => {
    expect(pairingStateFor({ status: "paired" }, message)).toEqual({
      status: "offline",
      error: message,
    });
  });

  it("is unpaired only when the store actually answered no", () => {
    expect(pairingStateFor({ status: "not-paired" }, message)).toEqual({
      status: "unpaired",
      error: message,
    });
  });

  it("does not say unpaired when the store could not be asked", () => {
    const state = pairingStateFor({ status: "unknown", reason: "the vault is locked" }, message);

    expect(state.status).toBe("unknown");
    expect(state.status).not.toBe("unpaired");
  });

  // The store's own words, not the website's: the failure the player can act on is the one
  // that stopped the app finding out, not the one that started the whole attempt.
  it("carries the reason the store gave rather than the website's", () => {
    expect(pairingStateFor({ status: "unknown", reason: "the vault is locked" }, message)).toEqual({
      status: "unknown",
      error: "the vault is locked",
    });
  });

  // `null` is `readDeviceStatus` saying nobody was asked — no core, or an IPC that failed.
  // Two ways of not knowing, and neither of them is a no either.
  it("does not say unpaired when there was nothing to ask", () => {
    expect(pairingStateFor(null, message)).toEqual({ status: "unknown", error: message });
  });
});
