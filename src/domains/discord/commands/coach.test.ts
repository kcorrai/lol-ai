import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/domains/discord/linkService", () => ({ getLinkedIdentity: vi.fn() }));
vi.mock("@/domains/analysis", () => ({
  getActiveHabits: vi.fn(),
  getPlayerPerformanceProfile: vi.fn(),
}));
vi.mock("@/lib/auth/authorization", () => ({ checkIsPro: vi.fn() }));

import { coachCommand } from "@/domains/discord/commands/coach";
import { getLinkedIdentity } from "@/domains/discord/linkService";
import type { BotRequest } from "@/domains/discord/request";
import { getActiveHabits, getPlayerPerformanceProfile } from "@/domains/analysis";
import type { DetectedHabit, PlayerPerformanceProfile } from "@/domains/analysis";
import { checkIsPro } from "@/lib/auth/authorization";
import type { ContainerComponent, DiscordMessagePayload } from "@/lib/discord/componentTypes";
import { MessageFlags } from "@/lib/discord/interactionTypes";

const REQ: BotRequest = {
  command: "coach",
  discordUserId: "u1",
  discordUsername: "kaan",
};

const IDENTITY = {
  userId: "user-1",
  discordUsername: "kaan",
  riotAccount: { id: "ra-1", gameName: "Kaan", tagLine: "TR1", region: "tr1" },
};

const PROFILE = {
  riotAccountId: "ra-1",
  gamesAnalyzed: 20,
  winRate: 55,
  strongestArea: "Vision",
  weakestArea: "CS",
  mostPlayedChampions: ["Ahri"],
} as unknown as PlayerPerformanceProfile;

const HABIT = {
  id: "h1",
  habitType: "late_deaths",
  displayName: "Dying after 20 minutes",
  severity: "high",
  weekCount: 4,
  message: "Your deaths cluster once the map opens up.",
  evidence: [],
  isResolved: false,
  firstDetected: "",
  lastDetected: "",
} as DetectedHabit;

function body(payload: DiscordMessagePayload): string {
  return JSON.stringify((payload.components[0] as ContainerComponent).components);
}

describe("coachCommand", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getLinkedIdentity).mockResolvedValue(IDENTITY);
    vi.mocked(checkIsPro).mockResolvedValue(true);
    vi.mocked(getPlayerPerformanceProfile).mockResolvedValue(PROFILE);
    vi.mocked(getActiveHabits).mockResolvedValue([HABIT]);
  });

  it("reads the linked account's habits and never asks Riot for anything", async () => {
    const payload = await coachCommand(REQ);

    expect(getPlayerPerformanceProfile).toHaveBeenCalledWith("ra-1", 20);
    expect(getActiveHabits).toHaveBeenCalledWith("ra-1");
    expect(body(payload)).toContain("Dying after 20 minutes");
    expect(body(payload)).toContain("Kaan#TR1");
  });

  // It reports on one person's play; it should not be readable by the channel.
  it("is always ephemeral", async () => {
    const payload = await coachCommand(REQ);

    expect(payload.flags & MessageFlags.Ephemeral).toBe(MessageFlags.Ephemeral);
  });

  it("upsells a free plan instead of erroring, and does no work first", async () => {
    vi.mocked(checkIsPro).mockResolvedValue(false);

    const payload = await coachCommand(REQ);

    expect(body(payload)).toContain("Pro feature");
    expect(getPlayerPerformanceProfile).not.toHaveBeenCalled();
  });

  it("requires a link, and a Riot account behind it", async () => {
    vi.mocked(getLinkedIdentity).mockResolvedValue(null);
    expect(body(await coachCommand(REQ))).toContain("/lolai link");

    vi.mocked(getLinkedIdentity).mockResolvedValue({ ...IDENTITY, riotAccount: null });
    expect(body(await coachCommand(REQ))).toContain("No Riot account connected");
  });

  it("does not pretend to coach an account with nothing synced", async () => {
    vi.mocked(getPlayerPerformanceProfile).mockResolvedValue({
      ...PROFILE,
      gamesAnalyzed: 0,
    });

    expect(body(await coachCommand(REQ))).toContain("Nothing to read yet");
  });

  it("says nothing has shown up rather than leaving the card empty", async () => {
    vi.mocked(getActiveHabits).mockResolvedValue([]);

    expect(body(await coachCommand(REQ))).toContain("No recurring habits detected");
  });
});
