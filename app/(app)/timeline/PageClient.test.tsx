import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useCareerTimeline", () => ({ useCareerTimeline: vi.fn() }));
vi.mock("@/hooks/useRiotAccounts", () => ({ useRiotAccounts: vi.fn() }));
vi.mock("@/lib/stores/uiStore", () => ({ useUIStore: vi.fn() }));

import { useCareerTimeline } from "@/hooks/useCareerTimeline";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { useUIStore } from "@/lib/stores/uiStore";
import PageClient from "./PageClient";

const ACCOUNT_ID = "8f1c1b2e-0000-4000-8000-0000000000bb";

function event(id: string, group: string, title: string, at: string) {
  return {
    id,
    kind: "record",
    group,
    at,
    title,
    detail: null,
    tone: "neutral",
    weight: 50,
    href: null,
  };
}

const TIMELINE = {
  summary: {
    gameName: "kaanproak0",
    tagLine: "TR1",
    summonerLevel: 148,
    firstTrackedAt: "2026-07-11T10:00:00.000Z",
    lastTrackedAt: "2026-08-09T10:00:00.000Z",
    totalGames: 90,
    totalHours: 42,
    currentRank: "Silver II",
    peakRank: "Silver II",
    topMastery: [{ championId: 157, championName: "Yasuo", level: 7, points: 482_310 }],
  },
  bands: [
    {
      key: "2026-08",
      label: "August 2026",
      games: 22,
      wins: 14,
      winRate: 64,
      lpDelta: 21,
      rankAtClose: "Silver II",
      events: [
        event("r1", "records", "Best farming game", "2026-08-07T10:00:00.000Z"),
        event("c1", "champions", "Your Alistar era began", "2026-08-01T10:00:00.000Z"),
      ],
    },
    {
      key: "2026-07",
      label: "July 2026",
      games: 68,
      wins: 37,
      winRate: 54,
      lpDelta: null,
      rankAtClose: null,
      events: [event("r2", "records", "Most kills in a game", "2026-07-16T10:00:00.000Z")],
    },
  ],
  lpSeries: [],
  trimmed: 0,
};

function mockTimeline(data: unknown, state: { isLoading?: boolean; isError?: boolean } = {}): void {
  vi.mocked(useCareerTimeline).mockReturnValue({
    data,
    isLoading: state.isLoading ?? false,
    isError: state.isError ?? false,
  } as ReturnType<typeof useCareerTimeline>);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useRiotAccounts).mockReturnValue({
    data: [{ id: ACCOUNT_ID }],
    isLoading: false,
  } as ReturnType<typeof useRiotAccounts>);
  vi.mocked(useUIStore).mockReturnValue(ACCOUNT_ID);
  mockTimeline(TIMELINE);
});

describe("Career timeline page", () => {
  it("leads with who the career belongs to and how deep the record goes", () => {
    render(<PageClient />);

    expect(screen.getByText("kaanproak0")).toBeInTheDocument();
    expect(screen.getByText(/Tracking since/)).toBeInTheDocument();
    expect(screen.getByText("90")).toBeInTheDocument();
  });

  it("renders every month newest first", () => {
    render(<PageClient />);

    expect(screen.getByText("// August 2026")).toBeInTheDocument();
    expect(screen.getByText("// July 2026")).toBeInTheDocument();
  });

  it("shows all-time mastery as its own thing, not as recent form", () => {
    render(<PageClient />);

    expect(screen.getByText("Yasuo")).toBeInTheDocument();
    expect(screen.getByText("482,310")).toBeInTheDocument();
  });

  it("narrows to one lens and drops the months with nothing under it", () => {
    render(<PageClient />);
    fireEvent.click(screen.getByRole("tab", { name: "Champions" }));

    expect(screen.getByText("Your Alistar era began")).toBeInTheDocument();
    expect(screen.queryByText("Best farming game")).not.toBeInTheDocument();
    // July has records but no champion era, so it goes away entirely under this lens.
    expect(screen.queryByText("// July 2026")).not.toBeInTheDocument();
  });

  it("says so rather than showing a blank page when a lens matches nothing", () => {
    mockTimeline({ ...TIMELINE, bands: [{ ...TIMELINE.bands[0], events: [] }] });
    render(<PageClient />);
    fireEvent.click(screen.getByRole("tab", { name: "Rank" }));

    expect(screen.getByText("Nothing under that filter")).toBeInTheDocument();
  });

  it("asks for an account before it asks for anything else", () => {
    vi.mocked(useRiotAccounts).mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useRiotAccounts>);
    vi.mocked(useUIStore).mockReturnValue(null);
    render(<PageClient />);

    expect(screen.getByText("No account linked yet")).toBeInTheDocument();
  });

  it("does not pretend an empty history is a loading one", () => {
    mockTimeline({
      ...TIMELINE,
      summary: { ...TIMELINE.summary, totalGames: 0, firstTrackedAt: null },
      bands: [],
    });
    render(<PageClient />);

    expect(screen.getByText("Nothing to look back on yet")).toBeInTheDocument();
  });

  it("reports a failure instead of an empty career", () => {
    mockTimeline(undefined, { isError: true });
    render(<PageClient />);

    expect(screen.getByText("Your timeline could not be built")).toBeInTheDocument();
  });
});
