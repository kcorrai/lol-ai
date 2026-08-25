import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

/**
 * The lock on `uiLocale.ts`.
 *
 * Fifty-four call sites formatted numbers and dates in the language of whatever machine
 * happened to run them — a Turkish laptop here, an American server in production — inside an
 * interface that declares `lang="en"` either way. Fixing them is one commit; keeping them
 * fixed is this, because the broken form is what you get by writing the obvious thing:
 * `count.toLocaleString()` looks complete and is not.
 *
 * Written as a walk over the tree rather than as a lint rule so it needs no dependency and
 * no configuration. `src/lib/ai/taskTiers.test.ts` does the same thing for the AI task
 * table, and this borrows its shape.
 */

/** Every `.ts`/`.tsx` in the tree that is not a test. */
function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist" || entry === ".next") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

/**
 * A formatting call that names no language.
 *
 * Both shapes: no argument at all, and an explicit `undefined` where the locale goes. The
 * second is the more dangerous one — it reads as deliberate.
 */
const LOCALE_LESS =
  /\.toLocale(?:String|DateString|TimeString)\(\s*(?:\)|undefined\b)|new Intl\.(?:Number|DateTime|RelativeTime)Format\(\s*(?:\)|undefined\b)/g;

/** The two products, plus the app router's pages. The desktop reads `src/lib` through its alias. */
const ROOTS = ["src", "app", join("desktop", "src")];

/**
 * `uiLocale.ts` is the one file allowed to call these: it is where the language is named,
 * and it names it. Nothing else on this list — an exemption here is a screen formatting in
 * a language the interface does not speak.
 */
const ALLOWED = [join("src", "lib", "uiLocale.ts")];

describe("no formatting call takes its language from the machine", () => {
  const offenders: string[] = [];
  for (const root of ROOTS) {
    for (const file of walk(root)) {
      if (ALLOWED.some((allowed) => file.endsWith(allowed))) continue;
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(LOCALE_LESS)) {
        const line = source.slice(0, match.index).split("\n").length;
        offenders.push(`${file}:${line} ${match[0].trim()}`);
      }
    }
  }

  it("finds none", () => {
    // Named rather than counted: a count that moved says something changed, and this has to
    // say *where*, because the fix is at the call site and nowhere else.
    expect(offenders).toEqual([]);
  });

  // Without this the test above passes by walking nothing at all — a wrong root, a rename,
  // a `walk` that quietly returns empty — which is how a lock stops being one.
  it("looked at the whole tree", () => {
    const files = ROOTS.flatMap((root) => walk(root));

    expect(files.length).toBeGreaterThan(500);
    expect(files.some((f) => f.includes(join("desktop", "src")))).toBe(true);
    expect(files.some((f) => f.startsWith("app"))).toBe(true);
  });

  // And that the pattern still matches the thing it is looking for, so a regex edited into
  // uselessness fails here rather than silently passing everything.
  it("still recognises what it is looking for", () => {
    const samples = [
      "count.toLocaleString()",
      "count.toLocaleString(undefined, { style: 'percent' })",
      "date.toLocaleDateString()",
      "date.toLocaleDateString(undefined, opts)",
      "date.toLocaleTimeString(undefined, opts)",
      "new Intl.NumberFormat(undefined, opts)",
      "new Intl.DateTimeFormat()",
    ];

    for (const sample of samples) {
      expect([sample, LOCALE_LESS.test(sample)]).toEqual([sample, true]);
      LOCALE_LESS.lastIndex = 0;
    }

    for (const fine of ['count.toLocaleString("en-US")', "new Intl.NumberFormat(UI_LOCALE, o)"]) {
      expect([fine, LOCALE_LESS.test(fine)]).toEqual([fine, false]);
      LOCALE_LESS.lastIndex = 0;
    }
  });
});
