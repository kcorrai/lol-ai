import { describe, expect, it } from "vitest";
import {
  computeDuoSynergy,
  MIN_SAMPLE,
  type OwnRow,
  type PartnerRow,
} from "@/domains/analysis/services/duoSynergy";

let clock = 0;

function own(overrides: Partial<OwnRow> & { matchId: string; won: boolean }): OwnRow {
  clock += 1;
  return {
    teamId: 100,
    gameStart: new Date(2026, 0, clock),
    championName: "Ahri",
    position: "MIDDLE",
    kills: 6,
    deaths: 3,
    assists: 6,
    visionScore: 20,
    csPerMinute: 7,
    ...overrides,
  };
}

function partner(matchId: string, overrides: Partial<PartnerRow> = {}): PartnerRow {
  return {
    matchId,
    teamId: 100,
    championName: "Thresh",
    position: "UTILITY",
    kills: 1,
    deaths: 4,
    assists: 14,
    ...overrides,
  };
}

/** N shared wins and M shared losses, plus solo games, in one call. */
function scenario(sharedWins: number, sharedLosses: number, soloWins: number, soloLosses: number) {
  const ownRows: OwnRow[] = [];
  const partnerRows: PartnerRow[] = [];

  const push = (prefix: string, count: number, won: boolean, withPartner: boolean) => {
    for (let i = 0; i < count; i += 1) {
      const matchId = `${prefix}-${i}`;
      ownRows.push(own({ matchId, won }));
      if (withPartner) partnerRows.push(partner(matchId));
    }
  };

  push("sw", sharedWins, true, true);
  push("sl", sharedLosses, false, true);
  push("ow", soloWins, true, false);
  push("ol", soloLosses, false, false);

  return { ownRows, partnerRows };
}

describe("computeDuoSynergy", () => {
  it("splits the same window into games with the partner and games without", () => {
    const { ownRows, partnerRows } = scenario(6, 4, 3, 7);
    const s = computeDuoSynergy(ownRows, partnerRows);

    expect(s.together).toEqual({ games: 10, wins: 6, winRate: 60 });
    expect(s.apart).toEqual({ games: 10, wins: 3, winRate: 30 });
    expect(s.synergyDelta).toBe(30);
  });

  it("does not count a game where the partner was on the enemy team", () => {
    const ownRows = [own({ matchId: "m1", won: true }), own({ matchId: "m2", won: true })];
    const partnerRows = [partner("m1"), partner("m2", { teamId: 200 })];

    const s = computeDuoSynergy(ownRows, partnerRows);

    // Crediting the pairing for a game they played against each other would be nonsense.
    expect(s.together.games).toBe(1);
    expect(s.apart.games).toBe(1);
  });

  it("refuses to call a handful of games a verdict", () => {
    // Four games together: one result moves the win rate 25 points, so printing "+25 synergy"
    // off it would be inventing a finding.
    const { ownRows, partnerRows } = scenario(2, 2, 5, 5);
    const s = computeDuoSynergy(ownRows, partnerRows);

    expect(s.hasEnoughData).toBe(false);
    // The numbers are still computed — the flag is what tells the panel not to print them.
    expect(s.together.winRate).toBe(50);
    expect(MIN_SAMPLE).toBe(5);
  });

  it("has enough data at exactly the threshold", () => {
    const { ownRows, partnerRows } = scenario(3, 2, 1, 1);

    expect(computeDuoSynergy(ownRows, partnerRows).hasEnoughData).toBe(true);
  });

  it("leaves the delta null when they have never played apart", () => {
    const { ownRows, partnerRows } = scenario(5, 1, 0, 0);
    const s = computeDuoSynergy(ownRows, partnerRows);

    expect(s.apart.winRate).toBeNull();
    expect(s.synergyDelta).toBeNull();
  });

  it("reads the streak from the most recent shared games, signed by result", () => {
    const ownRows = [
      own({ matchId: "a", won: false, gameStart: new Date(2026, 0, 1) }),
      own({ matchId: "b", won: true, gameStart: new Date(2026, 0, 2) }),
      own({ matchId: "c", won: true, gameStart: new Date(2026, 0, 3) }),
    ];
    const partnerRows = [partner("a"), partner("b"), partner("c")];

    expect(computeDuoSynergy(ownRows, partnerRows).streak).toBe(2);

    const losing = computeDuoSynergy(
      ownRows.map((r) => ({ ...r, won: !r.won })),
      partnerRows,
    );
    expect(losing.streak).toBe(-2);
  });

  it("ranks champion pairings by win rate and ignores one-off pairings", () => {
    const ownRows = [
      own({ matchId: "p1", won: true, championName: "Jinx" }),
      own({ matchId: "p2", won: true, championName: "Jinx" }),
      own({ matchId: "p3", won: false, championName: "Kaisa" }),
      own({ matchId: "p4", won: false, championName: "Kaisa" }),
      own({ matchId: "p5", won: true, championName: "Ezreal" }),
    ];
    const partnerRows = [
      partner("p1"),
      partner("p2"),
      partner("p3", { championName: "Lulu" }),
      partner("p4", { championName: "Lulu" }),
      partner("p5", { championName: "Nami" }),
    ];

    const pairs = computeDuoSynergy(ownRows, partnerRows).championPairs;

    expect(pairs.map((p) => `${p.ownChampion}+${p.partnerChampion}`)).toEqual([
      "Jinx+Thresh",
      "Kaisa+Lulu",
    ]);
    expect(pairs[0]!.winRate).toBe(100);
  });

  it("ranks role pairings by how often they happen, not by win rate", () => {
    const ownRows = [
      own({ matchId: "r1", won: false, position: "BOTTOM" }),
      own({ matchId: "r2", won: false, position: "BOTTOM" }),
      own({ matchId: "r3", won: true, position: "MIDDLE" }),
    ];
    const partnerRows = [partner("r1"), partner("r2"), partner("r3", { position: "JUNGLE" })];

    const roles = computeDuoSynergy(ownRows, partnerRows).rolePairs;

    // The pairing they actually play is the useful one, even at 0%.
    expect(roles[0]).toEqual({
      ownPosition: "BOTTOM",
      partnerPosition: "UTILITY",
      games: 2,
      winRate: 0,
    });
  });

  it("averages KDA per game rather than dividing the totals", () => {
    const ownRows = [
      own({ matchId: "k1", won: true, kills: 10, deaths: 0, assists: 0 }),
      own({ matchId: "k2", won: true, kills: 0, deaths: 10, assists: 0 }),
    ];
    const partnerRows = [partner("k1"), partner("k2")];

    // Totals would give 10/10 = 1.0 and hide the swing; per-game gives (10 + 0)/2 = 5.
    expect(computeDuoSynergy(ownRows, partnerRows).averagesTogether!.kda).toBe(5);
  });

  it("lists the newest shared games first, with both champions", () => {
    const ownRows = [
      own({ matchId: "s1", won: true, gameStart: new Date(2026, 0, 1) }),
      own({ matchId: "s2", won: false, gameStart: new Date(2026, 0, 9) }),
    ];
    const partnerRows = [partner("s1"), partner("s2", { championName: "Nautilus" })];

    const recent = computeDuoSynergy(ownRows, partnerRows).recentShared;

    expect(recent[0]!.matchId).toBe("s2");
    expect(recent[0]!.partnerChampion).toBe("Nautilus");
  });

  it("survives a partner who never shared a match", () => {
    const s = computeDuoSynergy([own({ matchId: "solo", won: true })], []);

    expect(s.together).toEqual({ games: 0, wins: 0, winRate: null });
    expect(s.averagesTogether).toBeNull();
    expect(s.hasEnoughData).toBe(false);
    expect(s.recentShared).toEqual([]);
  });

  it("survives an empty history", () => {
    const s = computeDuoSynergy([], []);

    expect(s.synergyDelta).toBeNull();
    expect(s.streak).toBe(0);
    expect(s.championPairs).toEqual([]);
  });
});
