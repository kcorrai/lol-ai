import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CoachingBand } from "./CoachingBand";

// jsdom has no IntersectionObserver and `HudStagger` animates on `whileInView`. The stub
// never fires, which is what this suite wants: it asserts on links and copy, not on
// whether an entrance animation played. Same reason `DesktopBand.test.tsx` carries one.
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

describe("CoachingBand", () => {
  it("sends the reader to the storefront and nowhere else", () => {
    // This band used to be half marketplace, half Team plan, and the Team half took the
    // reader to `/pricing`. The section is the marketplace's now; a second destination
    // here is the split that made the human product read as an aside.
    render(<CoachingBand />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/coaches");
  });

  it("leads on the badge, because that is the claim nobody else makes", () => {
    // Every competitor lets a coach type their rank into a bio. If this copy ever
    // softens into "verified coaches", the section has given away the only thing it has.
    render(<CoachingBand />);

    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(/rank we checked/i);
    expect(screen.getAllByText(/linked Riot account/i).length).toBeGreaterThan(0);
  });

  it("names all three things a coach can sell", () => {
    // `KIND_OPTIONS` in the marketplace domain has exactly these three. A band that
    // mentioned only replay reviews would undersell two shipped delivery flows.
    render(<CoachingBand />);

    expect(screen.getByText(/^Replay review$/)).toBeInTheDocument();
    expect(screen.getByText(/^Live 1:1 session$/)).toBeInTheDocument();
    expect(screen.getByText(/^Live game coaching$/)).toBeInTheDocument();
  });
});
