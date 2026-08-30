import { describe, it, expect } from "vitest";
import { readdirSync } from "fs";
import { resolve } from "path";
import { HEADER_NAV, isMenu, type HeaderLink } from "./headerNav";

function allLinks(): HeaderLink[] {
  return HEADER_NAV.flatMap((entry) => (isMenu(entry) ? [...entry.items] : [entry]));
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
      expect(routes.has(link.href), `${link.href} has no page.tsx under app/`).toBe(true);
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

  it("announces the desktop app on the bar itself", () => {
    // It is the one thing a website cannot do, and it had no entry point anywhere on the
    // marketing site. Inside a panel it would be as undiscoverable as it was before.
    const flat = HEADER_NAV.filter((e) => !isMenu(e)) as HeaderLink[];
    expect(flat.map((l) => l.href)).toContain("/download");
  });
});
