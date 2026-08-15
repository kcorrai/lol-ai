import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useDuo", () => ({
  useDuoSynergy: vi.fn(),
  useDuoQuests: vi.fn(),
  useDuoCandidates: vi.fn(),
  useSetDuo: vi.fn(),
  useClearDuo: vi.fn(),
}));
vi.mock("@/components/dashboard/DuoPicker", () => ({
  DuoPicker: () => <div data-testid="DuoPicker" />,
}));

import {
  useClearDuo,
  useDuoCandidates,
  useDuoQuests,
  useDuoSynergy,
  useSetDuo,
} from "@/hooks/useDuo";
import { DuoPanel } from "./DuoPanel";

const PARTNER = { puuid: "p", gameName: "Mate", tagLine: "TR1", games: 73, wins: 37, winRate: 51, lastPlayedAt: null };

const SYNERGY = {
  partner: PARTNER,
  hasEnoughData: true,
  together: { games: 73, wins: 37, winRate: 51 },
  apart: { games: 32, wins: 22, winRate: 69 },
  synergyDelta: -18,
  streak: -2,
  averagesTogether: { kda: 3.63, deaths: 5.8, visionScore: 24.3, csPerMinute: 4.3 },
  averagesApart: { kda: 5.88, deaths: 3.4, visionScore: 18.4, csPerMinute: 7 },
  championPairs: [
    { ownChampion: "Alistar", partnerChampion: "Caitlyn", games: 9, wins: 7, winRate: 78 },
  ],
  rolePairs: [{ ownPosition: "UTILITY", partnerPosition: "BOTTOM", games: 25, winRate: 52 }],
  recentShared: [
    {
      matchId: "m1",
      playedAt: "2026-08-09T19:00:00Z",
      won: false,
      ownChampion: "Alistar",
      partnerChampion: "Caitlyn",
      kills: 1,
      deaths: 6,
      assists: 12,
    },
  ],
};

function query(data: unknown, extra: Record<string, unknown> = {}) {
  return { data, isLoading: false, error: null, ...extra } as never;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(useDuoSynergy).mockReturnValue(query(SYNERGY));
  vi.mocked(useDuoQuests).mockReturnValue(query(null));
  vi.mocked(useDuoCandidates).mockReturnValue(query([]));
  vi.mocked(useSetDuo).mockReturnValue({ mutate: vi.fn(), isPending: false, error: null } as never);
  vi.mocked(useClearDuo).mockReturnValue({ mutate: vi.fn(), isPending: false } as never);
});

describe("DuoPanel", () => {
  it("leads with the win-rate difference the partner makes", () => {
    render(<DuoPanel riotAccountId="acc-1" />);

    expect(screen.getByText("-18")).toBeInTheDocument();
    expect(screen.getByText("You win more without them")).toBeInTheDocument();
    expect(screen.getByText("51% · 73g")).toBeInTheDocument();
    expect(screen.getByText("69% · 32g")).toBeInTheDocument();
  });

  it("calls a lifting duo a lifting duo", () => {
    vi.mocked(useDuoSynergy).mockReturnValue(
      query({ ...SYNERGY, synergyDelta: 13, together: { games: 40, wins: 25, winRate: 62 } }),
    );

    render(<DuoPanel riotAccountId="acc-1" />);

    expect(screen.getByText("+13")).toBeInTheDocument();
    expect(screen.getByText("This duo lifts you")).toBeInTheDocument();
  });

  it("refuses to print a verdict off too few games", () => {
    vi.mocked(useDuoSynergy).mockReturnValue(
      query({
        ...SYNERGY,
        hasEnoughData: false,
        together: { games: 3, wins: 3, winRate: 100 },
        synergyDelta: 55,
      }),
    );

    render(<DuoPanel riotAccountId="acc-1" />);

    expect(screen.queryByText("+55")).not.toBeInTheDocument();
    expect(screen.getByText(/A verdict needs five/)).toBeInTheDocument();
    // The supporting detail is hidden too — it would be built on the same thin sample.
    expect(screen.queryByText("// Best together")).not.toBeInTheDocument();
  });

  it("says so rather than implying parity when they have never played apart", () => {
    vi.mocked(useDuoSynergy).mockReturnValue(
      query({ ...SYNERGY, synergyDelta: null, apart: { games: 0, wins: 0, winRate: null } }),
    );

    render(<DuoPanel riotAccountId="acc-1" />);

    expect(screen.getByText("No solo games to compare against")).toBeInTheDocument();
    expect(screen.getByText("no solo games")).toBeInTheDocument();
  });

  it("shows what changes about the player's own game", () => {
    render(<DuoPanel riotAccountId="acc-1" />);

    expect(screen.getByText("// Your game with them")).toBeInTheDocument();
    expect(screen.getByText("was 5.88")).toBeInTheDocument();
    expect(screen.getByText("-2.25")).toBeInTheDocument();
  });

  it("shows the champion and role pairings", () => {
    render(<DuoPanel riotAccountId="acc-1" />);

    expect(screen.getByText(/Alistar/)).toBeInTheDocument();
    expect(screen.getByText("78%")).toBeInTheDocument();
    expect(screen.getByText(/Support/)).toBeInTheDocument();
  });

  it("shows a losing run on the identity line", () => {
    render(<DuoPanel riotAccountId="acc-1" />);

    expect(screen.getByText("2 losses in a row")).toBeInTheDocument();
  });

  it("renders this week's quests with their progress", () => {
    vi.mocked(useDuoQuests).mockReturnValue(
      query({
        partner: PARTNER,
        weekStart: "2026-08-10T00:00:00.000Z",
        weekEnd: "2099-01-01T00:00:00.000Z",
        xpAwarded: 0,
        quests: [
          {
            key: "wins_together",
            label: "Carry each other",
            detail: "Win 3 games together this week",
            progress: 2,
            target: 3,
            completed: false,
            xpReward: 80,
            periodEnd: "2099-01-01T00:00:00.000Z",
          },
        ],
      }),
    );

    render(<DuoPanel riotAccountId="acc-1" />);

    expect(screen.getByText("Win 3 games together this week")).toBeInTheDocument();
    expect(screen.getByText("2/3")).toBeInTheDocument();
  });

  it("offers the picker when no duo is marked", () => {
    vi.mocked(useDuoSynergy).mockReturnValue(query(null));

    render(<DuoPanel riotAccountId="acc-1" />);

    expect(screen.getByTestId("DuoPicker")).toBeInTheDocument();
    expect(screen.queryByText("// Verdict")).not.toBeInTheDocument();
  });

  it("keeps the failure to itself when the request errors", () => {
    vi.mocked(useDuoSynergy).mockReturnValue(query(undefined, { error: new Error("boom") }));

    render(<DuoPanel riotAccountId="acc-1" />);

    expect(screen.getByText(/rest of the dashboard is unaffected/)).toBeInTheDocument();
  });
});
