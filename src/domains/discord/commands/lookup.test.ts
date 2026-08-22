import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/domains/riot", () => ({
  buildAccountPreview: vi.fn(),
  getLastMatchSummary: vi.fn(),
  searchPlayers: vi.fn(),
  VALID_REGIONS: ["euw1", "tr1", "kr", "na1"],
}));

// The barrel drags matchService and Prisma in behind one label function.
vi.mock("@/domains/match", () => ({ queueLabel: (q: string) => q }));

import {
  championsCommand,
  matchCommand,
  rankCommand,
} from "@/domains/discord/commands/lookup";
import type { BotRequest } from "@/domains/discord/request";
import { buildAccountPreview, getLastMatchSummary, searchPlayers } from "@/domains/riot";
import type { LastMatchSummary } from "@/domains/riot";
import { ApiError } from "@/lib/api/errors";
import { ComponentType, type ContainerComponent } from "@/lib/discord/componentTypes";
import { MessageFlags } from "@/lib/discord/interactionTypes";
import type { DiscordMessagePayload } from "@/lib/discord/componentTypes";
import type { PreviewResponse } from "@/types/preview";

const PREVIEW: PreviewResponse = {
  summoner: { gameName: "Faker", tagLine: "KR1", summonerLevel: 843, profileIconId: 6 },
  rank: { tier: "GOLD", division: "II", lp: 47, wins: 23, losses: 19 },
  recentMatches: [
    { championName: "Ahri", win: true, kills: 9, deaths: 2, assists: 11, position: "MIDDLE" },
  ],
  topChampions: [{ championName: "Ahri", games: 24, wins: 15, winRate: 62.5 }],
  aiInsight: "Your deaths spike after 20 minutes.",
};

function req(overrides: Partial<BotRequest> = {}): BotRequest {
  return {
    command: "rank",
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

describe("preview-backed lookup commands", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(searchPlayers).mockResolvedValue([]);
    vi.mocked(buildAccountPreview).mockResolvedValue(PREVIEW);
  });

  it("paints the container with the tier colour", async () => {
    const payload = await rankCommand(req());
    const root = payload.components[0] as ContainerComponent;

    expect(root.type).toBe(ComponentType.Container);
    expect(root.accent_color).toBe(0xc89b3c); // Gold
    expect(allText(payload)).toContain("Faker#KR1");
    expect(allText(payload)).toContain("Gold II");
    // A successful lookup is for the whole channel to see.
    expect(payload.flags & MessageFlags.Ephemeral).toBe(0);
  });

  it("takes the region from the player index when none was given", async () => {
    vi.mocked(searchPlayers).mockResolvedValue([
      {
        puuid: "p",
        gameName: "Faker",
        tagLine: "KR1",
        region: "kr",
        profileIconId: 6,
        summonerLevel: 843,
        seenCount: 12,
        lastSeenAt: new Date(0),
      },
    ]);

    await rankCommand(req());

    expect(buildAccountPreview).toHaveBeenCalledWith("Faker", "KR1", "kr");
  });

  it("falls back to the default shard when the index has never seen them", async () => {
    await rankCommand(req({ riotId: "Nobody#EUW" }));

    expect(buildAccountPreview).toHaveBeenCalledWith("Nobody", "EUW", "euw1");
  });

  it("uses an explicit region over anything the index says", async () => {
    await rankCommand(req({ region: "tr1" }));

    expect(buildAccountPreview).toHaveBeenCalledWith("Faker", "KR1", "tr1");
    expect(searchPlayers).not.toHaveBeenCalled();
  });

  it("asks for a Riot ID ephemerally rather than guessing", async () => {
    const payload = await rankCommand(req({ riotId: undefined }));

    expect(payload.flags & MessageFlags.Ephemeral).toBe(MessageFlags.Ephemeral);
    expect(allText(payload)).toContain("/lolai link");
    expect(buildAccountPreview).not.toHaveBeenCalled();
  });

  it("rejects a Riot ID with no tag, and an unknown region", async () => {
    expect(allText(await rankCommand(req({ riotId: "Faker" })))).toContain("Faker#KR1");
    expect(allText(await rankCommand(req({ region: "zz9" })))).toContain("Unknown region");
    expect(buildAccountPreview).not.toHaveBeenCalled();
  });

  it("names the guessed region when Riot has no such account", async () => {
    vi.mocked(buildAccountPreview).mockRejectedValue(
      new ApiError("RIOT_NOT_FOUND", "not found", 404)
    );

    const text = allText(await rankCommand(req()));

    expect(text).toContain("No such account");
    expect(text).toContain("Western Europe");
  });

  it("says Riot is throttling rather than blaming the user", async () => {
    vi.mocked(buildAccountPreview).mockRejectedValue(new ApiError("RATE_LIMIT", "429", 429));

    expect(allText(await rankCommand(req()))).toContain("throttling");
  });

  // Anything that is not a Riot lookup failure belongs to the router's catch,
  // which logs it — swallowing it here would hide real bugs behind a soft card.
  it("rethrows an unexpected failure", async () => {
    vi.mocked(buildAccountPreview).mockRejectedValue(new Error("prisma exploded"));

    await expect(rankCommand(req())).rejects.toThrow("prisma exploded");
  });

  it("lists the champion pool with per-champion win rates", async () => {
    const text = allText(await championsCommand(req({ command: "champions" })));

    expect(text).toContain("Ahri");
    expect(text).toContain("63% win rate (15W 9L)");
  });
});

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
