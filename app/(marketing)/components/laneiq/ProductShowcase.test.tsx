import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductShowcase } from "./ProductShowcase";

// jsdom has no IntersectionObserver, and `HudReveal` animates on `whileInView`. The stub never
// fires, which is the state this suite wants: it asserts on what is drawn and where the cards
// go, not on whether an entrance animation played.
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
});

describe("the landing page's product imagery", () => {
  // The regression guard for ADR-050. Both sections rendered captures out of
  // `public/screenshots/`, that directory is gone, and an `<img>` pointing into it would 404
  // in production while looking fine in a component test that only checked for links.
  it("renders no image at all", () => {
    const { container } = render(<ProductShowcase />);

    expect(container.querySelectorAll("img")).toHaveLength(0);
  });

  it("labels every drawing for a reader who cannot see it", () => {
    render(<ProductShowcase />);

    // Four screens, each wrapped in `Illustration` — which is what supplies both the
    // accessible name and the caption saying the picture is a drawing.
    const drawings = screen.getAllByRole("img");
    expect(drawings).toHaveLength(4);
    for (const d of drawings) {
      expect(d).toHaveAccessibleName(/.{40,}/);
    }
  });

  it("says the screens are drawn rather than claiming they are captures", () => {
    render(<ProductShowcase />);

    expect(screen.getByText(/drawn from the real screens/i)).toBeInTheDocument();
    expect(screen.queryByText(/real screens, not mock-ups/i)).not.toBeInTheDocument();
  });

  it("still sends each card to the screen it draws", () => {
    render(<ProductShowcase />);

    expect(screen.getByRole("link", { name: /your dashboard/i })).toHaveAttribute(
      "href",
      "/register"
    );
    expect(screen.getByRole("link", { name: /tier list/i })).toHaveAttribute(
      "href",
      "/tools/tier-list"
    );
    expect(screen.getByRole("link", { name: /esports/i })).toHaveAttribute("href", "/esports");
    expect(screen.getByRole("link", { name: /laneiq daily/i })).toHaveAttribute("href", "/quiz");
  });
});
