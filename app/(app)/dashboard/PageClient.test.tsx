import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Data hooks the page itself reads.
vi.mock("@/hooks/useRiotAccounts", () => ({ useRiotAccounts: vi.fn() }));
vi.mock("@/hooks/usePerformanceProfile", () => ({ usePerformanceProfile: vi.fn() }));
vi.mock("@/hooks/useSubscription", () => ({ useSubscription: vi.fn() }));
vi.mock("@/hooks/useAutoSync", () => ({ useAutoSync: vi.fn() }));

// Hooks the LaneIQ decision panels read. These stay real components — they are
// what this test exists to cover.
vi.mock("@/hooks/useTiltStatus", () => ({ useTiltStatus: vi.fn() }));
vi.mock("@/hooks/useWarmupStatus", () => ({ useWarmupStatus: vi.fn() }));
vi.mock("@/hooks/useTodaysFocus", () => ({ useTodaysFocus: vi.fn() }));

// Carried-over widgets each fetch on their own; stub them to keep this a test of
// the dashboard's composition rather than of every widget underneath it. The
// factories must be self-contained — vi.mock is hoisted above any local helper.
vi.mock("@/components/dashboard/DailyMomentumChart", () => ({
  DailyMomentumChart: () => <div data-testid="DailyMomentumChart" />,
}));
vi.mock("@/components/dashboard/PatchImpactWidget", () => ({
  PatchImpactWidget: () => <div data-testid="PatchImpactWidget" />,
}));
vi.mock("@/components/dashboard/MetaRecommendationsWidget", () => ({
  MetaRecommendationsWidget: () => <div data-testid="MetaRecommendationsWidget" />,
}));
vi.mock("@/components/dashboard/WeekSummaryWidget", () => ({
  WeekSummaryWidget: () => <div data-testid="WeekSummaryWidget" />,
}));
vi.mock("@/components/dashboard/laneiq/duo/DuoPanel", () => ({
  DuoPanel: () => <div data-testid="DuoPanel" />,
}));
vi.mock("@/components/dashboard/DevRestartOnboarding", () => ({
  DevRestartOnboarding: () => <div data-testid="DevRestartOnboarding" />,
}));
// Reads the app router, which is not mounted here. Its own behaviour is covered by
// ClaimAccountOnArrival.test.tsx.
vi.mock("@/components/dashboard/ClaimAccountOnArrival", () => ({
  ClaimAccountOnArrival: () => <div data-testid="ClaimAccountOnArrival" />,
}));
vi.mock("@/components/dashboard/laneiq/EngagementStrip", () => ({
  EngagementStrip: () => <div data-testid="EngagementStrip" />,
}));
vi.mock("@/components/dashboard/laneiq/DailyQuestStrip", () => ({
  DailyQuestStrip: () => <div data-testid="DailyQuestStrip" />,
}));
vi.mock("@/components/ui/EmailVerificationBanner", () => ({
  EmailVerificationBanner: () => <div data-testid="EmailVerificationBanner" />,
}));
vi.mock("@/domains/analysis/components/RecentMatchList", () => ({
  RecentMatchList: () => <div data-testid="RecentMatchList" />,
}));
vi.mock("@/domains/analysis/components/WinrateTrendWidget", () => ({
  WinrateTrendWidget: () => <div data-testid="WinrateTrendWidget" />,
}));
vi.mock("@/domains/analysis/components/PerformanceTrendChart", () => ({
  PerformanceTrendChart: () => <div data-testid="PerformanceTrendChart" />,
}));
vi.mock("@/domains/analysis/components/ImprovementPlanWidget", () => ({
  ImprovementPlanWidget: () => <div data-testid="ImprovementPlanWidget" />,
}));
vi.mock("@/domains/analysis/components/HabitDetectionWidget", () => ({
  HabitDetectionCard: () => <div data-testid="HabitDetectionCard" />,
}));
vi.mock("@/domains/analysis/components/TiltBreakModal", () => ({
  TiltBreakModal: () => <div data-testid="TiltBreakModal" />,
}));

import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { usePerformanceProfile } from "@/hooks/usePerformanceProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { useTiltStatus } from "@/hooks/useTiltStatus";
import { useWarmupStatus } from "@/hooks/useWarmupStatus";
import { useTodaysFocus } from "@/hooks/useTodaysFocus";
import DashboardPage from "./PageClient";

const ACCOUNT = {
  id: "acc-1",
  gameName: "DevPlayer",
  tagLine: "EUW",
  region: "euw1",
  summonerLevel: 312,
  profileIconId: 5,
  isPrimary: true,
  lastSyncedAt: new Date(),
};

const MATCH = {
  matchDbId: "m1",
  riotMatchId: "EUW1_1",
  queueType: "RANKED_SOLO_5x5",
  champion: "LeeSin",
  position: "JUNGLE",
  won: false,
  gameDurationMinutes: 31.4,
  kills: 3,
  deaths: 7,
  assists: 9,
  csPerMinute: 5.4,
  visionScore: 28,
  goldPerMinute: 371,
  damageShare: 0.21,
  notableEvents: [],
  itemIds: [],
  gameStart: new Date().toISOString(),
  summonerSpell1: 4,
  summonerSpell2: 11,
  runePrimaryKeystone: null,
  runeSecondaryPath: null,
  teamObjectives: null,
};

const PROFILE = {
  riotAccountId: "acc-1",
  gamesAnalyzed: 20,
  avgMetrics: {
    kda: 2.4,
    csPerMinute: 5.8,
    damageShare: 0.24,
    killParticipation: 0.68,
    visionScorePerMinute: 0.71,
    avgGoldPerMinute: 380,
    avgDeathsPerGame: 6.1,
  },
  playstyle: "aggressive" as const,
  strongestArea: "Early skirmishing",
  weakestArea: "Objective setup",
  recentMatches: [MATCH],
  winRate: 45,
  deathCluster: "early_game" as const,
  csConsistency: "medium" as const,
  visionConsistency: "low" as const,
  mostPlayedChampions: ["LeeSin"],
  delta: { winRate: 8.5, kda: 0.3, csPerMinute: -0.2, visionScore: 4 },
};

function query(data: unknown, extra: Record<string, unknown> = {}) {
  return { data, isLoading: false, error: null, ...extra } as never;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(useRiotAccounts).mockReturnValue(query([ACCOUNT]));
  vi.mocked(usePerformanceProfile).mockReturnValue(query(PROFILE));
  vi.mocked(useSubscription).mockReturnValue(query({ plan: "pro" }));
  vi.mocked(useTiltStatus).mockReturnValue(
    query({
      level: "focused",
      score: 82,
      lossStreak: 0,
      recentWinRate: 0.55,
      kdaTrend: "stable",
      message: "Steady.",
      gamesAnalyzed: 20,
    })
  );
  vi.mocked(useWarmupStatus).mockReturnValue(
    query({
      status: "warmed_up",
      message: "You played a normal first.",
      firstRankedResult: "win",
      withWarmupWinRate: 61,
      withoutWarmupWinRate: 44,
    })
  );
  vi.mocked(useTodaysFocus).mockReturnValue(
    query({
      action: "Ward the river before objectives spawn",
      howTo: "Drop the trinket at 2:40 and 8:40.",
      expectedImpact: "+6 LP/10",
      timeframe: "3 games",
      reportedAt: new Date().toISOString(),
    })
  );
});

describe("DashboardPage", () => {
  it("renders all three layers when data is present", () => {
    render(<DashboardPage />);

    // Layer 1 — the decision panel replaced three separate widgets with one verdict.
    expect(screen.getByText("Ready to queue")).toBeInTheDocument();
    expect(screen.getByText("Ward the river before objectives spawn")).toBeInTheDocument();
    expect(screen.getByText(/LeeSin · Jungle/)).toBeInTheDocument();

    // Layer 2 and 3 rules.
    expect(screen.getByText("// Analysis · last 20 games")).toBeInTheDocument();
    expect(screen.getByText("// Match log")).toBeInTheDocument();
    expect(screen.getByTestId("RecentMatchList")).toBeInTheDocument();
  });

  it("leads the aggregates with the delta, not the raw value", () => {
    render(<DashboardPage />);

    expect(screen.getByText("+8.5%")).toBeInTheDocument();
    expect(screen.getByText(/now 45.0% · was 36.5%/)).toBeInTheDocument();
  });

  it("shows the connect prompt when no account is linked", () => {
    vi.mocked(useRiotAccounts).mockReturnValue(query([]));

    render(<DashboardPage />);

    expect(screen.getByText("Connect your Riot account")).toBeInTheDocument();
    expect(screen.queryByText("// Match log")).not.toBeInTheDocument();
  });

  it("shows the syncing state when the account has no matches yet", () => {
    vi.mocked(usePerformanceProfile).mockReturnValue(query({ ...PROFILE, recentMatches: [] }));

    render(<DashboardPage />);

    expect(screen.getByText(/Matches are coming in/)).toBeInTheDocument();
    // The syncing state must offer a way forward rather than ask the player to wait.
    expect(screen.getByRole("link", { name: /Get my first report/ })).toBeInTheDocument();
  });

  it("shows the error state when the profile request fails", () => {
    vi.mocked(usePerformanceProfile).mockReturnValue(
      query(undefined, { error: new Error("boom") })
    );

    render(<DashboardPage />);

    expect(screen.getByText(/Riot's match API stopped responding/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Re-sync/ })).toBeInTheDocument();
  });

  it("marks a free plan in the header", () => {
    vi.mocked(useSubscription).mockReturnValue(query({ plan: "free" }));

    render(<DashboardPage />);

    expect(screen.getByText("Free")).toBeInTheDocument();
  });
});
