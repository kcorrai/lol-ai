import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetchChampionDetail = vi.fn();
const mockGetLatestDdragonVersion = vi.fn();

vi.mock("@/lib/ddragon/championsData", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ddragon/championsData")>(
    "@/lib/ddragon/championsData"
  );
  return {
    ...actual,
    fetchChampionDetail: (...args: unknown[]) => mockFetchChampionDetail(...args),
  };
});

vi.mock("@/lib/ddragon", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ddragon")>("@/lib/ddragon");
  return {
    ...actual,
    getLatestDdragonVersion: () => mockGetLatestDdragonVersion(),
  };
});

import { readChampionIdentity } from "@/domains/desktop/services/championAbilities";
import type { DdragonChampionDetail, DdragonSpell } from "@/lib/ddragon/championsData";

function spell(over: Partial<DdragonSpell> = {}): DdragonSpell {
  return {
    id: "AhriQ",
    name: "Orb of Deception",
    description: "Ahri sends out her orb.",
    tooltip: "",
    cooldownBurn: "7",
    costBurn: "55/60/65/70/75",
    rangeBurn: "880",
    image: { full: "AhriQ.png" },
    ...over,
  };
}

function champion(over: Partial<DdragonChampionDetail> = {}): DdragonChampionDetail {
  return {
    id: "Ahri",
    // The numeric id, which is what the clip address is built from.
    key: "103",
    name: "Ahri",
    title: "the Nine-Tailed Fox",
    tags: ["Mage", "Assassin"],
    info: { attack: 3, defense: 4, magic: 8, difficulty: 5 },
    stats: {
      hp: 590,
      hpperlevel: 96,
      armor: 21,
      armorperlevel: 4.7,
      spellblock: 30,
      spellblockperlevel: 1.3,
      attackdamage: 53,
      attackdamageperlevel: 3,
      attackrange: 550,
      movespeed: 330,
    },
    blurb: "",
    lore: "",
    allytips: [],
    enemytips: [],
    spells: [
      spell(),
      spell({ id: "AhriW", name: "Fox-Fire", image: { full: "AhriW.png" } }),
      spell({ id: "AhriE", name: "Charm", image: { full: "AhriE.png" } }),
      spell({ id: "AhriR", name: "Spirit Rush", image: { full: "AhriR.png" } }),
    ],
    passive: {
      name: "Essence Theft",
      description: "Ahri gains a stack <br>for each enemy hit for {{ f1 }} seconds.",
      image: { full: "Ahri_SoulEaten.png" },
    },
    skins: [],
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetLatestDdragonVersion.mockResolvedValue("15.14.1");
  mockFetchChampionDetail.mockResolvedValue(champion());
});

describe("readChampionIdentity", () => {
  it("puts the passive first and then Q, W, E, R", async () => {
    const identity = await readChampionIdentity("Ahri");

    expect(identity.abilities.map((a) => a.slot)).toEqual(["P", "Q", "W", "E", "R"]);
    expect(identity.abilities.map((a) => a.name)).toEqual([
      "Essence Theft",
      "Orb of Deception",
      "Fox-Fire",
      "Charm",
      "Spirit Rush",
    ]);
  });

  it("carries the epithet and the classes the catalogue names", async () => {
    const identity = await readChampionIdentity("Ahri");

    expect(identity.title).toBe("the Nine-Tailed Fox");
    expect(identity.tags).toEqual(["Mage", "Assassin"]);
  });

  /**
   * The clip address is built from the *numeric* id, zero-padded to four digits — the
   * unpadded form 403s. It is also the one identifier the desktop contract does not
   * carry, which is why the finished address is what crosses the wire.
   */
  it("addresses each clip by the zero-padded numeric champion id", async () => {
    const identity = await readChampionIdentity("Ahri");

    expect(identity.abilities[0].videoUrl).toContain("/champion-abilities/0103/");
    expect(identity.abilities[0].videoUrl).toContain("ability_0103_P1.webm");
    expect(identity.abilities[3].videoUrl).toContain("ability_0103_E1.webm");
  });

  /** Data Dragon prose carries `{{ }}` placeholders and HTML that must not reach a panel. */
  it("strips the template markers and the markup out of the prose", async () => {
    const identity = await readChampionIdentity("Ahri");

    expect(identity.abilities[0].description).toBe(
      "Ahri gains a stack for each enemy hit for seconds."
    );
  });

  /**
   * A passive has no cooldown, cost or range, and Data Dragon says so with values rather
   * than absences. Printing "0" in a stat row states a wrong fact; null drops the row.
   */
  it("drops burn strings that mean 'not applicable' rather than printing them", async () => {
    mockFetchChampionDetail.mockResolvedValue(
      champion({
        spells: [spell({ cooldownBurn: "0/0/0/0/0", costBurn: "0", rangeBurn: "self" })],
      })
    );

    const identity = await readChampionIdentity("Ahri");
    const [passive, q] = identity.abilities;

    expect(passive.cooldown).toBeNull();
    expect(q.cooldown).toBeNull();
    expect(q.cost).toBeNull();
    expect(q.range).toBeNull();
  });

  it("keeps a real per-rank burn string as Riot writes it", async () => {
    const identity = await readChampionIdentity("Ahri");

    expect(identity.abilities[1].cost).toBe("55/60/65/70/75");
    expect(identity.abilities[1].range).toBe("880");
  });

  /** A champion whose entry is short a spell loses that row, never the whole kit. */
  it("keeps the rest of the kit when a spell is missing", async () => {
    mockFetchChampionDetail.mockResolvedValue(champion({ spells: [spell()] }));

    const identity = await readChampionIdentity("Ahri");

    expect(identity.abilities.map((a) => a.slot)).toEqual(["P", "Q"]);
  });

  /**
   * The catalogue is a feed the rest of these screens do not depend on, so it is the one
   * that has to fail alone: every caller spreads this over an answer it already has.
   */
  it("answers with nothing rather than throwing when the catalogue is unreachable", async () => {
    mockFetchChampionDetail.mockRejectedValue(new Error("ddragon down"));

    const identity = await readChampionIdentity("Ahri");

    expect(identity).toEqual({ title: null, tags: [], abilities: [] });
  });

  it("answers with nothing when the catalogue has no such champion", async () => {
    mockFetchChampionDetail.mockResolvedValue(null);

    const identity = await readChampionIdentity("NotAChampion");

    expect(identity.abilities).toEqual([]);
  });
});
