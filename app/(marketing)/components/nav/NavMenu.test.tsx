import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NavMenu } from "./NavMenu";
import type { HeaderMenu } from "./headerNav";

const MENU: HeaderMenu = {
  key: "tools",
  label: "Tools",
  items: [
    { href: "/tools/counter-picker", label: "Counter picker", hint: "Who beats what" },
    { href: "/tools/tier-list", label: "Tier list", hint: "Every role" },
  ],
};

function open(): HTMLElement {
  const trigger = screen.getByRole("button", { name: /tools/i });
  fireEvent.click(trigger);
  return trigger;
}

beforeEach(() => {
  render(<NavMenu menu={MENU} />);
});

describe("NavMenu", () => {
  it("keeps the panel shut until it is asked for", () => {
    expect(screen.queryByRole("link", { name: /tier list/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tools/i })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("opens on click and lists every destination with its hint", () => {
    const trigger = open();

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /counter picker/i })).toHaveAttribute(
      "href",
      "/tools/counter-picker"
    );
    expect(screen.getByText("Who beats what")).toBeInTheDocument();
  });

  it("closes again on a second click", () => {
    const trigger = open();
    fireEvent.click(trigger);
    expect(screen.queryByRole("link", { name: /tier list/i })).not.toBeInTheDocument();
  });

  it("closes on Escape and hands focus back to the trigger", () => {
    // Escape that leaves focus at the top of the document restarts the tab order, which
    // costs a keyboard visitor the whole bar to get back to where they were.
    const trigger = open();
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("link", { name: /tier list/i })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes when the pointer goes somewhere else", () => {
    open();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("link", { name: /tier list/i })).not.toBeInTheDocument();
  });

  it("closes once a destination is chosen", () => {
    // Next's client router does not unmount this header between marketing pages, so a panel
    // that did not close itself would still be hanging over the page it navigated to.
    open();
    fireEvent.click(screen.getByRole("link", { name: /tier list/i }));
    expect(screen.queryByRole("link", { name: /tier list/i })).not.toBeInTheDocument();
  });

  it("moves focus down the panel with the arrow keys", () => {
    open();
    const first = screen.getByRole("link", { name: /counter picker/i });
    first.focus();

    fireEvent.keyDown(first, { key: "ArrowDown" });
    expect(screen.getByRole("link", { name: /tier list/i })).toHaveFocus();
  });

  it("wraps from the last item back to the first", () => {
    open();
    const last = screen.getByRole("link", { name: /tier list/i });
    last.focus();

    fireEvent.keyDown(last, { key: "ArrowDown" });
    expect(screen.getByRole("link", { name: /counter picker/i })).toHaveFocus();
  });
});
