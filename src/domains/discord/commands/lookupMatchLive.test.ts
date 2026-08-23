import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/domains/riot", () => ({
  buildAccountPreview: vi.fn(),
  getLastMatchSummary: vi.fn(),
  getLiveDraftForRiotId: vi.fn(),
  searchPlayers: vi.fn(),
  VALID_REGIONS: ["euw1", "tr1", "kr", "na1"],
}));

vi.mock("@/domains/discord/linkService", () => ({ getLinkedIdentity: vi.fn() }));

// These barrels drag matchService, Prisma and the meta snapshot in behind a
// label function and a list of five strings.
vi.mock("@/domains/match", () => ({ queueLabel: (q: string) => q }));
vi.mock("@/domains/meta", () => ({
  ALL_POSITIONS: ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"],
  POSITION_LABELS: {
    TOP: "Top",
    JUNGLE: "Jungle",
    MIDDLE: "Mid",
    BOTTOM: "Bot",
    UTILITY: "Support",
  },
}));

import { liveCommand, matchCommand } from "@/domains/discord/commands/lookup";
import { getLinkedIdentity } from "@/domains/discord/linkService";
import type { BotRequest } from "@/domains/discord/request";
import { getLastMatchSummary, getLiveDraftForRiotId, searchPlayers } from "@/domains/riot";
import type { LastMatchSummary, LiveDraft } from "@/domains/riot";
import type { ContainerComponent, DiscordMessagePayload } from "@/lib/discord/componentTypes";
import { MessageFlags } from "@/lib/discord/interactionTypes";

function req(overrides: Partial<BotRequest> = {}): BotRequest {
  return {
    command: "match",
    riotId: "Faker#KR1",
    discordUserId: "u1",
    discordUsername: "kaan",
    ...overrides,
  };
}

/** Every card is a single container; this reads all its text out flat. */
function allText(payload: DiscordMessagePayload): string {
  const root = payload.components[0] as ContainerComponent;
  return JSON.stringify(root.components);
}

const LAST_MATCH: LastMatchSummary = {
  matchId: "KR_1",
  queue: "RANKED_SOLO_5x5",
  durationSeconds: 1471,
  endedAt: new Date(1_750_000_000_000),
  win: true,
  remake: false,
  player: { championName: "Ahri", position: "MIDDLE", riotId: "Faker#KR1" },
  kills: 9,
  deaths: 2,
  assists: 11,
  kda: 10,
  cs: 231,
  csPerMinute: 9.4,
  goldEarned: 13_400,
  damageToChampions: 24_500,
  damageShare: 0.49,
  visionScore: 21,
  items: [6653, 3020],
  opponent: { championName: "Sylas", position: "MIDDLE", riotId: "Sylas" },
};

describe("matchCommand", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(searchPlayers).mockResolvedValue([]);
    vi.mocked(getLinkedIdentity).mockResolvedValue(null);
    vi.mocked(getLastMatchSummary).mockResolvedValue(LAST_MATCH);
  });

  it("draws a win in the win colour with the full stat line", async () => {
    const payload = await matchCommand(req({ command: "match" }));
    const root = payload.components[0] as ContainerComponent;

    expect(root.accent_color).toBe(0x3cba8c);
    const text = allText(payload);
    expect(text).toContain("Victory");
    expect(text).toContain("9/2/11 (10 KDA)");
    expect(text).toContain("231 (9.4/min)");
    expect(text).toContain("24.5k (49%)");
    expect(text).toContain("Sylas");
  });

  it("suppresses the stats of a remake and stays neutral", async () => {
    vi.mocked(getLastMatchSummary).mockResolvedValue({ ...LAST_MATCH, remake: true });
    const payload = await matchCommand(req({ command: "match" }));

    expect((payload.components[0] as ContainerComponent).accent_color).toBe(0x6366f1);
    expect(allText(payload)).toContain("Remake");
    expect(allText(payload)).not.toContain("/min");
  });

  it("says so plainly when there is no match history", async () => {
    vi.mocked(getLastMatchSummary).mockResolvedValue(null);

    expect(allText(await matchCommand(req({ command: "match" })))).toContain("No games to show");
  });
});

const LIVE: LiveDraft = {
  inGame: true,
  gameMode: "CLASSIC",
  gameLength: 754,
  yourSide: "blue",
  yourMatchup: { champion: "Ahri", opponent: "Sylas", position: "MIDDLE" },
  draft: {
    blue: { TOP: "Aatrox", JUNGLE: "Viego", MIDDLE: "Ahri", BOTTOM: "Jinx" },
    red: { TOP: "Darius", JUNGLE: "Sejuani", MIDDLE: "Sylas", BOTTOM: "Caitlyn" },
  },
};

describe("liveCommand", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(searchPlayers).mockResolvedValue([]);
    vi.mocked(getLinkedIdentity).mockResolvedValue(null);
    vi.mocked(getLiveDraftForRiotId).mockResolvedValue(LIVE);
  });

  it("lines the two sides up lane by lane and names the matchup", async () => {
    const text = allText(await liveCommand(req({ command: "live" })));

    expect(text).toContain("In game");
    expect(text).toContain("12:34");
    expect(text).toContain("Playing **Ahri** into **Sylas**");
    // Fixed-width board: lane label, blue pick, red pick.
    expect(text).toContain("Top      Aatrox         Darius");
    expect(text).toContain("Summoner's Rift");
    expect(text).toContain("inferred from pick rates");
  });

  // A live game rarely has an empty lane, but the inference can leave one, and
  // the row has to hold its shape when it does.
  it("keeps the board aligned when a lane could not be assigned", async () => {
    vi.mocked(getLiveDraftForRiotId).mockResolvedValue({
      ...LIVE,
      draft: { blue: { TOP: "Aatrox" }, red: {} },
    });

    expect(allText(await liveCommand(req({ command: "live" })))).toContain("Jungle   —");
  });

  // The longest lane label is "Support" and the longest champion key is
  // "Fiddlesticks"; both have to clear their column or the board runs words
  // together.
  it("keeps the widest lane and champion apart", async () => {
    vi.mocked(getLiveDraftForRiotId).mockResolvedValue({
      ...LIVE,
      draft: { blue: { UTILITY: "Fiddlesticks" }, red: { UTILITY: "Thresh" } },
    });

    expect(allText(await liveCommand(req({ command: "live" })))).toContain(
      "Support  Fiddlesticks   Thresh"
    );
  });

  it("humanises a game mode it has no label for", async () => {
    vi.mocked(getLiveDraftForRiotId).mockResolvedValue({ ...LIVE, gameMode: "ASCENSION" });

    expect(allText(await liveCommand(req({ command: "live" })))).toContain("Ascension");
  });

  it("treats not being in a game as an answer, not an error", async () => {
    vi.mocked(getLiveDraftForRiotId).mockResolvedValue({ inGame: false });

    const payload = await liveCommand(req({ command: "live" }));

    expect(payload.flags & MessageFlags.Ephemeral).toBe(0);
    expect(allText(payload)).toContain("Not in game");
  });
});
