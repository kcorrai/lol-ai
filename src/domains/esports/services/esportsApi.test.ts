import { describe, it, expect, vi, beforeEach } from "vitest";

import { esportsFetch, httpsAsset } from "./esportsApi";

describe("esportsFetch", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends the api key and hl, and skips the Next fetch cache", async () => {
    const spy = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    global.fetch = spy as unknown as typeof fetch;

    await esportsFetch("getSchedule", { params: { leagueId: "123", pageToken: undefined } });

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("https://esports-api.lolesports.com/persisted/gw/getSchedule");
    expect(url).toContain("hl=en-US");
    expect(url).toContain("leagueId=123");
    // An undefined param is omitted rather than serialised as "undefined".
    expect(url).not.toContain("pageToken");
    expect((init.headers as Record<string, string>)["x-api-key"]).toBeTruthy();
    // Not `no-store`, which throws a DynamicServerError inside a prerender and put every
    // ISR esports page back on a Postgres read for the whole of a build (ADR-045).
    expect(init.cache).toBe("no-cache");
  });
});

describe("httpsAsset", () => {
  it("upgrades the feed's http asset URLs so the CSP does not block them", () => {
    expect(httpsAsset("http://static.lolesports.com/teams/x.png")).toBe(
      "https://static.lolesports.com/teams/x.png"
    );
  });

  it("leaves https URLs alone and maps absent ones to null", () => {
    expect(httpsAsset("https://static.lolesports.com/x.png")).toBe(
      "https://static.lolesports.com/x.png"
    );
    expect(httpsAsset(null)).toBeNull();
    expect(httpsAsset(undefined)).toBeNull();
  });
});
