import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SampleReport } from "./SampleReport";

// jsdom has no IntersectionObserver and `HudStagger` animates on `whileInView`.
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

describe("SampleReport", () => {
  it("says it is an example before showing a stranger's grades", () => {
    // The numbers are fixed. Without the label a reader could take them for a real player's.
    render(<SampleReport />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(/what you get back/i);
    expect(screen.getByText(/example report/i)).toBeInTheDocument();
  });
});
