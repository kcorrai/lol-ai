import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ArsenalTabs } from "./ArsenalTabs";
import { ARSENAL } from "./ArsenalPanels";

// framer-motion's AnimatePresence keeps the outgoing panel mounted for the length
// of its exit transition, which would make every "only one panel" assertion racy.
// The mock renders children straight through — this suite is about which panel is
// selected, not how it arrives.
vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_t, tag: string) => {
        const Comp = ({
          children,
          initial: _i,
          animate: _a,
          exit: _e,
          transition: _tr,
          whileInView: _w,
          viewport: _v,
          variants: _va,
          ...rest
        }: Record<string, unknown> & { children?: React.ReactNode }) => {
          const Tag = tag as keyof JSX.IntrinsicElements;
          return <Tag {...rest}>{children}</Tag>;
        };
        Comp.displayName = `motion.${tag}`;
        return Comp;
      },
    }
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
  useInView: () => true,
}));

const ADVANCE_MS = 7000;

const tab = (name: string) => screen.getByRole("tab", { name: new RegExp(name, "i") });
const selectedTab = () =>
  screen.getAllByRole("tab").find((t) => t.getAttribute("aria-selected") === "true");

describe("ArsenalTabs", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it("starts on the first pillar and marks only it selected", () => {
    render(<ArsenalTabs />);

    expect(screen.getAllByRole("tab")).toHaveLength(ARSENAL.length);
    expect(selectedTab()).toHaveTextContent(new RegExp(ARSENAL[0].title, "i"));
    expect(screen.getByRole("tabpanel")).toHaveTextContent(ARSENAL[0].headline);
  });

  it("swaps the panel when a tab is clicked", () => {
    render(<ArsenalTabs />);

    fireEvent.click(tab(ARSENAL[2].title));

    expect(tab(ARSENAL[2].title)).toHaveAttribute("aria-selected", "true");
    expect(tab(ARSENAL[0].title)).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tabpanel")).toHaveTextContent(ARSENAL[2].headline);
  });

  it("auto-advances until the reader shows intent, then stops for good", () => {
    render(<ArsenalTabs />);

    act(() => void vi.advanceTimersByTime(ADVANCE_MS));
    expect(screen.getByRole("tabpanel")).toHaveTextContent(ARSENAL[1].headline);

    // Hovering the panel is intent: the carousel must not steal it back.
    fireEvent.mouseEnter(screen.getByRole("tablist").parentElement as HTMLElement);
    act(() => void vi.advanceTimersByTime(ADVANCE_MS * 3));
    expect(screen.getByRole("tabpanel")).toHaveTextContent(ARSENAL[1].headline);
  });

  it("moves between tabs with the arrow keys and keeps one tab stop", () => {
    render(<ArsenalTabs />);

    fireEvent.keyDown(screen.getByRole("tablist"), { key: "ArrowDown" });
    expect(tab(ARSENAL[1].title)).toHaveAttribute("aria-selected", "true");
    expect(tab(ARSENAL[1].title)).toHaveAttribute("tabindex", "0");
    expect(tab(ARSENAL[0].title)).toHaveAttribute("tabindex", "-1");

    // Wraps backwards off the start rather than dead-ending.
    fireEvent.keyDown(screen.getByRole("tablist"), { key: "ArrowUp" });
    fireEvent.keyDown(screen.getByRole("tablist"), { key: "ArrowUp" });
    expect(tab(ARSENAL[ARSENAL.length - 1].title)).toHaveAttribute("aria-selected", "true");
  });
});
