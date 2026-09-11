import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountBand } from "./AccountBand";

// jsdom has neither IntersectionObserver — which `HudStagger` animates on — nor `matchMedia`,
// which `FeatureCard` asks whether the pointer can hover. Both are stubbed to the state this
// suite is about: the section rendered, on a pointer that hovers.
beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
      takeRecords(): [] {
        return [];
      }
    }
  );
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(hover: hover)",
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});

/** Every screen the band exists to name. Losing one is the regression that matters most. */
const ROUTES = [
  "/analysis",
  "/matches",
  "/timeline",
  "/recap",
  "/milestone",
  "/roadmap",
  "/improvement",
  "/otp",
  "/leaderboard",
  "/achievements",
];

describe("the account band", () => {
  it("still sends every cell to the screen it names", () => {
    const { container } = render(<AccountBand />);

    for (const href of ROUTES) {
      expect(
        container.querySelector(`a[href="${href}"]`),
        `no cell links to ${href}`
      ).not.toBeNull();
    }
    // The ten cells, plus "Start free" and "What Pro adds".
    expect(container.querySelectorAll("a")).toHaveLength(ROUTES.length + 2);
  });

  // The panel covers the cell it opens over, so if it did not repeat the name and the sentence,
  // hovering would hide the very thing the reader was reading.
  it("repeats the cell's own words inside the panel", async () => {
    const user = userEvent.setup();
    render(<AccountBand />);

    expect(screen.getAllByText(/every rank you have held/i)).toHaveLength(1);

    await user.hover(screen.getByRole("link", { name: /career timeline/i }));

    expect(screen.getAllByText(/every rank you have held/i)).toHaveLength(2);
  });

  // A drawing announced to a screen reader would read the same cell twice — the link beside it
  // already carries the name and the sentence.
  it("keeps the drawing out of the accessibility tree", async () => {
    const user = userEvent.setup();
    const { container } = render(<AccountBand />);

    await user.hover(screen.getByRole("link", { name: /heat map/i }));

    const panel = container.querySelector(".z-30");
    expect(panel).not.toBeNull();
    expect(panel).toHaveAttribute("aria-hidden", "true");
    // A preview is not a target: the link underneath stays the only hit area in the cell.
    expect(panel?.className).toContain("pointer-events-none");
  });

  // ADR-050: the landing page draws the product, it does not photograph it. `public/screenshots/`
  // is gone, and an `<img>` still pointing into it would 404 in production while a test that only
  // checked the links stayed green. What may be real is Riot's own art.
  it("photographs nothing, and draws only with Riot's published art", async () => {
    const user = userEvent.setup();
    const { container } = render(<AccountBand />);

    await user.hover(screen.getByRole("link", { name: /rank roadmap/i }));

    const sources = [...container.querySelectorAll("img")].map((i) => i.getAttribute("src") ?? "");
    expect(sources.length).toBeGreaterThan(0);
    for (const src of sources) {
      expect(src).not.toContain("/screenshots/");
      expect(src).toMatch(/^https:\/\/(ddragon\.leagueoflegends\.com|raw\.communitydragon\.org)\//);
    }
  });

  // The panel says what it is. Without the caption a drawing of a product is read as a
  // photograph of one, which is the whole reason ADR-050 exists.
  it("admits the drawing is a drawing", async () => {
    const user = userEvent.setup();
    render(<AccountBand />);

    await user.hover(screen.getByRole("link", { name: /leaderboard/i }));

    expect(screen.getByText(/illustration — drawn, not a capture/i)).toBeInTheDocument();
  });
});
