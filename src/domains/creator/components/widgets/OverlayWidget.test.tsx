import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OverlayWidget } from "@/domains/creator/components/widgets/OverlayWidget";
import type { OverlayPayload } from "@/domains/creator/types";

function payload(overrides: Partial<OverlayPayload> = {}): OverlayPayload {
  return {
    identity: { name: "kaanproak0#TR1", region: "TR1", redacted: false },
    rank: {
      tier: "EMERALD",
      division: "II",
      lp: 45,
      label: "Emerald II",
      sessionLpDelta: 64,
    },
    session: {
      wins: 7,
      losses: 3,
      games: 10,
      winRate: 70,
      kills: 62,
      deaths: 31,
      assists: 74,
      kda: 4.39,
      startedAt: "2026-08-18T10:00:00.000Z",
    },
    lastGame: {
      championId: 103,
      championName: "Ahri",
      win: true,
      kills: 8,
      deaths: 2,
      assists: 11,
      csPerMinute: 7.4,
      durationSeconds: 1920,
      queueLabel: "Ranked Solo",
      endedAt: "2026-08-18T13:20:00.000Z",
    },
    champions: [
      { championId: 103, championName: "Ahri", games: 30, wins: 17, winRate: 57, kda: 3.42 },
    ],
    goal: {
      tier: "DIAMOND",
      division: "IV",
      label: "Diamond IV",
      progress: 0.4,
      lpRemaining: 155,
    },
    theme: "dark",
    accentColor: "#C6FF3D",
    delaySeconds: 0,
    asOf: "2026-08-18T14:00:00.000Z",
    ...overrides,
  };
}

describe("RankWidget", () => {
  it("shows the rank, LP and session delta", () => {
    render(<OverlayWidget widget="rank" payload={payload()} />);

    expect(screen.getByText("Emerald II")).toBeInTheDocument();
    expect(screen.getByText("45 LP")).toBeInTheDocument();
    expect(screen.getByText("+64 LP this session")).toBeInTheDocument();
  });

  it("omits the delta when there is nothing to compare against", () => {
    const p = payload();
    render(
      <OverlayWidget widget="rank" payload={{ ...p, rank: { ...p.rank!, sessionLpDelta: null } }} />
    );

    expect(screen.queryByText(/this session/)).not.toBeInTheDocument();
  });

  it("falls back to Unranked before the first snapshot", () => {
    render(<OverlayWidget widget="rank" payload={payload({ rank: null })} />);
    expect(screen.getByText("Unranked")).toBeInTheDocument();
  });

  // A redacted payload carries no Riot ID at all, so the widget cannot print one.
  it("prints no Riot ID when the payload was redacted", () => {
    const { container } = render(
      <OverlayWidget
        widget="rank"
        payload={payload({ identity: { name: null, region: "TR1", redacted: true } })}
      />
    );

    expect(container.textContent).not.toContain("kaanproak0");
  });
});

describe("SessionWidget", () => {
  it("shows the record and KDA", () => {
    render(<OverlayWidget widget="session" payload={payload()} />);

    expect(screen.getByText("7W")).toBeInTheDocument();
    expect(screen.getByText("3L")).toBeInTheDocument();
    expect(screen.getByText("70%")).toBeInTheDocument();
    expect(screen.getByText(/62\/31\/74 · 4\.39 KDA/)).toBeInTheDocument();
  });

  it("says so rather than printing zeroes before the first game", () => {
    render(
      <OverlayWidget
        widget="session"
        payload={payload({
          session: {
            wins: 0,
            losses: 0,
            games: 0,
            winRate: null,
            kills: 0,
            deaths: 0,
            assists: 0,
            kda: null,
            startedAt: "2026-08-18T10:00:00.000Z",
          },
        })}
      />
    );

    expect(screen.getByText("No games yet")).toBeInTheDocument();
  });
});

describe("LastGameWidget", () => {
  it("shows the champion, result and line", () => {
    render(<OverlayWidget widget="lastgame" payload={payload()} />);

    expect(screen.getByText("Ahri")).toBeInTheDocument();
    expect(screen.getByText("WIN")).toBeInTheDocument();
    expect(screen.getByText(/8\/2\/11 · 7\.4 CS\/min · 32:00/)).toBeInTheDocument();
  });

  it("marks a loss", () => {
    const p = payload();
    render(
      <OverlayWidget
        widget="lastgame"
        payload={{ ...p, lastGame: { ...p.lastGame!, win: false } }}
      />
    );

    expect(screen.getByText("LOSS")).toBeInTheDocument();
  });

  // What the delay produces when every finished game is still inside the window.
  it("says nothing yet when no game is old enough to show", () => {
    render(<OverlayWidget widget="lastgame" payload={payload({ lastGame: null })} />);
    expect(screen.getByText("Nothing yet")).toBeInTheDocument();
  });
});

describe("ChampionsWidget", () => {
  it("lists each champion with games, win rate and KDA", () => {
    render(<OverlayWidget widget="champions" payload={payload()} />);

    expect(screen.getByText("Ahri")).toBeInTheDocument();
    expect(screen.getByText("30g · 57% · 3.42 KDA")).toBeInTheDocument();
  });

  it("says so when nothing has been played", () => {
    render(<OverlayWidget widget="champions" payload={payload({ champions: [] })} />);
    expect(screen.getByText("No games yet")).toBeInTheDocument();
  });
});

describe("GoalWidget", () => {
  it("renders the bar at the payload's progress", () => {
    render(<OverlayWidget widget="goal" payload={payload()} />);

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "40");
    expect(screen.getByText("155 LP to go")).toBeInTheDocument();
  });

  it("says the goal is reached rather than showing zero LP to go", () => {
    const p = payload();
    render(
      <OverlayWidget
        widget="goal"
        payload={{ ...p, goal: { ...p.goal!, progress: 1, lpRemaining: 0 } }}
      />
    );

    expect(screen.getByText("Goal reached")).toBeInTheDocument();
  });

  it("says so when no goal was set", () => {
    render(<OverlayWidget widget="goal" payload={payload({ goal: null })} />);
    expect(screen.getByText("No goal set")).toBeInTheDocument();
  });
});

describe("the mark", () => {
  // Free on every plan is paid for by this being on the streamer's canvas.
  it("appears on every widget", () => {
    for (const widget of ["rank", "session", "lastgame", "champions", "goal"] as const) {
      const { container, unmount } = render(<OverlayWidget widget={widget} payload={payload()} />);
      expect(container.textContent).toContain("laneiq.gg");
      unmount();
    }
  });
});
