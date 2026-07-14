import { describe, it, expect } from "vitest";
import { rankUpEmbed, achievementEmbed, weeklyRecapEmbed, testEmbed } from "./embeds";

describe("rankUpEmbed", () => {
  const params = {
    gameName: "KaaN", tagLine: "TR1",
    prevTier: "GOLD", prevDivision: "II", prevLp: 80,
    newTier: "PLATINUM", newDivision: "IV", newLp: 12,
  };

  it("contains gameName in description", () => {
    const embed = rankUpEmbed(params);
    expect(embed.description).toContain("KaaN#TR1");
  });

  it("includes prev and new rank fields", () => {
    const embed = rankUpEmbed(params);
    const fieldNames = embed.fields?.map((f) => f.name) ?? [];
    expect(fieldNames).toContain("Previous Rank");
    expect(fieldNames).toContain("New Rank");
  });

  it("has a color value", () => {
    const embed = rankUpEmbed(params);
    expect(typeof embed.color).toBe("number");
  });

  it("has a footer", () => {
    const embed = rankUpEmbed(params);
    expect(embed.footer?.text).toContain("lolaicoach");
  });
});

describe("achievementEmbed", () => {
  it("includes achievement name in title", () => {
    const embed = achievementEmbed({
      gameName: "KaaN",
      achievementName: "CS Machine",
      achievementDescription: "7.0+ CS/min in 3 games",
      tier: "silver",
      iconSlug: "⚔️",
    });
    expect(embed.title).toContain("CS Machine");
  });
});

describe("weeklyRecapEmbed", () => {
  it("shows positive LP as green color", () => {
    const embed = weeklyRecapEmbed({ gameName: "KaaN", wins: 8, losses: 2, lpDelta: 50 });
    expect(embed.color).toBe(0x3cba8c);
  });

  it("shows negative LP as red color", () => {
    const embed = weeklyRecapEmbed({ gameName: "KaaN", wins: 2, losses: 8, lpDelta: -30 });
    expect(embed.color).toBe(0xe84057);
  });

  it("includes win rate in fields", () => {
    const embed = weeklyRecapEmbed({ gameName: "KaaN", wins: 6, losses: 4, lpDelta: 20 });
    const wrField = embed.fields?.find((f) => f.name === "Win Rate");
    expect(wrField?.value).toContain("60");
  });

  it("optionally includes top champion", () => {
    const embed = weeklyRecapEmbed({ gameName: "KaaN", wins: 5, losses: 5, lpDelta: 0, topChampion: "Ahri" });
    const champField = embed.fields?.find((f) => f.name === "Top Champion");
    expect(champField?.value).toBe("Ahri");
  });
});

describe("testEmbed", () => {
  it("returns a valid embed with success indication", () => {
    const embed = testEmbed();
    expect(embed.title).toContain("Test");
    expect(typeof embed.color).toBe("number");
  });
});
