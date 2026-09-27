import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LeagueChips } from "./LeagueChips";
import type { EsportsLeague } from "@/domains/esports/types";

function league(slug: string, name: string): EsportsLeague {
  return {
    id: slug,
    slug,
    name,
    region: "EMEA",
    image: null,
    displayStatus: "selected",
    displayPosition: 0,
  };
}

describe("LeagueChips", () => {
  it("marks only the leagues with a match on now", () => {
    render(
      <LeagueChips leagues={[league("lec", "LEC"), league("wsci", "WSCI")]} liveSlugs={["wsci"]} />
    );

    const live = screen.getAllByLabelText("Live now");
    expect(live).toHaveLength(1);
    expect(live[0].closest("a")?.textContent).toBe("WSCI");
  });

  it("marks nothing when nothing is live", () => {
    render(<LeagueChips leagues={[league("lec", "LEC")]} />);
    expect(screen.queryByLabelText("Live now")).toBeNull();
  });
});
