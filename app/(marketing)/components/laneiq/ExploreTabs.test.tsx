import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ExploreTabs, type ExploreTab } from "./ExploreTabs";

const TABS: readonly ExploreTab[] = [
  { key: "tools", label: "Free tools", hint: "Counters", content: <p>Counter picker</p> },
  { key: "academy", label: "Academy", hint: "Lessons", content: <p>61 lessons</p> },
  { key: "daily", label: "Daily game", hint: "Quiz", content: <p>Today's quiz</p> },
];

describe("ExploreTabs", () => {
  it("opens on the first tab and keeps the others in the page, hidden", () => {
    render(<ExploreTabs tabs={TABS} />);

    expect(screen.getByRole("tab", { name: /free tools/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByText("Counter picker")).toBeVisible();
    // Still rendered: the text stays in the served HTML and server data is not refetched.
    expect(screen.getByText("61 lessons")).not.toBeVisible();
  });

  it("shows the panel of the tab that was clicked", () => {
    render(<ExploreTabs tabs={TABS} />);

    fireEvent.click(screen.getByRole("tab", { name: /academy/i }));

    expect(screen.getByText("61 lessons")).toBeVisible();
    expect(screen.getByText("Counter picker")).not.toBeVisible();
  });

  it("moves between tabs with the arrow keys, wrapping at the ends", () => {
    render(<ExploreTabs tabs={TABS} />);
    const first = screen.getByRole("tab", { name: /free tools/i });

    fireEvent.keyDown(first, { key: "ArrowLeft" });

    const last = screen.getByRole("tab", { name: /daily game/i });
    expect(last).toHaveAttribute("aria-selected", "true");
    expect(last).toHaveFocus();
    expect(screen.getByText("Today's quiz")).toBeVisible();
  });
});
