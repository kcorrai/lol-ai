import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { makeDraftChampion } from "@/test/draftFixtures";
import type { LegalityReason } from "@/domains/draft";
import type { DraftChampion } from "@/domains/draft/draftCatalog.types";
import { ChampionGrid } from "./ChampionGrid";

vi.mock("@/components/ui/ChampionIcon", () => ({
  ChampionIcon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}));

function champion(key: string, name: string, lanes: DraftChampion["lanes"]): DraftChampion {
  return makeDraftChampion(key, name, { lanes });
}

const ROSTER = [
  champion("Ahri", "Ahri", ["MIDDLE"]),
  champion("MissFortune", "Miss Fortune", ["BOTTOM"]),
  champion("Ornn", "Ornn", ["TOP"]),
  champion("Thresh", "Thresh", ["UTILITY"]),
];

function renderGrid(overrides: Partial<React.ComponentProps<typeof ChampionGrid>> = {}) {
  const props = {
    champions: ROSTER,
    reasonFor: () => null,
    selected: null,
    onSelect: vi.fn(),
    onCommit: vi.fn(),
    interactive: true,
    ...overrides,
  };
  render(<ChampionGrid {...props} />);
  return props;
}

describe("ChampionGrid", () => {
  it("shows every champion by default", () => {
    renderGrid();
    for (const c of ROSTER) expect(screen.getByTitle(c.name)).toBeInTheDocument();
  });

  it("narrows to a lane and back", async () => {
    renderGrid();
    await userEvent.click(screen.getByRole("button", { name: "Bot" }));
    expect(screen.getByTitle("Miss Fortune")).toBeInTheDocument();
    expect(screen.queryByTitle("Ahri")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Bot" }));
    expect(screen.getByTitle("Ahri")).toBeInTheDocument();
  });

  it("finds a champion by the shorthand people type", async () => {
    renderGrid();
    await userEvent.type(screen.getByLabelText("Search champions"), "mf");
    expect(screen.getByTitle("Miss Fortune")).toBeInTheDocument();
    expect(screen.queryByTitle("Ahri")).not.toBeInTheDocument();
  });

  it("says so when nothing matches", async () => {
    renderGrid();
    await userEvent.type(screen.getByLabelText("Search champions"), "zzzz");
    expect(screen.getByText("No champion matches that filter.")).toBeInTheDocument();
  });

  it("keeps unavailable champions visible, disabled, and explained", () => {
    const reasons: Record<string, LegalityReason> = {
      Ahri: "already-used",
      MissFortune: "series-locked",
      Ornn: "disabled",
    };
    renderGrid({ reasonFor: (key) => reasons[key] ?? null });

    // Visible on purpose — in a fearless series you need to see what is burned.
    expect(screen.getByTitle("Taken this game")).toBeDisabled();
    expect(screen.getByTitle("Used earlier in the series")).toBeDisabled();
    expect(screen.getByTitle("Disabled for this draft")).toBeDisabled();
    expect(screen.getByTitle("Thresh")).toBeEnabled();
  });

  it("selects on click but never commits on one", async () => {
    const { onSelect, onCommit } = renderGrid();
    await userEvent.click(screen.getByTitle("Ahri"));
    expect(onSelect).toHaveBeenCalledWith("Ahri");
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("ignores clicks when it is not your turn", async () => {
    const { onSelect } = renderGrid({ interactive: false });
    await userEvent.click(screen.getByTitle("Ahri"));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("commits the highlighted champion on Enter", async () => {
    const { onCommit } = renderGrid({ selected: "Ahri" });
    screen.getByRole("listbox", { name: "Champions" }).focus();
    await userEvent.keyboard("{Enter}");
    expect(onCommit).toHaveBeenCalled();
  });

  it("moves the selection with the arrow keys", async () => {
    const { onSelect } = renderGrid({ selected: "Ahri" });
    screen.getByRole("listbox", { name: "Champions" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onSelect).toHaveBeenCalledWith("MissFortune");
  });

  it("skips an unavailable champion rather than selecting it", async () => {
    const { onSelect } = renderGrid({
      selected: "Ahri",
      reasonFor: (key) => (key === "MissFortune" ? "already-used" : null),
    });
    screen.getByRole("listbox", { name: "Champions" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("sends / to the search box", async () => {
    renderGrid();
    screen.getByRole("listbox", { name: "Champions" }).focus();
    await userEvent.keyboard("/");
    expect(screen.getByLabelText("Search champions")).toHaveFocus();
  });
});
