import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CreatorSessionBar } from "@/domains/creator/components/CreatorSessionBar";
import type { CreatorKit, OverlayPayload } from "@/domains/creator/types";

function kit(sessionStartedAt: string | null): CreatorKit {
  return {
    enabled: true,
    overlayKey: "1laQEG_dVsa6Dk2GCgxfKQ",
    sessionStartedAt,
    riotAccountId: null,
    displayName: null,
    streamSafe: false,
    delaySeconds: 0,
    theme: "dark",
    accentColor: "#C6FF3D",
    goalTier: null,
    goalDivision: null,
    twitchHandle: null,
    kickHandle: null,
    youtubeHandle: null,
  };
}

function payload(): OverlayPayload {
  return {
    identity: { name: "kaanproak0#TR1", region: "TR1", redacted: false },
    rank: { tier: "SILVER", division: "II", lp: 84, label: "Silver II", sessionLpDelta: 46 },
    session: {
      wins: 4,
      losses: 2,
      games: 6,
      winRate: 67,
      kills: 41,
      deaths: 28,
      assists: 63,
      kda: 3.71,
      startedAt: "2026-09-01T00:00:00.000Z",
    },
    lastGame: null,
    champions: [],
    goal: null,
    theme: "dark",
    accentColor: "#C6FF3D",
    delaySeconds: 0,
    asOf: "2026-09-01T09:00:00.000Z",
  };
}

function renderBar(sessionStartedAt: string | null) {
  return render(
    <CreatorSessionBar
      kit={kit(sessionStartedAt)}
      preview={payload()}
      busy={false}
      onStartSession={vi.fn()}
      onCountFromMidnight={vi.fn()}
      onRollKey={vi.fn()}
    />
  );
}

describe("CreatorSessionBar", () => {
  it("reads the session out of the live payload", () => {
    renderBar(null);

    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("4W 2L")).toBeInTheDocument();
    expect(screen.getByText("+46")).toBeInTheDocument();
  });

  it("says the count runs from midnight when no start was set", () => {
    renderBar(null);

    expect(screen.getByText("00:00")).toBeInTheDocument();
    expect(screen.getByText("since midnight")).toBeInTheDocument();
  });

  // Offering "count from midnight instead" while already counting from midnight
  // is a button that does nothing, so it only appears against a manual start.
  it("offers the midnight reset only against a manual start", () => {
    const midnight = renderBar(null);
    expect(screen.queryByText(/count from midnight/i)).not.toBeInTheDocument();
    midnight.unmount();

    // 19:42 local, so the printed clock does not depend on the runner's zone.
    const started = new Date(2026, 8, 1, 19, 42);
    renderBar(started.toISOString());

    expect(screen.getByText("19:42")).toBeInTheDocument();
    expect(screen.getByText("manual start")).toBeInTheDocument();
    expect(screen.getByText(/count from midnight/i)).toBeInTheDocument();
  });
});
