import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreatorSettingsForm } from "@/domains/creator/components/CreatorSettingsForm";
import type { CreatorKit, OverlayPayload } from "@/domains/creator/types";

function kit(overrides: Partial<CreatorKit> = {}): CreatorKit {
  return {
    enabled: true,
    overlayKey: "1laQEG_dVsa6Dk2GCgxfKQ",
    sessionStartedAt: null,
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
    ...overrides,
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

describe("CreatorSettingsForm", () => {
  it("saves the delay picked from a chip", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<CreatorSettingsForm kit={kit()} preview={payload()} saving={false} onSave={onSave} />);

    await user.click(screen.getByRole("button", { name: "30s" }));
    await user.click(screen.getByRole("button", { name: /save settings/i }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ delaySeconds: 30 }));
  });

  // The picker is what a creator matching a brand colour needs; the presets are
  // only the fast path, so both have to write the same field.
  it("saves an accent from a preset swatch", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<CreatorSettingsForm kit={kit()} preview={payload()} saving={false} onSave={onSave} />);

    await user.click(screen.getByRole("button", { name: "Teal" }));
    await user.click(screen.getByRole("button", { name: /save settings/i }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ accentColor: "#3FE0C8" }));
  });

  it("keeps the free colour picker alongside the presets", () => {
    render(<CreatorSettingsForm kit={kit()} preview={payload()} saving={false} onSave={vi.fn()} />);

    expect(screen.getByLabelText("Custom accent colour")).toBeInTheDocument();
  });
});

describe("the live preview", () => {
  it("drops the Riot ID as soon as stream-safe mode is switched on", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CreatorSettingsForm kit={kit()} preview={payload()} saving={false} onSave={vi.fn()} />
    );

    expect(container.textContent).toContain("kaanproak0#TR1");

    await user.click(screen.getByRole("switch", { name: "Stream-safe mode" }));

    expect(container.textContent).not.toContain("kaanproak0#TR1");
    expect(screen.getByText(/Riot ID hidden/)).toBeInTheDocument();
  });

  it("warns while no broadcast delay is set", async () => {
    const user = userEvent.setup();
    render(<CreatorSettingsForm kit={kit()} preview={payload()} saving={false} onSave={vi.fn()} />);

    expect(screen.getByText(/No broadcast delay set/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "20s" }));

    expect(screen.getByText("Delayed by 20s to match your broadcast.")).toBeInTheDocument();
  });
});
