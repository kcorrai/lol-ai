import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChampionSelector } from "./ChampionSelector";

// The real hook fetches the catalogue; the selector's behaviour is what is under test.
vi.mock("@/hooks/useAllChampions", () => ({
  useAllChampions: () => ({
    data: [
      { id: 1, key: "Ahri", name: "Ahri", imageUrl: "", roles: ["MIDDLE"] },
      { id: 2, key: "Ashe", name: "Ashe", imageUrl: "", roles: ["BOTTOM"] },
      { id: 3, key: "Garen", name: "Garen", imageUrl: "", roles: ["TOP"] },
    ],
  }),
}));

vi.mock("@/components/ui/ChampionIcon", () => ({
  ChampionIcon: ({ name }: { name: string }) => <span data-testid="icon">{name}</span>,
}));

// jsdom has no layout, so it never implemented scrollIntoView. The list calls it to keep the
// highlighted option in view (same stub as MatchStoryPanel.test.tsx).
Element.prototype.scrollIntoView = vi.fn();

describe("ChampionSelector", () => {
  it("opens the list and reports its expanded state on the trigger", async () => {
    const user = userEvent.setup();
    render(<ChampionSelector value={null} onChange={vi.fn()} />);

    const trigger = screen.getByRole("button", { name: /select champion/i });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("points the search box at the option the arrow keys have highlighted", async () => {
    const user = userEvent.setup();
    render(<ChampionSelector value={null} onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /select champion/i }));
    const search = screen.getByRole("combobox", { name: "Search champions" });

    // Without aria-activedescendant the highlight moves silently for a screen reader.
    const first = screen.getAllByRole("option")[0];
    expect(search).toHaveAttribute("aria-activedescendant", first.id);

    await user.keyboard("{ArrowDown}");

    const second = screen.getAllByRole("option")[1];
    expect(search).toHaveAttribute("aria-activedescendant", second.id);
    expect(second.id).not.toBe(first.id);
  });

  it("lets a keyboard user clear the selection", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ChampionSelector value="Ahri" onChange={onChange} />);

    // The clear control used to be a bare icon with an onClick, which the tab order skipped
    // entirely — there was no way to undo a selection without a mouse.
    const clear = screen.getByRole("button", { name: "Clear Ahri" });
    clear.focus();
    expect(clear).toHaveFocus();

    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("offers no clear control when there is nothing to clear", () => {
    render(<ChampionSelector value={null} onChange={vi.fn()} />);

    expect(screen.queryByRole("button", { name: /^Clear / })).not.toBeInTheDocument();
  });

  it("hides the clear control while disabled", () => {
    render(<ChampionSelector value="Ahri" onChange={vi.fn()} disabled />);

    expect(screen.queryByRole("button", { name: "Clear Ahri" })).not.toBeInTheDocument();
  });

  it("does not count the empty state as a selectable option", async () => {
    const user = userEvent.setup();
    render(<ChampionSelector value={null} onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /select champion/i }));
    await user.type(screen.getByRole("combobox", { name: "Search champions" }), "zzzz");

    expect(screen.getByText("No results found")).toBeInTheDocument();
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });
});
