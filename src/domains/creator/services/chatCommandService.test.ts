import { describe, it, expect } from "vitest";
import {
  CHAT_MAX_LENGTH,
  renderChatCommand,
  toChatLine,
} from "@/domains/creator/services/chatCommandService";
import { CHAT_COMMANDS, type OverlayPayload } from "@/domains/creator/types";

const GAME_NAME = "kaanproak0";

function payload(overrides: Partial<OverlayPayload> = {}): OverlayPayload {
  return {
    identity: { name: `${GAME_NAME}#TR1`, region: "tr1", redacted: false },
    rank: { tier: "EMERALD", division: "II", lp: 45, label: "Emerald II", sessionLpDelta: 64 },
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
      { championId: 45, championName: "Veigar", games: 22, wins: 13, winRate: 59, kda: 4.01 },
      { championId: 12, championName: "Alistar", games: 10, wins: 7, winRate: 70, kda: 3.76 },
      { championId: 111, championName: "Nautilus", games: 4, wins: 3, winRate: 75, kda: 2.97 },
    ],
    goal: null,
    theme: "dark",
    accentColor: "#C6FF3D",
    delaySeconds: 0,
    asOf: "2026-08-18T14:00:00.000Z",
    ...overrides,
  };
}

const EMPTY = payload({
  rank: null,
  lastGame: null,
  champions: [],
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
});

describe("toChatLine", () => {
  it("collapses newlines, which would otherwise break the chat message", () => {
    expect(toChatLine("one\ntwo\n\nthree")).toBe("one two three");
  });

  it("collapses runs of whitespace and trims", () => {
    expect(toChatLine("  a    b  ")).toBe("a b");
  });

  it("leaves a short line alone", () => {
    expect(toChatLine("Emerald II, 45 LP")).toBe("Emerald II, 45 LP");
  });

  it("truncates past the platform limit with an ellipsis", () => {
    const line = toChatLine("x".repeat(CHAT_MAX_LENGTH + 50));
    expect(line).toHaveLength(CHAT_MAX_LENGTH);
    expect(line.endsWith("…")).toBe(true);
  });
});

describe("renderChatCommand", () => {
  it("answers !rank with the rank, LP and session delta", () => {
    expect(renderChatCommand("rank", payload())).toBe(
      "kaanproak0#TR1 — Emerald II, 45 LP · +64 LP this session"
    );
  });

  it("omits the delta from !rank when there is nothing to compare against", () => {
    const p = payload();
    const line = renderChatCommand("rank", { ...p, rank: { ...p.rank!, sessionLpDelta: null } });
    expect(line).toBe("kaanproak0#TR1 — Emerald II, 45 LP");
  });

  it("answers !session with the record and KDA", () => {
    expect(renderChatCommand("session", payload())).toBe(
      "Session: 7W 3L (70%) · 62/31/74 · 4.39 KDA"
    );
  });

  it("answers !lastgame with the champion and result", () => {
    expect(renderChatCommand("lastgame", payload())).toBe(
      "Last game: Ahri — Win · 8/2/11 · 7.4 CS/min · 32 min (Ranked Solo)"
    );
  });

  it("trims !champs to three, which is what fits a chat line", () => {
    const line = renderChatCommand("champs", payload());
    expect(line).toBe(
      "Most played: Ahri (30g, 57%, 3.42 KDA) · Veigar (22g, 59%, 4.01 KDA) · Alistar (10g, 70%, 3.76 KDA)"
    );
    expect(line).not.toContain("Nautilus");
  });

  it("answers !laneiq with a link", () => {
    expect(renderChatCommand("laneiq", payload())).toContain("https://laneiq.gg");
  });

  // A bot pastes whatever comes back, so "undefined" or a bare "0W 0L" in chat
  // is the failure mode these guard against.
  it("gives every command a readable answer with no data at all", () => {
    for (const command of CHAT_COMMANDS) {
      const line = renderChatCommand(command, EMPTY);
      expect(line.length).toBeGreaterThan(0);
      expect(line).not.toContain("undefined");
      expect(line).not.toContain("null");
      expect(line).not.toContain("NaN");
    }
  });

  it("keeps every command inside the platform message limit", () => {
    for (const command of CHAT_COMMANDS) {
      expect(renderChatCommand(command, payload()).length).toBeLessThanOrEqual(CHAT_MAX_LENGTH);
    }
  });

  it("keeps every command to a single line", () => {
    for (const command of CHAT_COMMANDS) {
      expect(renderChatCommand(command, payload())).not.toContain("\n");
    }
  });
});

describe("renderChatCommand — stream-safe mode", () => {
  const redacted = payload({ identity: { name: null, region: "tr1", redacted: true } });

  // The chat endpoints are as public as the overlay, so the same rule holds:
  // with stream-safe on, nothing we emit may carry the Riot ID.
  it("emits the Riot ID from no command", () => {
    for (const command of CHAT_COMMANDS) {
      expect(renderChatCommand(command, redacted)).not.toContain(GAME_NAME);
    }
  });

  it("uses a neutral subject rather than an empty one", () => {
    expect(renderChatCommand("rank", redacted)).toBe(
      "The streamer — Emerald II, 45 LP · +64 LP this session"
    );
  });

  it("keeps a chosen display name", () => {
    const named = payload({ identity: { name: "Kaan", region: "tr1", redacted: true } });
    expect(renderChatCommand("rank", named)).toContain("Kaan —");
    expect(renderChatCommand("rank", named)).not.toContain(GAME_NAME);
  });
});
