import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useDailyQuest", () => ({ useDailyQuest: vi.fn() }));

import { useDailyQuest } from "@/hooks/useDailyQuest";
import { DailyQuestStrip } from "./DailyQuestStrip";

const QUEST = {
  dateKey: "2026-08-18",
  objectives: [
    {
      kind: "in_game" as const,
      id: "cs_per_min",
      title: "Hit 6.8 CS/min",
      hint: "Ranked Solo/Duo · 3 games today",
      href: "/improvement",
      ctaLabel: "Drill this",
      xpReward: 50,
      progress: 0.5,
      completed: false,
    },
    {
      kind: "on_site" as const,
      id: "quiz",
      title: "Solve today's champion puzzle",
      hint: "One puzzle, one guess ladder.",
      href: "/quiz",
      ctaLabel: "Play the daily",
      xpReward: 20,
      progress: 0,
      completed: false,
    },
  ],
  completed: false,
  streak: 5,
  xpReward: 70,
  expiresAt: "2026-08-19T00:00:00.000Z",
};

function mockQuest(data: unknown, isLoading = false): void {
  vi.mocked(useDailyQuest).mockReturnValue({ data, isLoading } as ReturnType<typeof useDailyQuest>);
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  mockQuest(QUEST);
});

describe("DailyQuestStrip", () => {
  it("shows both objectives with their rewards and the streak", () => {
    render(<DailyQuestStrip />);

    expect(screen.getByText("Hit 6.8 CS/min")).toBeInTheDocument();
    expect(screen.getByText("Solve today's champion puzzle")).toBeInTheDocument();
    expect(screen.getByText("+50 XP")).toBeInTheDocument();
    expect(screen.getByText(/5 day quest streak/)).toBeInTheDocument();
  });

  it("links each unfinished objective to where it gets done", () => {
    render(<DailyQuestStrip />);

    expect(screen.getByText(/Play the daily/).closest("a")).toHaveAttribute("href", "/quiz");
    expect(screen.getByText(/Drill this/).closest("a")).toHaveAttribute("href", "/improvement");
  });

  it("drops the call to action once an objective is done", () => {
    mockQuest({
      ...QUEST,
      objectives: [{ ...QUEST.objectives[1], progress: 1, completed: true }],
    });
    render(<DailyQuestStrip />);

    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.queryByText(/Play the daily/)).not.toBeInTheDocument();
  });

  it("says how to start a streak rather than showing a zero", () => {
    mockQuest({ ...QUEST, streak: 0 });
    render(<DailyQuestStrip />);

    expect(screen.getByText(/No streak yet/)).toBeInTheDocument();
  });

  it("hides for the rest of the day when dismissed", () => {
    const { unmount } = render(<DailyQuestStrip />);
    fireEvent.click(screen.getByLabelText("Hide today's quest"));
    expect(screen.queryByText("Hit 6.8 CS/min")).not.toBeInTheDocument();

    // The dismissal has to survive a reload, or it is not a dismissal.
    unmount();
    render(<DailyQuestStrip />);
    expect(screen.queryByText("Hit 6.8 CS/min")).not.toBeInTheDocument();
  });

  it("comes back the next day", () => {
    localStorage.setItem("laneiq.dailyQuest.dismissed", "2026-08-17");
    render(<DailyQuestStrip />);

    expect(screen.getByText("Hit 6.8 CS/min")).toBeInTheDocument();
  });

  it("renders nothing when the quest could not be loaded", () => {
    mockQuest(undefined);
    const { container } = render(<DailyQuestStrip />);

    expect(container).toBeEmptyDOMElement();
  });
});
