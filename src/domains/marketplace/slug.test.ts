import { describe, it, expect } from "vitest";
import { slugify, isReserved, pickSlug } from "@/domains/marketplace/slug";

describe("slugify", () => {
  it("lowercases and dashes", () => {
    expect(slugify("Faker Coaching")).toBe("faker-coaching");
  });

  it("collapses runs of punctuation into one dash", () => {
    expect(slugify("Hide on   bush!!! ~ #1")).toBe("hide-on-bush-1");
  });

  it("trims dashes off both ends", () => {
    expect(slugify("  ...Rekkles...  ")).toBe("rekkles");
  });

  // Folding before stripping is the whole point: strip first and "Şükrü"
  // becomes "kr", which is a worse URL than one nobody asked for.
  it("folds Turkish letters instead of dropping them", () => {
    expect(slugify("Şükrü Çağrı Güneş")).toBe("sukru-cagri-gunes");
    expect(slugify("Iğdır")).toBe("igdir");
  });

  it("folds accented Latin through NFD", () => {
    expect(slugify("Café Niño")).toBe("cafe-nino");
    expect(slugify("Ørjan Åse")).toBe("orjan-ase");
  });

  it("returns empty for a name with nothing ASCII in it, rather than mangling it", () => {
    expect(slugify("페이커")).toBe("");
    expect(slugify("戦士")).toBe("");
  });

  it("truncates without leaving a trailing dash", () => {
    const slug = slugify("a".repeat(40) + " " + "b".repeat(40));
    expect(slug.length).toBeLessThanOrEqual(48);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("is idempotent", () => {
    const once = slugify("Şükrü Çağrı — The Coach");
    expect(slugify(once)).toBe(once);
  });
});

describe("isReserved", () => {
  it("keeps our own paths", () => {
    expect(isReserved("apply")).toBe(true);
    expect(isReserved("search")).toBe(true);
  });

  it("leaves ordinary names alone", () => {
    expect(isReserved("faker")).toBe(false);
  });
});

describe("pickSlug", () => {
  it("takes the plain slug when it is free", () => {
    expect(pickSlug("Rekkles", new Set())).toBe("rekkles");
  });

  it("suffixes on a collision rather than making the coach rename themselves", () => {
    expect(pickSlug("Rekkles", new Set(["rekkles"]))).toBe("rekkles-2");
    expect(pickSlug("Rekkles", new Set(["rekkles", "rekkles-2"]))).toBe("rekkles-3");
  });

  it("suffixes past a reserved word", () => {
    expect(pickSlug("Apply", new Set())).toBe("apply-2");
  });

  it("falls back when the name slugifies to nothing", () => {
    expect(pickSlug("페이커", new Set())).toBe("coach");
    expect(pickSlug("페이커", new Set(["coach"]))).toBe("coach-2");
  });

  it("never returns something already taken", () => {
    const taken = new Set(["faker", "faker-2", "faker-3", "faker-4"]);
    const slug = pickSlug("Faker", taken);
    expect(taken.has(slug)).toBe(false);
    expect(slug).toBe("faker-5");
  });
});
