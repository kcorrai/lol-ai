import { describe, expect, it } from "vitest";
import { VOD_PAGE_SIZE, shownCount } from "@/domains/esports/vodPaging";

describe("shownCount", () => {
  it("shows one page by default, or everything when there is less", () => {
    expect(shownCount(undefined, 150)).toBe(VOD_PAGE_SIZE);
    expect(shownCount(undefined, 12)).toBe(12);
  });

  it("grows by whole pages and stops at the end", () => {
    expect(shownCount("80", 150)).toBe(80);
    expect(shownCount("81", 150)).toBe(120);
    expect(shownCount("400", 150)).toBe(150);
  });

  it("ignores a value it cannot read", () => {
    expect(shownCount("lots", 150)).toBe(VOD_PAGE_SIZE);
    expect(shownCount("-5", 150)).toBe(VOD_PAGE_SIZE);
  });
});
