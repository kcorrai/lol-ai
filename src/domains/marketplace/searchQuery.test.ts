import { describe, it, expect } from "vitest";
import {
  parseSearchQuery,
  buildSearchParams,
  canonicalPath,
  isFiltered,
  pageOf,
  PAGE_SIZE,
} from "@/domains/marketplace/searchQuery";

describe("parseSearchQuery", () => {
  it("defaults to rating, available only, page one", () => {
    const q = parseSearchQuery({});
    expect(q.sort).toBe("rating");
    expect(q.availableOnly).toBe(true);
    expect(pageOf(q)).toBe(1);
    expect(q.limit).toBe(PAGE_SIZE);
  });

  it("reads the enum filters case-insensitively", () => {
    const q = parseSearchQuery({ role: "jungle", kind: "vod_review", minTier: "diamond" });
    expect(q.role).toBe("JUNGLE");
    expect(q.kind).toBe("VOD_REVIEW");
    expect(q.minTier).toBe("DIAMOND");
  });

  // A storefront is a URL people edit, share and mangle. Answering a bad filter
  // with an error page is worse for everyone than answering with all the coaches.
  it("drops values it does not recognise rather than failing", () => {
    const q = parseSearchQuery({
      role: "carry",
      kind: "telepathy",
      minTier: "wood",
      sort: "vibes",
    });
    expect(q.role).toBeUndefined();
    expect(q.kind).toBeUndefined();
    expect(q.minTier).toBeUndefined();
    expect(q.sort).toBe("rating");
  });

  it("lowercases languages and regions instead of uppercasing them", () => {
    const q = parseSearchQuery({ lang: "TR", region: "EUW1" });
    expect(q.language).toBe("tr");
    expect(q.region).toBe("euw1");
  });

  it("converts the price filter from whole units into cents", () => {
    expect(parseSearchQuery({ maxPrice: "45" }).maxPriceCents).toBe(4500);
    expect(parseSearchQuery({ maxPrice: "12.5" }).maxPriceCents).toBe(1250);
  });

  it("ignores a price that is not a usable number", () => {
    expect(parseSearchQuery({ maxPrice: "free" }).maxPriceCents).toBeUndefined();
    expect(parseSearchQuery({ maxPrice: "-10" }).maxPriceCents).toBeUndefined();
    expect(parseSearchQuery({ maxPrice: "0" }).maxPriceCents).toBeUndefined();
  });

  it("takes the first value when a param is repeated", () => {
    expect(parseSearchQuery({ role: ["TOP", "JUNGLE"] }).role).toBe("TOP");
  });

  it("only leaves the available-only default when explicitly asked", () => {
    expect(parseSearchQuery({ all: "1" }).availableOnly).toBe(false);
    expect(parseSearchQuery({ all: "0" }).availableOnly).toBe(true);
  });

  it("clamps a nonsense page back to the first", () => {
    expect(pageOf(parseSearchQuery({ page: "0" }))).toBe(1);
    expect(pageOf(parseSearchQuery({ page: "-3" }))).toBe(1);
    expect(pageOf(parseSearchQuery({ page: "abc" }))).toBe(1);
    expect(pageOf(parseSearchQuery({ page: "4" }))).toBe(4);
  });
});

describe("buildSearchParams", () => {
  // One spelling per view, or the same page is indexed under a dozen URLs.
  it("writes nothing for an unfiltered default search", () => {
    expect(buildSearchParams(parseSearchQuery({}))).toBe("");
    expect(canonicalPath(parseSearchQuery({}))).toBe("/coaches");
  });

  it("round-trips a filtered search", () => {
    const original = parseSearchQuery({
      role: "JUNGLE",
      lang: "tr",
      minTier: "DIAMOND",
      maxPrice: "45",
      sort: "price_asc",
      page: "3",
    });

    const reparsed = parseSearchQuery(
      Object.fromEntries(new URLSearchParams(buildSearchParams(original)))
    );

    expect(reparsed).toEqual(original);
  });

  it("emits keys in a fixed order so one view has one URL", () => {
    const a = buildSearchParams(parseSearchQuery({ role: "TOP", lang: "en" }));
    const b = buildSearchParams(parseSearchQuery({ lang: "en", role: "TOP" }));
    expect(a).toBe(b);
  });

  it("omits the default sort but keeps the others", () => {
    expect(buildSearchParams(parseSearchQuery({ sort: "rating" }))).toBe("");
    expect(buildSearchParams(parseSearchQuery({ sort: "newest" }))).toBe("sort=newest");
  });

  it("writes the price back in whole units, not cents", () => {
    expect(buildSearchParams(parseSearchQuery({ maxPrice: "45" }))).toBe("maxPrice=45");
  });
});

describe("isFiltered", () => {
  it("is false for the bare storefront", () => {
    expect(isFiltered(parseSearchQuery({}))).toBe(false);
  });

  it("is false for sorting and paging alone — neither narrows anything", () => {
    expect(isFiltered(parseSearchQuery({ sort: "newest", page: "2" }))).toBe(false);
  });

  it.each([
    ["role", { role: "TOP" }],
    ["kind", { kind: "VOD_REVIEW" }],
    ["tier", { minTier: "DIAMOND" }],
    ["language", { lang: "tr" }],
    ["region", { region: "euw1" }],
    ["price", { maxPrice: "30" }],
    ["showing unavailable", { all: "1" }],
  ])("is true once %s narrows it", (_label, params) => {
    expect(isFiltered(parseSearchQuery(params))).toBe(true);
  });
});
