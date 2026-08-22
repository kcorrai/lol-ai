import { describe, expect, it } from "vitest";
import {
  championSummary,
  formDots,
  kdaLine,
  rankHeadline,
  riotIdLabel,
  winRateLine,
} from "@/domains/discord/views/format";
import type { PreviewMatch } from "@/types/preview";

function match(win: boolean): PreviewMatch {
  return { championName: "Ahri", win, kills: 9, deaths: 2, assists: 11, position: "MIDDLE" };
}

describe("card formatting", () => {
  it("renders a rank headline, and Unranked when there is no entry", () => {
    expect(rankHeadline({ tier: "GOLD", division: "II", lp: 47, wins: 1, losses: 1 })).toBe(
      "**Gold II** · 47 LP"
    );
    expect(rankHeadline(null)).toBe("Unranked");
  });

  // Apex tiers have no division, and Riot sends it as an empty string.
  it("does not leave a gap when a tier has no division", () => {
    expect(rankHeadline({ tier: "CHALLENGER", division: "", lp: 1204, wins: 1, losses: 0 })).toBe(
      "**Challenger** · 1204 LP"
    );
  });

  it("rounds win rate and says so plainly when there are no games", () => {
    expect(winRateLine(23, 19)).toBe("23W 19L · 55% win rate");
    expect(winRateLine(0, 0)).toBe("No ranked games yet");
  });

  it("draws recent form newest first and caps it at ten", () => {
    expect(formDots([match(true), match(false), match(true)])).toBe("🟢🔴🟢");
    expect([...formDots(Array.from({ length: 15 }, () => match(true)))].join("")).toBe(
      "🟢".repeat(10)
    );
    expect(formDots([])).toBe("No recent games");
  });

  it("summarises a champion pool in one line", () => {
    expect(
      championSummary([
        { championName: "Ahri", games: 24, wins: 15, winRate: 62.5 },
        { championName: "Azir", games: 12, wins: 7, winRate: 55.4 },
      ])
    ).toBe("`Ahri` 63% · `Azir` 55%");
    expect(championSummary([])).toBe("Not enough games to tell yet");
  });

  it("formats identity and KDA", () => {
    expect(
      riotIdLabel({ gameName: "Faker", tagLine: "KR1", summonerLevel: 800, profileIconId: 1 })
    ).toBe("Faker#KR1");
    expect(kdaLine(match(true))).toBe("9/2/11");
  });
});
