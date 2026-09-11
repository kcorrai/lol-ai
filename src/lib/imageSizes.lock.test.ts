import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

/**
 * The lock on `<Image fill>` without `sizes`.
 *
 * `fill` gives the image no intrinsic width, so next/image cannot guess which srcset candidate
 * the layout wants and falls back to `sizes="100vw"`. On a wide screen that means fetching the
 * largest variant Data Dragon has — a 1215px champion splash, or worse — for a decorative band
 * sitting behind text at 10% opacity inside a `max-w-2xl` column. Nothing fails, nothing warns
 * in production, and the only visible symptom is the bandwidth.
 *
 * `unoptimized` is exempt: it bypasses the optimizer entirely, emits no srcset, and `sizes`
 * would have nothing to choose between.
 *
 * Written as a walk over the tree rather than a lint rule so it needs no dependency and no
 * configuration, borrowing the shape of `src/lib/uiLocale.lock.test.ts`.
 */

/** Every `.tsx` in the app and the shared tree that is not itself a test. */
function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".next") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".tsx") && !entry.name.endsWith(".test.tsx")) out.push(full);
  }
  return out;
}

const ROOTS = ["app", "src"];

/**
 * Self-closing `<Image … />` only, which is every one of them: next/image takes no children.
 * Non-greedy, so two images in the same file are two matches rather than one span covering both.
 */
const IMAGE_TAG = /<Image\b[\s\S]*?\/>/g;

function offendersIn(source: string): string[] {
  const found: string[] = [];
  for (const match of source.matchAll(IMAGE_TAG)) {
    const tag = match[0];
    if (!/\bfill\b/.test(tag)) continue;
    if (/\bsizes=/.test(tag)) continue;
    if (/\bunoptimized\b/.test(tag)) continue;
    found.push(`line ${source.slice(0, match.index).split("\n").length}`);
  }
  return found;
}

// Reading every .tsx in the tree is about a second alone, but inside a full `vitest run` it
// competes with 300-odd other files for the same disk, so it gets its own budget.
const TREE_WALK_TIMEOUT_MS = 60_000;

describe("every filled Image says what width it needs", () => {
  it("finds none anywhere in the tree", { timeout: TREE_WALK_TIMEOUT_MS }, () => {
    const offenders: string[] = [];

    for (const root of ROOTS) {
      for (const file of walk(root)) {
        const source = readFileSync(file, "utf8");
        if (!source.includes("<Image")) continue;
        for (const where of offendersIn(source)) offenders.push(`${file}:${where}`);
      }
    }

    // Named rather than counted: the fix is at the call site, so this has to say where.
    expect(offenders).toEqual([]);
  });

  it("looked at a real tree", { timeout: TREE_WALK_TIMEOUT_MS }, () => {
    const files = ROOTS.flatMap((root) => walk(root));

    expect(files.length).toBeGreaterThan(300);
    expect(files.some((f) => f.startsWith("app"))).toBe(true);
  });

  it("still recognises what it is looking for", () => {
    expect(offendersIn(`<Image fill src={x} alt="" />`)).toHaveLength(1);
    // Multi-line, which is how every real one is written.
    expect(offendersIn(`<Image\n  fill\n  alt=""\n  src={x}\n/>`)).toHaveLength(1);
  });

  it("accepts the two forms that are fine", () => {
    expect(offendersIn(`<Image fill sizes="100vw" src={x} alt="" />`)).toEqual([]);
    expect(offendersIn(`<Image fill unoptimized src={x} alt="" />`)).toEqual([]);
  });

  it("ignores an Image given explicit dimensions", () => {
    expect(offendersIn(`<Image width={48} height={48} src={x} alt="" />`)).toEqual([]);
  });

  it("does not merge two images in one file into one match", () => {
    const two = `<Image fill src={a} alt="" />\n<div/>\n<Image fill src={b} alt="" />`;
    expect(offendersIn(two)).toHaveLength(2);
  });
});
