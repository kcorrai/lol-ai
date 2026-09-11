import { renderToStaticMarkup } from "react-dom/server";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CountUp } from "./CountUp";

/** jsdom has no IntersectionObserver, and the animation never starts without one. */
class NeverIntersecting {
  observe(): void {}
  disconnect(): void {}
  unobserve(): void {}
}

function setReducedMotion(reduce: boolean): void {
  vi.stubGlobal(
    "matchMedia",
    vi
      .fn()
      .mockReturnValue({ matches: reduce, addEventListener: vi.fn(), removeEventListener: vi.fn() })
  );
}

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", NeverIntersecting);
  setReducedMotion(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CountUp", () => {
  /**
   * The one that matters. Seeded at 0, the server rendered 0 — so the marketing pages' central
   * claim reached every crawler that does not run scripts, and every visitor with scripting off,
   * as "Powered by 0 ranked games". The animation is a decoration on top of a fact.
   */
  it("puts the real number in the server-rendered markup", () => {
    expect(renderToStaticMarkup(<CountUp value={38_692_282} />)).toContain("38.7M");
    expect(renderToStaticMarkup(<CountUp value={4_318} />)).toContain("4.3K");
    expect(renderToStaticMarkup(<CountUp value={7} />)).toContain("7");
  });

  it("renders no zero at all on the server", () => {
    expect(renderToStaticMarkup(<CountUp value={1_200_000} />)).not.toContain(">0<");
  });

  it("holds the final value when the visitor asked for less motion", () => {
    setReducedMotion(true);
    render(<CountUp value={12_345} />);

    expect(screen.getByText("12.3K")).toBeInTheDocument();
  });

  it("winds back to zero before animating when motion is allowed", () => {
    render(<CountUp value={12_345} />);

    // The observer never fires here, so this is the start of the count rather than the end of it.
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  describe("compact formatting", () => {
    it("uses M above a million and K above a thousand", () => {
      setReducedMotion(true);
      render(<CountUp value={2_500_000} />);
      expect(screen.getByText("2.5M")).toBeInTheDocument();
    });

    it("leaves anything under a thousand alone", () => {
      setReducedMotion(true);
      render(<CountUp value={999} />);
      expect(screen.getByText("999")).toBeInTheDocument();
    });
  });
});
