import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { resolve } from "path";
import { HEADER_NAV, isMenu, type HeaderLink } from "./headerNav";

function allLinks(): HeaderLink[] {
  return HEADER_NAV.flatMap((entry) => (isMenu(entry) ? [...entry.items] : [entry]));
}

/** "/pricing#teams" → "/pricing". An anchor names a place on a page, not another page. */
function pagePart(href: string): string {
  return href.split("#")[0]!;
}

/**
 * Every static route `app/` actually serves, read off the filesystem.
 *
 * Route groups contribute no URL segment, so `(tools)/meta/page.tsx` is `/meta`. Dynamic
 * segments are skipped: nothing in the header points at one, and a `[slug]` cannot be
 * matched against a literal href anyway.
 */
function staticRoutes(dir: string, prefix = ""): string[] {
  const routes: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile()) {
      if (entry.name === "page.tsx") routes.push(prefix === "" ? "/" : prefix);
      continue;
    }
    if (!entry.isDirectory() || entry.name.startsWith("[") || entry.name === "node_modules") {
      continue;
    }
    const isGroup = entry.name.startsWith("(") || entry.name.startsWith("@");
    routes.push(
      ...staticRoutes(resolve(dir, entry.name), isGroup ? prefix : `${prefix}/${entry.name}`)
    );
  }
  return routes;
}

describe("HEADER_NAV", () => {
  it("points every entry at a route that exists", () => {
    // The bar is the site's own index of itself, and a dead entry on it is worse than a
    // missing one — it is the first thing a visitor clicks. This walks `app/` rather than
    // trusting the list, so deleting a page fails here instead of in production.
    const routes = new Set(staticRoutes(resolve(process.cwd(), "app")));

    for (const link of allLinks()) {
      expect(routes.has(pagePart(link.href)), `${link.href} has no page.tsx under app/`).toBe(true);
    }
  });

  it("never lists the same destination twice", () => {
    // Two routes to one page reads as two features and makes the panels look padded.
    const hrefs = allLinks().map((l) => l.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("gives every menu a unique key and at least two items", () => {
    const menus = HEADER_NAV.filter(isMenu);
    const keys = menus.map((m) => m.key);

    expect(new Set(keys).size).toBe(keys.length);
    for (const menu of menus) {
      // A one-item menu costs a click and buys nothing; it should be a flat link instead.
      expect(menu.items.length, `${menu.key} is not worth a panel`).toBeGreaterThan(1);
    }
  });

  it("keeps the bar short enough to stay on one row", () => {
    // The reason this file exists. Six top-level entries plus a wordmark, a search box and
    // two calls to action is what a 1440px bar holds; new links belong in a panel.
    expect(HEADER_NAV.length).toBeLessThanOrEqual(6);
  });

  it("labels every entry, and hints every item inside a panel", () => {
    for (const entry of HEADER_NAV) {
      expect(entry.label.length).toBeGreaterThan(0);
      if (!isMenu(entry)) continue;
      for (const item of entry.items) {
        expect(item.hint, `${item.href} needs a hint inside a panel`).toBeTruthy();
      }
    }
  });

  it("leaves the desktop app to the control that carries it", () => {
    // It used to be a flat entry here. It is now a bordered button beside the calls to
    // action, so listing it as well would put the same destination on the bar twice —
    // `DownloadCta.test.tsx` is what holds the bar to still announcing it at all.
    const flat = HEADER_NAV.filter((e) => !isMenu(e)) as HeaderLink[];
    expect(flat.map((l) => l.href)).not.toContain("/download");
  });

  it("never sends a visitor from the bar into a login form", () => {
    // The defect this file's Coaching panel had: "AI coach" and "Teams" pointed into the
    // application, which the middleware guards, so the one person the panel is written for
    // — somebody deciding whether to sign up — was answered with a sign-in page. The bar is
    // the marketing site's own index; nothing on it may be behind the wall.
    //
    // Read out of the middleware rather than listed again, so a path guarded tomorrow fails
    // here rather than quietly becoming a dead end.
    const source = readFileSync(resolve(process.cwd(), "middleware.ts"), "utf8");
    const list = source.match(/const PROTECTED_PATHS = \[([\s\S]*?)\]/);
    if (!list) throw new Error("PROTECTED_PATHS is no longer a literal — update this test");

    const guarded = [...list[1]!.matchAll(/^\s*"([^"]+)"/gm)].map((m) => m[1]!);
    expect(guarded.length).toBeGreaterThan(10);

    // `/coaching` is on that list and is the exception the middleware makes: its index
    // renders a public page when there is no session, so the bar may point at it.
    const publicByRewrite = new Set(["/coaching"]);

    for (const link of allLinks()) {
      const page = pagePart(link.href);
      if (publicByRewrite.has(page)) continue;
      const wall = guarded.find((p) => page === p || page.startsWith(`${p}/`));
      expect(wall, `${link.href} is guarded by ${wall} — the bar cannot point at it`).toBe(
        undefined
      );
    }
  });
});
