import { describe, expect, it } from "vitest";
import { allLessons, lessonId } from "./curriculum";
import { resolveAsset } from "./assets";
import type { FigureBlock, MapFigureBlock } from "./types";
import { DDRAGON_CHAMPION_IDS } from "@/lib/ddragonChampionIds.fixture";

const CHAMPION_NAMES = new Set(DDRAGON_CHAMPION_IDS.map(([name]) => name));

function figures(): { where: string; block: FigureBlock }[] {
  return allLessons().flatMap((lesson) =>
    lesson.blocks
      .filter((b): b is FigureBlock => b.kind === "figure")
      .map((block) => ({ where: lessonId(lesson), block }))
  );
}

function mapFigures(): { where: string; block: MapFigureBlock }[] {
  return allLessons().flatMap((lesson) =>
    lesson.blocks
      .filter((b): b is MapFigureBlock => b.kind === "mapFigure")
      .map((block) => ({ where: lessonId(lesson), block }))
  );
}

describe("figures", () => {
  it("shows between one and six things, each with something to say about it", () => {
    for (const { where, block } of figures()) {
      expect(block.caption.length, where).toBeGreaterThan(8);
      expect(block.assets.length, where).toBeGreaterThan(0);
      expect(block.assets.length, where).toBeLessThanOrEqual(6);
      for (const asset of block.assets) {
        expect(asset.label.length, `${where} / ${asset.label}`).toBeGreaterThan(2);
        expect(asset.note.length, `${where} / ${asset.label}`).toBeGreaterThan(20);
      }
    }
  });

  /**
   * Item, spell and keystone slugs are typechecked against the catalogue, so the only way to
   * name something that does not exist is a champion — the one open set.
   */
  it("names only champions Data Dragon has", () => {
    for (const { where, block } of figures()) {
      for (const asset of block.assets) {
        if (asset.ref.of !== "champion") continue;
        expect(CHAMPION_NAMES.has(asset.ref.name), `${where} / ${asset.ref.name}`).toBe(true);
      }
    }
  });

  it("resolves every asset to an image", () => {
    for (const { where, block } of figures()) {
      for (const asset of block.assets) {
        expect(resolveAsset(asset.ref).src, `${where} / ${asset.label}`).not.toBe("");
      }
    }
  });

  // The labels are the React keys, and a repeat inside one figure is a rendering bug.
  it("labels each thing in a figure differently", () => {
    for (const { where, block } of figures()) {
      const labels = block.assets.map((a) => a.label);
      expect(new Set(labels).size, where).toBe(labels.length);
    }
  });
});

describe("map figures", () => {
  it("pins between two and six places, each with something to say about it", () => {
    for (const { where, block } of mapFigures()) {
      expect(block.caption.length, where).toBeGreaterThan(8);
      expect(block.annotations.length, where).toBeGreaterThanOrEqual(2);
      expect(block.annotations.length, where).toBeLessThanOrEqual(6);
      for (const annotation of block.annotations) {
        expect(annotation.label.length, `${where} / ${annotation.label}`).toBeGreaterThan(2);
        expect(annotation.note.length, `${where} / ${annotation.label}`).toBeGreaterThan(20);
      }
    }
  });

  // The same bound the map drills are held to: a pin outside the box is invisible, and one the
  // size of the map says nothing.
  it("keeps every pin inside the map and small enough to read", () => {
    for (const { where, block } of mapFigures()) {
      for (const { at, label } of block.annotations) {
        expect(at.x, `${where} / ${label}`).toBeGreaterThanOrEqual(0);
        expect(at.x, `${where} / ${label}`).toBeLessThanOrEqual(1);
        expect(at.y, `${where} / ${label}`).toBeGreaterThanOrEqual(0);
        expect(at.y, `${where} / ${label}`).toBeLessThanOrEqual(1);
        expect(at.r, `${where} / ${label}`).toBeGreaterThan(0);
        expect(at.r, `${where} / ${label}`).toBeLessThanOrEqual(0.15);
      }
    }
  });

  it("labels each pin differently", () => {
    for (const { where, block } of mapFigures()) {
      const labels = block.annotations.map((a) => a.label);
      expect(new Set(labels).size, where).toBe(labels.length);
    }
  });
});

describe("clips", () => {
  /**
   * A clip needs a champion's numeric key, which only the generator has. A hand-written lesson
   * carrying one would be guessing at an id, and a wrong guess renders a video that 404s.
   */
  it("never appears in a hand-written lesson", () => {
    for (const lesson of allLessons()) {
      expect(lesson.blocks.filter((b) => b.kind === "clip"), lessonId(lesson)).toHaveLength(0);
    }
  });
});
