import { describe, expect, it, vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn(), isTauri: () => false }));

import { bridgedPath } from "./apiBridge";

const ORIGIN = "tauri://localhost";

/**
 * What the bridge takes and what it leaves alone (ADR-043).
 *
 * The second half matters more than the first. This module exists to answer the website's
 * own `/api` calls over IPC; if it also answered anything else, it would be a way around
 * the content policy rather than a way of honouring it.
 */
describe("bridgedPath", () => {
  it("takes a relative API call", () => {
    expect(bridgedPath("/api/analysis/dashboard", ORIGIN)).toBe("/api/analysis/dashboard");
  });

  it("keeps the query string, which is where the hooks put their filters", () => {
    expect(bridgedPath("/api/match/archive?limit=20&champion=Ahri", ORIGIN)).toBe(
      "/api/match/archive?limit=20&champion=Ahri"
    );
  });

  it("takes an absolute URL on this window's own origin", () => {
    expect(bridgedPath(`${ORIGIN}/api/achievements`, ORIGIN)).toBe("/api/achievements");
  });

  it("reads the path off a Request, which is how fetch is called with a body", () => {
    const request = new Request(`${ORIGIN}/api/daily-quest`, { method: "POST" });
    expect(bridgedPath(request, ORIGIN)).toBe("/api/daily-quest");
  });

  it("takes a URL object", () => {
    expect(bridgedPath(new URL(`${ORIGIN}/api/challenges`), ORIGIN)).toBe("/api/challenges");
  });

  /**
   * Anything else is left to the content policy, which refuses it. Proxying it here would
   * turn one command with an allowlist into an open outbound socket for the renderer.
   */
  it("leaves anything that is not a same-origin API call alone", () => {
    for (const input of [
      "https://evil.example/api/desktop/me",
      "http://127.0.0.1:2999/liveclientdata/allgamedata",
      "/assets/champion.png",
      "/apiary/not-ours",
      "",
    ]) {
      expect(bridgedPath(input, ORIGIN), `${input} must not be bridged`).toBeNull();
    }
  });

  it("is not fooled by an API path on another origin", () => {
    expect(bridgedPath("https://lolaicoach.gg/api/desktop/me", ORIGIN)).toBeNull();
  });

  /**
   * `URL.origin` is the string "null" for every scheme the standard does not call special,
   * and this window is served from one of those. Comparing origins would make every custom
   * scheme match every other, so protocol and host are compared instead.
   */
  it("does not treat one custom scheme as another", () => {
    expect(bridgedPath("evil://anywhere/api/desktop/me", ORIGIN)).toBeNull();
    expect(bridgedPath("tauri://elsewhere/api/desktop/me", ORIGIN)).toBeNull();
  });
});
