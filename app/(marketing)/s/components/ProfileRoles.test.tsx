import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfileRoles } from "./ProfileRoles";
import type { PreviewMatch } from "@/types/preview";
import { previewMatchFixture } from "@/types/preview.fixture";

const match = (position: string, win: boolean): PreviewMatch =>
  previewMatchFixture({ position, win });

describe("ProfileRoles", () => {
  it("reads the split off the sample and orders it by games played", () => {
    render(
      <ProfileRoles
        matches={[
          match("UTILITY", true),
          match("MIDDLE", true),
          match("MIDDLE", false),
          match("MIDDLE", true),
        ]}
      />,
    );

    const roles = screen.getAllByRole("term").map((el) => el.textContent);
    expect(roles).toEqual(["Mid", "Support"]);
  });

  it("shows each role's share and win rate over the sample", () => {
    render(<ProfileRoles matches={[match("MIDDLE", true), match("UTILITY", false)]} />);

    // One game each, so both roles are half the sample.
    expect(screen.getAllByText(/50% · 1g ·/)).toHaveLength(2);
    // Win rate is per role, not shared: the won role reads 100%, the lost one 0%.
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("renders nothing rather than an empty panel when there are no matches", () => {
    const { container } = render(<ProfileRoles matches={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
