import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { FreeToolsGrid } from "./FreeToolsGrid";

describe("the free tools grid", () => {
  // The regression guard for ADR-050. These six tiles carried their meaning in a background
  // image out of `public/screenshots/`; that directory is gone, and an `<img>` still pointing
  // into it would 404 in production while a test that only checked the links stayed green.
  it("renders no image at all", () => {
    const { container } = render(<FreeToolsGrid />);

    expect(container.querySelectorAll("img")).toHaveLength(0);
  });

  // The tiles changed what they show. Where they go is the part that must not move.
  it("keeps all six tools and their destinations", () => {
    const { container } = render(<FreeToolsGrid />);

    const hrefs = [
      "/tools/counter-picker",
      "/tools/tier-list",
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

    expect(container.querySelectorAll("[aria-hidden='true']").length).toBeGreaterThanOrEqual(6);
  });
});
