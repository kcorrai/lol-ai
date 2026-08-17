import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TierTable } from "./TierTable";
import type { TierRow } from "./sortEntries";

// next/image needs a loader and a runtime this environment does not have; the
// icon is not what any of these assertions are about.
vi.mock("@/components/ui/ChampionIcon", () => ({
  ChampionIcon: ({ name }: { name: string }) => <span>{name}</span>,
}));

const row = (over: Partial<TierRow> & { championKey: string }): TierRow => ({
  name: over.championKey,
  tier: 1,
  rank: 1,
  prevPatchRank: 1,
  winRate: 50,
  pickRate: 5,
  banRate: 5,
  games: 1000,
  lowConfidence: false,
  proPickRate: null,
  ...over,
});

function table(entries: TierRow[], showPro: boolean): void {
  render(
    <TierTable
      entries={entries}
      sort="rank"
      direction="asc"
      onSort={() => undefined}
      hrefBase="/counters"
      showBan
      showMovement
      showPro={showPro}
    />
  );
}

describe("TierTable pro presence column", () => {
  it("links a champion's pro pick rate into the esports section", () => {
    table([row({ championKey: "Azir", name: "Azir", rank: 1, proPickRate: 41.4 })], true);

    const link = screen.getByRole("link", { name: /Azir in pro play/ });
    expect(link).toHaveAttribute("href", "/esports/champions/Azir");
    // Whole percent: a tier list row is a scan, and the extra digit is noise
    // next to a ranked pick rate that means something different.
    expect(link).toHaveTextContent("41%");
  });

  it("shows an em dash rather than 0% for a champion with no pro games", () => {
    table([row({ championKey: "Yuumi", name: "Yuumi", rank: 1, proPickRate: null })], true);

    // Absence from the sample is a different statement from "picked, never won",
    // and a 0% would be read as the second.
    expect(screen.queryByRole("link", { name: /in pro play/ })).toBeNull();
    expect(screen.getByTitle("No games in the pro sample")).toHaveTextContent("—");
  });

  it("omits the column entirely when the pro sample is not warm", () => {
    table([row({ championKey: "Azir", name: "Azir", rank: 1, proPickRate: 41.4 })], false);

    expect(screen.queryByRole("button", { name: /Pro/ })).toBeNull();
    expect(screen.queryByRole("link", { name: /in pro play/ })).toBeNull();
  });
});
