import { describe, expect, it } from "vitest";
import { safeCallbackUrl } from "./safeCallbackUrl";

describe("safeCallbackUrl", () => {
  it("follows a same-site path", () => {
    expect(safeCallbackUrl("/settings/desktop/approve")).toBe("/settings/desktop/approve");
  });

  // The whole reason middleware now sends the query string along: a pairing approval, a team
  // invite and a claim all carry their subject in it, and a path alone lands on an empty page.
  it("keeps the query string, which is where the deep link's subject lives", () => {
    expect(safeCallbackUrl("/settings/desktop/approve?request=abc")).toBe(
      "/settings/desktop/approve?request=abc"
    );
    expect(safeCallbackUrl("/teams/join?token=xyz")).toBe("/teams/join?token=xyz");
  });

  it("falls back when there is nothing to follow", () => {
    expect(safeCallbackUrl(null)).toBe("/dashboard");
    expect(safeCallbackUrl(undefined)).toBe("/dashboard");
    expect(safeCallbackUrl("")).toBe("/dashboard");
  });

  it("takes a caller-supplied fallback", () => {
    expect(safeCallbackUrl(null, "/coaching")).toBe("/coaching");
  });

  // A callbackUrl arrives in the query string, so it is attacker-supplied: anything that
  // leaves the site would make our own login form the front half of a phishing redirect.
  it("refuses to leave the site", () => {
    expect(safeCallbackUrl("https://evil.example/login")).toBe("/dashboard");
    expect(safeCallbackUrl("http://evil.example")).toBe("/dashboard");
    // Protocol-relative: starts with a slash and still leaves.
    expect(safeCallbackUrl("//evil.example/login")).toBe("/dashboard");
    expect(safeCallbackUrl("javascript:alert(1)")).toBe("/dashboard");
    // Not a path at all — a bare word would resolve relative to whatever page is open.
    expect(safeCallbackUrl("dashboard")).toBe("/dashboard");
  });
});
