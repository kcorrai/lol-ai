import { beforeEach, describe, expect, it, vi } from "vitest";

const invoke = vi.fn();
const isTauri = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invoke(...args),
  isTauri: () => isTauri(),
}));

import {
  ChampionsError,
  filterChampions,
  LANE_LABELS,
  LANES,
  readChampion,
  readChampionList,
  type DesktopChampion,
  type DesktopChampionEntry,
  type DesktopChampionList,
} from "./champions";

const LIST: DesktopChampionList = {
  position: "MIDDLE",
  patch: "26.16",
  entries: [
    {
      championKey: "Ahri",
      name: "Ahri",
      tier: 1,
      rank: 3,
      winRate: 51.2,
      pickRate: 8.4,
      banRate: 3.1,
      games: 91_204,
      lowConfidence: false,
    },
  ],
};

const CHAMPION: DesktopChampion = {
  champion: { key: "Ahri", name: "Ahri" },
  position: "MIDDLE",
  patch: "26.16",
  availablePositions: ["MIDDLE"],
  stats: { games: 91_204, winRate: 51.2, pickRate: 8.4, banRate: 3.1, tier: 1 },
  build: null,
  title: "the Nine-Tailed Fox",
  tags: ["Mage", "Assassin"],
  abilities: [],
  counteredBy: [{ championKey: "Zed", name: "Zed", games: 4210, subjectWinRate: 47.5 }],
  goodInto: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  isTauri.mockReturnValue(true);
});

describe("LANES", () => {
  it("names every lane the website will answer for", () => {
    // The website canonicalises to these five and refuses anything else with a 422, so a
    // sixth here would be a tab that could only ever fail.
    expect(LANES).toEqual(["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"]);
    for (const lane of LANES) expect(LANE_LABELS[lane]).toBeTruthy();
  });
});

describe("readChampionList", () => {
  it("asks the core for the lane", async () => {
    invoke.mockResolvedValue(LIST);

    await expect(readChampionList("MIDDLE")).resolves.toEqual(LIST);
    expect(invoke).toHaveBeenCalledWith("champion_list", { position: "MIDDLE" });
  });

  it("passes null through — no token this website still accepts", async () => {
    invoke.mockResolvedValue(null);

    await expect(readChampionList("TOP")).resolves.toBeNull();
  });

  it("does not invoke anything in the browser preview", async () => {
    isTauri.mockReturnValue(false);

    await expect(readChampionList("TOP")).resolves.toBeNull();
    expect(invoke).not.toHaveBeenCalled();
  });
});

describe("readChampion", () => {
  it("hands the core the champion and the lane", async () => {
    invoke.mockResolvedValue(CHAMPION);

    await expect(readChampion("Ahri", "MIDDLE")).resolves.toEqual(CHAMPION);
    expect(invoke).toHaveBeenCalledWith("champion_detail", { key: "Ahri", position: "MIDDLE" });
  });

  it("hands the id over unescaped", async () => {
    // Escaping belongs to the core, which is what builds the address. Doing it here as
    // well would send a doubly-escaped key that matches no champion.
    invoke.mockResolvedValue(CHAMPION);

    await readChampion("MonkeyKing", "TOP");

    expect(invoke).toHaveBeenCalledWith("champion_detail", {
      key: "MonkeyKing",
      position: "TOP",
    });
  });

  // Tauri rejects with whatever the command serialised, and AppError serialises to its own
  // message — including the website's, which is the half that says what to do next.
  it("surfaces the message the core produced", async () => {
    invoke.mockRejectedValue("No reading for that champion on this patch");

    await expect(readChampion("Ahri", "MIDDLE")).rejects.toBeInstanceOf(ChampionsError);
    await expect(readChampion("Ahri", "MIDDLE")).rejects.toThrow(/No reading for that champion/);
  });

  it("falls back to a plain message when the rejection is not a string", async () => {
    invoke.mockRejectedValue({ unexpected: true });

    await expect(readChampion("Ahri", "MIDDLE")).rejects.toThrow("Could not reach LoL AI Coach.");
  });
});

describe("filterChampions", () => {
  const entry = (name: string, championKey = name): DesktopChampionEntry => ({
    ...LIST.entries[0],
    championKey,
    name,
  });
  const entries = [
    entry("Ahri"),
    entry("Sett"),
    entry("Kog'Maw", "KogMaw"),
    entry("Wukong", "MonkeyKing"),
  ];

  it("hands the lane back untouched when nothing is typed", () => {
    expect(filterChampions(entries, "")).toBe(entries);
    expect(filterChampions(entries, "   ")).toBe(entries);
  });

  it("matches anywhere in the name, in any case", () => {
    expect(filterChampions(entries, "SET").map((e) => e.name)).toEqual(["Sett"]);
    expect(filterChampions(entries, "ko").map((e) => e.name)).toEqual(["Kog'Maw", "Wukong"]);
  });

  // The player types the name on the loading screen, not the id behind it. `MonkeyKing` is
  // the id Wukong is filed under, and matching on it would answer a search nobody made
  // while missing the one they did.
  it("reads the name rather than the Data Dragon id", () => {
    expect(filterChampions(entries, "wukong").map((e) => e.name)).toEqual(["Wukong"]);
    expect(filterChampions(entries, "monkeyking")).toEqual([]);
  });

  it("keeps the lane's order", () => {
    expect(filterChampions(entries, "").map((e) => e.name)).toEqual([
      "Ahri",
      "Sett",
      "Kog'Maw",
      "Wukong",
    ]);
  });
});
