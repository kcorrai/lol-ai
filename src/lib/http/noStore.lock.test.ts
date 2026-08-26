import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

/**
 * The lock on `cache: "no-store"`.
 *
 * ADR-034 ends by naming the grep that proves its rule. This is that idea applied to the
 * rule ADR-045 sets, because this one cannot be caught by reading a diff: `no-store` is the
 * obvious thing to write, it is what `@upstash/redis` ships as its default, and it behaves
 * perfectly at runtime. It only misbehaves inside a prerender, where Next throws a
 * DynamicServerError on it — and every one of our callers catches that throw and reports it
 * as a cache miss or a feed failure. The failure is therefore *silent*: the build goes
 * green, the pages render, and the only visible symptom is the Neon transfer bill.
 *
 * `no-cache` says the same thing to the framework's cache — `patch-fetch` maps both it and
 * `no-store` to `revalidate: 0`, so a response is stored under neither — and does not throw.
 * So there is no server-side reason to reach for `no-store`, and this fails the suite when
 * anyone does.
 *
 * Written as a walk over the tree rather than a lint rule so it needs no dependency and no
 * configuration, borrowing the shape of `src/lib/uiLocale.lock.test.ts`.
 */

/** Every `.ts`/`.tsx` in the tree that is not itself a test. */
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
 * The fetch init property, and only that.
 *
 * `Cache-Control: no-store` on a response we *send* is a different thing entirely — it is
 * correct on the desktop and draft routes that set it, and this must never flag those. Both
 * shapes of the init key are matched: `cache: "no-store"` and the quoted `"cache"` form.
 */
const NO_STORE_FETCH_OPTION = /["']?cache["']?\s*:\s*["']no-store["']/;

/**
 * A client component renders in the browser, where the framework's patched fetch is not
 * involved and the throw cannot happen. `no-store` there is a plain HTTP directive and the
 * more accurate one, so the rule stops at the server boundary rather than pretending
 * otherwise. Detected from the directive itself, so the exemption cannot go stale.
 */
function isClientComponent(source: string): boolean {
  return /^\s*(?:\/\/.*\n|\/\*[\s\S]*?\*\/\s*)*["']use client["']/.test(source);
}

/** The two products, plus the app router's pages. */
const ROOTS = ["src", "app", join("desktop", "src")];

describe("no server-side fetch asks for cache: no-store", () => {
  it("finds none anywhere in the tree", () => {
    const offenders: string[] = [];

    for (const root of ROOTS) {
      if (!existsSync(root)) continue;
      for (const file of walk(root)) {
        const source = readFileSync(file, "utf8");
        if (isClientComponent(source)) continue;

        source.split("\n").forEach((line, index) => {
          // Comments explain the rule and quote the thing it bans; they are prose, not calls.
          if (/^\s*(?:\/\/|\*|\/\*)/.test(line)) return;
          if (NO_STORE_FETCH_OPTION.test(line)) offenders.push(`${file}:${index + 1}`);
        });
      }
    }

    expect(offenders).toEqual([]);
  });

  it("does not mistake a Cache-Control response header for a fetch option", () => {
    expect(NO_STORE_FETCH_OPTION.test('res.headers.set("Cache-Control", "no-store")')).toBe(
      false
    );
    expect(NO_STORE_FETCH_OPTION.test('"Cache-Control": "no-store"')).toBe(false);
    expect(NO_STORE_FETCH_OPTION.test('const NO_STORE = "no-store";')).toBe(false);
  });

  it("catches the shapes it is meant to catch", () => {
    expect(NO_STORE_FETCH_OPTION.test('cache: "no-store",')).toBe(true);
    expect(NO_STORE_FETCH_OPTION.test("cache: 'no-store',")).toBe(true);
    expect(NO_STORE_FETCH_OPTION.test('"cache": "no-store"')).toBe(true);
  });
});
