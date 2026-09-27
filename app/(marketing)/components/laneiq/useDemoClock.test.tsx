import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { useDemoClock } from "./useDemoClock";

const motion = vi.hoisted(() => ({ reduced: false }));
vi.mock("framer-motion", () => ({ useReducedMotion: () => motion.reduced }));

let fire: (visible: boolean) => void = () => {};

beforeEach(() => {
  vi.useFakeTimers();
  motion.reduced = false;
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: (entries: Array<{ isIntersecting: boolean }>) => void) {
        fire = (visible) => cb([{ isIntersecting: visible }]);
      }
      observe(): void {}
      disconnect(): void {}
    }
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function Probe(): React.ReactElement {
  const { ref, elapsed } = useDemoClock<HTMLDivElement>();
  return <div ref={ref}>{elapsed === null ? "still" : String(elapsed)}</div>;
}

describe("useDemoClock", () => {
  it("does not run until the demo is on screen", () => {
    render(<Probe />);
    act(() => vi.advanceTimersByTime(900));
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("runs while on screen and pauses where it was when scrolled away", () => {
    render(<Probe />);
    act(() => fire(true));
    act(() => vi.advanceTimersByTime(900));
    expect(screen.getByText("900")).toBeInTheDocument();

    act(() => fire(false));
    act(() => vi.advanceTimersByTime(900));
    expect(screen.getByText("900")).toBeInTheDocument();
  });

  it("holds the finished frame under reduced motion", () => {
    motion.reduced = true;
    render(<Probe />);
    act(() => fire(true));
    act(() => vi.advanceTimersByTime(900));
    expect(screen.getByText("still")).toBeInTheDocument();
  });
});
