import { describe, expect, it } from "vitest";
import { needsSetup, pairingStateFor } from "./usePairing";

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

/**
 * Which states hide the rest of the window.
 *
 * The interesting half is what must *not* trigger it. Setup is a screen with no way out
 * except pairing, so putting a state there that cannot pair strands the window: the browser
 * preview has no credential store to pair against, and a machine that is merely offline
 * already holds the token it would be asked to go and get.
 */
describe("needsSetup", () => {
  it("takes over when the machine holds no token", () => {
    expect(needsSetup("unpaired")).toBe(true);
  });

  it("stays while a code is being exchanged", () => {
    expect(needsSetup("pairing")).toBe(true);
  });

  // The codeless path (ADR-048). Both of its states are still setup: the window has no
  // token yet, and the one thing there is to do is on the screen it would be leaving.
  it("stays while a request is being opened", () => {
    expect(needsSetup("opening")).toBe(true);
  });

  it("stays while waiting for the browser to approve", () => {
    expect(needsSetup("approving")).toBe(true);
  });

  it("leaves a paired machine alone", () => {
    expect(needsSetup("paired")).toBe(false);
  });

  it("does not strand the browser preview, which cannot pair at all", () => {
    expect(needsSetup("unavailable")).toBe(false);
  });

  it("does not ask an offline machine to pair again — it already has a token", () => {
    expect(needsSetup("offline")).toBe(false);
  });

  it("does not guess when the credential store could not be opened", () => {
    expect(needsSetup("unknown")).toBe(false);
  });

  // Not setup either: it is the state of not having asked yet, and `App` draws a quiet
  // screen for it rather than either answer.
  it("does not treat the first round trip as an answer", () => {
    expect(needsSetup("loading")).toBe(false);
  });
});
