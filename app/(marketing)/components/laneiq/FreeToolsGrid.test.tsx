import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { FreeToolsGrid } from "./FreeToolsGrid";

describe("the free tools grid", () => {
  // The regression guard for ADR-050. These tiles carried their meaning in a background image
  // out of `public/screenshots/`; that directory is gone, and an `<img>` still pointing into it
  // would 404 in production while a test that only checked the links stayed green.
  //
  // It used to assert no image at all, which was the right guard for the wrong reason: what
  // ADR-050 rules out is photographing our own screens, not drawing with the game's art. The
  // marks carry real champion, item and rune icons now, so the guard names the directory it
  // was always about and checks the rest come from Riot's CDNs.
  it("photographs nothing, and draws only with the game's own art", () => {
    const { container } = render(<FreeToolsGrid />);

    const sources = [...container.querySelectorAll("img")].map((i) => i.getAttribute("src") ?? "");
    expect(sources.length).toBeGreaterThan(0);
    for (const src of sources) {
      expect(src).not.toContain("/screenshots/");
      expect(src).toMatch(/^https:\/\/ddragon\.leagueoflegends\.com\//);
    }
  });

  // The tiles changed what they show. Where they go is the part that must not move.
  it("keeps every tool and its destination", () => {
    const { container } = render(<FreeToolsGrid />);

    const hrefs = [
      "/tools/counter-picker",
      "/tools/tier-list",
      // The tools hub calls this its flagship, and the landing page used to omit it.
      "/draft",
      "/tools/draft-analyzer",
      "/builds",
      "/aram/tier-list",
      "/meta",
    ];
    for (const href of hrefs) {
      expect(
        container.querySelector(`a[href="${href}"]`),
        `no tile links to ${href}`
      ).not.toBeNull();
    }
    expect(container.querySelectorAll("a")).toHaveLength(hrefs.length + 1); // + "All tools"
  });

  // A drawing that announced itself would read out invented win rates over the label that
  // actually carries the meaning, so each mark is hidden and the label speaks for it.
  it("leaves the drawings out of the accessibility tree", () => {
    const { container } = render(<FreeToolsGrid />);

    expect(container.querySelectorAll("[aria-hidden='true']").length).toBeGreaterThanOrEqual(7);
  });

  // Six identical tiles made the ARAM tier list weigh exactly as much as the counter picker.
  // The split is the whole point of the section's layout, so it is guarded rather than left
  // to a class string nobody would notice losing.
  it("gives the three lead tools a wider column than the four lookups", () => {
    const { container } = render(<FreeToolsGrid />);

    expect(container.querySelectorAll("a.lg\\:col-span-4")).toHaveLength(3);
    expect(container.querySelectorAll("a.lg\\:col-span-3")).toHaveLength(4);
  });
});
