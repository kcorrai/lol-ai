import { describe, expect, it, vi } from "vitest";
import sample from "./__fixtures__/allgamedata.sample.json";
import {
  ALL_GAME_DATA_PATH,
  IDLE_POLL_INTERVAL_MS,
  POLL_INTERVAL_MS,
  nextDelayMs,
  readAllGameData,
} from "./client";

describe("readAllGameData", () => {
  it("returns the parsed game when the client answers", async () => {
    const transport = vi.fn().mockResolvedValue(sample);
    const read = await readAllGameData(transport);

    expect(transport).toHaveBeenCalledWith(ALL_GAME_DATA_PATH);
    expect(read.status).toBe("ok");
    if (read.status === "ok") expect(read.data.gameData.gameMode).toBe("CLASSIC");
  });

  it("reports no-game when the transport says the client is closed", async () => {
    const read = await readAllGameData(async () => null);
    expect(read.status).toBe("no-game");
  });

  it("reports no-game for undefined too, so a lax transport cannot crash the HUD", async () => {
    const read = await readAllGameData(async () => undefined);
    expect(read.status).toBe("no-game");
  });

  it("names the offending field when the payload does not match", async () => {
    const broken = { ...sample, gameData: { ...sample.gameData, gameTime: "soon" } };
    const read = await readAllGameData(async () => broken);

    expect(read.status).toBe("unreadable");
    if (read.status === "unreadable") expect(read.reason).toContain("gameData.gameTime");
  });

  it("surfaces a transport failure instead of throwing at the caller", async () => {
    const read = await readAllGameData(async () => {
      throw new Error("certificate verify failed");
    });

    expect(read.status).toBe("unreadable");
    if (read.status === "unreadable") expect(read.reason).toBe("certificate verify failed");
  });
});

describe("nextDelayMs", () => {
  it("polls at the live rate while a game is running", () => {
    expect(nextDelayMs({ status: "ok", data: {} })).toBe(POLL_INTERVAL_MS);
  });

  it("backs off between games so an idle client is not hammered", () => {
    expect(nextDelayMs({ status: "no-game" })).toBe(IDLE_POLL_INTERVAL_MS);
    expect(nextDelayMs({ status: "unreadable", reason: "x" })).toBe(IDLE_POLL_INTERVAL_MS);
  });

  it("never polls faster than Riot's documented refresh", () => {
    expect(POLL_INTERVAL_MS).toBeGreaterThanOrEqual(500);
  });
});
