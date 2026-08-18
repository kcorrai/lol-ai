import { describe, it, expect } from "vitest";
import {
  BUILD_DATASET_VERSION,
  buildFor,
  buildPool,
  visibleBuild,
} from "@/domains/quiz/services/buildMode";
import { answerFor } from "@/domains/quiz/services/puzzleService";
import { allChampions } from "@/domains/quiz/services/championPool";

const POOL = buildPool();

function dateKeys(count: number, from = "2026-01-01"): string[] {
  const start = new Date(`${from}T00:00:00.000Z`).getTime();
  return Array.from({ length: count }, (_, i) =>
    new Date(start + i * 86_400_000).toISOString().slice(0, 10)
  );
}

describe("the compiled build dataset", () => {
  it("covers most of the roster and names a patch", () => {
    expect(POOL.length).toBeGreaterThan(150);
    expect(POOL.length).toBeLessThanOrEqual(allChampions().length);
    expect(BUILD_DATASET_VERSION).toMatch(/^\d+\.\d+/);
  });

  it("gives every champion in the pool a full, playable build", () => {
    for (const champion of POOL) {
      const entry = buildFor(champion.id);
      expect(entry, champion.id).toBeDefined();
      expect(entry!.core.length, champion.id).toBeGreaterThanOrEqual(2);
      expect(entry!.spells.length, champion.id).toBe(2);
      expect(entry!.skillMax.length, champion.id).toBeGreaterThanOrEqual(1);
      expect(champion.positions, champion.id).toContain(entry!.position);
    }
  });

  it("has no two champions whose whole build is identical", () => {
    const seen = new Map<string, string>();
    for (const champion of POOL) {
      const e = buildFor(champion.id)!;
      const key = [e.core, e.boots, e.starter, e.spells, e.skillMax]
        .map((part) => part.join("."))
        .join("|");
      expect(seen.get(key), `${champion.id} shares a build with ${seen.get(key)}`).toBeUndefined();
      seen.set(key, champion.id);
    }
  });

  it("names every item and spell it shows", () => {
    const prompt = visibleBuild(POOL[0], 4);
    if (prompt.kind !== "build") throw new Error("expected a build prompt");
    for (const item of [...prompt.core, ...(prompt.boots ?? []), ...(prompt.starter ?? [])]) {
      expect(item.name, String(item.id)).not.toMatch(/^Item \d+$/);
    }
    for (const spell of prompt.spells ?? []) {
      expect(spell.name, String(spell.id)).not.toMatch(/^Spell \d+$/);
      expect(spell.image).toMatch(/\.png$/);
    }
  });
});

describe("visibleBuild", () => {
  const champion = POOL[0];

  it("shows the core items and nothing else before the first miss", () => {
    const prompt = visibleBuild(champion, 0);
    if (prompt.kind !== "build") throw new Error("expected a build prompt");
    expect(prompt.core.length).toBeGreaterThanOrEqual(2);
    expect(prompt.boots).toBeUndefined();
    expect(prompt.starter).toBeUndefined();
    expect(prompt.spells).toBeUndefined();
    expect(prompt.skillMax).toBeUndefined();
  });

  it("unlocks exactly one rung per miss, and nothing beyond it", () => {
    const revealed = (misses: number): string[] => {
      const prompt = visibleBuild(champion, misses);
      if (prompt.kind !== "build") throw new Error("expected a build prompt");
      return ["core", "boots", "starter", "spells", "skillMax"].filter(
        (key) => prompt[key as "boots"] !== undefined
      );
    };

    expect(revealed(0)).toEqual(["core"]);
    expect(revealed(1)).toEqual(["core", "boots"]);
    expect(revealed(2)).toEqual(["core", "boots", "starter"]);
    expect(revealed(3)).toEqual(["core", "boots", "starter", "spells"]);
    expect(revealed(4)).toEqual(["core", "boots", "starter", "spells", "skillMax"]);
    expect(revealed(99)).toEqual(revealed(4));
  });
});

describe("the daily deal", () => {
  it("never deals a champion the dataset has no build for", () => {
    for (const dateKey of dateKeys(400)) {
      const answer = answerFor("build", dateKey);
      expect(buildFor(answer.id), `${dateKey} dealt ${answer.id}`).toBeDefined();
    }
  });
});
