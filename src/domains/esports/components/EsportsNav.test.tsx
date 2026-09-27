import { describe, expect, it } from "vitest";
import { TABS, isActive } from "@/domains/esports/components/EsportsNav";

function activeTab(pathname: string): string[] {
  return TABS.filter((tab) => isActive(tab, pathname)).map((tab) => tab.label);
}

describe("isActive", () => {
  it("lights Overview on the hub only", () => {
    expect(activeTab("/esports")).toEqual(["Overview"]);
    expect(activeTab("/esports/vods")).toEqual(["VODs"]);
  });

  it("lights the section a detail page belongs to", () => {
    expect(activeTab("/esports/tournaments/lec_split_3_2026")).toEqual(["Tournaments"]);
    expect(activeTab("/esports/players/faker")).toEqual(["Teams"]);
    expect(activeTab("/esports/matches/123")).toEqual(["Schedule"]);
    expect(activeTab("/esports/champions/ahri")).toEqual(["Pro meta"]);
  });

  it("does not mistake a longer path for a prefix", () => {
    expect(activeTab("/esports/teamsx")).toEqual([]);
  });
});
