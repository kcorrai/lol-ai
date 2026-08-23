import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { MatchStoryPanel } from "./MatchStoryPanel";
import type {
  MatchStory,
  MatchStoryEvent,
  MatchStoryFrame,
  MatchStoryParticipant,
} from "@/domains/match/types/matchStory.types";

const useMatchStory = vi.hoisted(() => vi.fn());
vi.mock("@/hooks/useMatchStory", () => ({ useMatchStory }));

const ME: MatchStoryParticipant = {
  puuid: "puuid-me",
  championName: "Ahri",
  teamId: 100,
  position: "MIDDLE",
  gameName: "Me",
  tagLine: "NA1",
};

function frame(minute: number, teamGoldDiff: number): MatchStoryFrame {
  return {
    minute,
    players: [{ puuid: ME.puuid, totalGold: 3000 + minute * 300, level: 6, cs: minute * 8 }],
    teamTotals: [
      { teamId: 100, totalGold: 15_000 },
      { teamId: 200, totalGold: 15_000 - teamGoldDiff },
    ],
    teamGoldDiff,
  };
}

const KILL: MatchStoryEvent = {
  kind: "CHAMPION_KILL",
  timestampMs: 120_000,
  minute: 2,
  actor: ME,
  position: { x: 7000, y: 7000 },
  payload: { killerId: 7, killerPuuid: "puuid-them", assistingParticipantIds: [], bounty: 300 },
};

const WARD: MatchStoryEvent = {
  kind: "WARD_PLACED",
  timestampMs: 240_000,
  minute: 4,
  actor: ME,
  position: { x: 5000, y: 9000 },
  payload: { wardType: "CONTROL_WARD" },
};

const STORY: MatchStory = {
  hasTimeline: true,
  participants: [ME],
  frames: [frame(0, 0), frame(2, 1200), frame(4, -900)],
  events: [KILL, WARD],
};

function renderPanel(state: Partial<{ data: MatchStory; isLoading: boolean; isError: boolean }>) {
  useMatchStory.mockReturnValue({
    data: state.data,
    isLoading: state.isLoading ?? false,
    isError: state.isError ?? false,
  });
  render(
    <MatchStoryPanel matchId="match-1" userPuuid={ME.puuid} durationSeconds={300} won={true} />
  );
}

function feed(): HTMLElement {
  return screen.getByRole("list");
}

beforeAll(() => {
  // jsdom has no layout, so it never implemented scrollIntoView. The feed calls it to keep the
  // current row visible; without a stub every populated render would throw.
  Element.prototype.scrollIntoView = vi.fn();
});

describe("MatchStoryPanel", () => {
  it("shows a skeleton while the story is loading", () => {
    renderPanel({ isLoading: true });
    expect(screen.getByText("Loading")).toBeInTheDocument();
    expect(screen.queryByLabelText("Match minute")).not.toBeInTheDocument();
  });

  it("treats a match with no captured timeline as a state, not an error", () => {
    renderPanel({ data: { hasTimeline: false } });
    expect(screen.getByText("No record")).toBeInTheDocument();
    expect(screen.getByText(/No minute-by-minute record for this match/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Match minute")).not.toBeInTheDocument();
  });

  it("opens at the first minute, with the match ahead of the playhead", () => {
    renderPanel({ data: STORY });
    expect(screen.getByText("5m · Victory")).toBeInTheDocument();
    expect(screen.getByLabelText("Match minute")).toHaveValue("0");
    expect(screen.getByText(/Nothing has happened yet/)).toBeInTheDocument();
  });

  it("reads out the gold difference for the minute scrubbed to", async () => {
    renderPanel({ data: STORY });
    const scrubber = screen.getByLabelText("Match minute");

    fireEvent.change(scrubber, { target: { value: "2" } });
    expect(screen.getByText("1,200g BLUE · 2m")).toBeInTheDocument();

    fireEvent.change(scrubber, { target: { value: "4" } });
    expect(screen.getByText("900g RED · 4m")).toBeInTheDocument();
  });

  it("reveals events up to the playhead and no further", async () => {
    renderPanel({ data: STORY });
    fireEvent.change(screen.getByLabelText("Match minute"), { target: { value: "2" } });

    expect(within(feed()).getByText(/Ahri was taken down/)).toBeInTheDocument();
    expect(within(feed()).queryByText(/placed a control ward/)).not.toBeInTheDocument();
  });

  it("steps to the next minute that actually holds an event", async () => {
    const user = userEvent.setup();
    renderPanel({ data: STORY });

    await user.click(screen.getByLabelText("Jump to the next event"));
    expect(screen.getByLabelText("Match minute")).toHaveValue("2");

    await user.click(screen.getByLabelText("Jump to the next event"));
    expect(screen.getByLabelText("Match minute")).toHaveValue("4");

    // Nothing after the last event — the playhead holds rather than running to the end.
    await user.click(screen.getByLabelText("Jump to the next event"));
    expect(screen.getByLabelText("Match minute")).toHaveValue("4");

    await user.click(screen.getByLabelText("Jump to the previous event"));
    expect(screen.getByLabelText("Match minute")).toHaveValue("2");
  });

  it("drops a kind from the feed when its chip is turned off", async () => {
    const user = userEvent.setup();
    renderPanel({ data: STORY });
    fireEvent.change(screen.getByLabelText("Match minute"), { target: { value: "5" } });
    expect(within(feed()).getByText(/placed a control ward/)).toBeInTheDocument();

    const chip = screen.getByRole("button", { name: /Ward placed/ });
    await user.click(chip);

    expect(chip).toHaveAttribute("aria-pressed", "false");
    expect(within(feed()).queryByText(/placed a control ward/)).not.toBeInTheDocument();
    expect(within(feed()).getByText(/Ahri was taken down/)).toBeInTheDocument();
  });

  it("skips a filtered-out kind when stepping between events", async () => {
    const user = userEvent.setup();
    renderPanel({ data: STORY });

    await user.click(screen.getByRole("button", { name: /Kill$/ }));
    await user.click(screen.getByLabelText("Jump to the next event"));

    // Minute 2 is the kill, which is off — the step lands on the ward at 4 instead.
    expect(screen.getByLabelText("Match minute")).toHaveValue("4");
  });
});
