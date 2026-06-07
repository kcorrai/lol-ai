import { describe, it, expect } from "vitest";
import { toProfileSlug } from "./profileService";

describe("toProfileSlug", () => {
  it("formats gameName#tagLine into a URL-safe slug", () => {
    expect(toProfileSlug("KaaN", "TR1")).toBe("KaaN-TR1");
  });

  it("replaces # with -", () => {
    const slug = toProfileSlug("Test#Player", "EUW");
    expect(slug).toBe("Test-Player-EUW");
  });

  it("replaces spaces with -", () => {
    expect(toProfileSlug("Dark Soul", "NA1")).toBe("Dark-Soul-NA1");
  });

  it("replaces multiple special characters", () => {
    const slug = toProfileSlug("Türk€Çe", "TR1");
    expect(slug).toMatch(/^[a-zA-Z0-9\-_]+$/);
  });

  it("preserves alphanumeric, hyphen, and underscore", () => {
    expect(toProfileSlug("Cool_Player", "EUW1")).toBe("Cool_Player-EUW1");
  });

  it("handles empty strings without crashing", () => {
    const slug = toProfileSlug("", "");
    expect(typeof slug).toBe("string");
  });
});
