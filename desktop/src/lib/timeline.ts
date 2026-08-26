import { displayNameOf, type AllGameData, type GameEvent, type LivePlayer, type Team } from "./liveClient/schema";

/**
 * What has already happened in this game.
 *
 * The event stream has been arriving all along — `allgamedata` carries it, the poll pulls it
 * once a second and the schema has always parsed it — and nothing read it. This is the
 * reader.
 *
 * **Everything here is a thing the player watched happen.** An objective that was taken, a
 * turret that fell, a kill that was in the feed. The panel is a record of a match nobody can
 * scroll back through, which is the only reason it is worth drawing: a player at fourteen
 * minutes knows the dragon went to the other team and often not when, and "when" is the half
 * that tells them whether the next one is theirs to contest.
 *
 * **What it is not is a timer.** No respawn is computed, no next objective is predicted, and
 * no game constant appears anywhere in this file. Those numbers change from patch to patch,
 * this repository has no verified table of them, and a confidently wrong countdown over a
 * running game is worse than no panel — which is exactly what LA-74 says, and why the
 * counters it describes are still not here. Riot's own prohibition is narrower than that
 * rule and this stays well inside both: nothing is tracked about an enemy that the player
 * cannot see, and nothing tells them what to do next.
 */

/** The kinds this build knows how to say out loud. */
export type TimelineKind = "dragon" | "baron" | "herald" | "turret" | "inhibitor" | "kill" | "ace" | "multikill";

export interface TimelineEntry {
  /** Riot's own `EventID`, which is unique within a game and is the row's key. */
  id: number;
  /** Seconds since the game began, as Riot publishes it. */
  at: number;
  kind: TimelineKind;
  /** What happened, in as many words as it takes. Never an instruction. */
  headline: string;
  /** The champion behind it, already resolved, or null when nobody could be matched. */
  actor: string | null;
  /** Which side it went to, when that could be worked out from the player list. */
  team: Team | null;
  /** True only for the events Riot marks as stolen. */
  stolen: boolean;
  /** True when this row is about the player at this keyboard. */
  mine: boolean;
}

/**
 * Every event name this build draws, and what it calls it.
 *
 * `GameStart` and `MinionsSpawning` are deliberately absent: both are on the clock the player
 * is already looking at, and a timeline whose first two rows are "the game started" is one
 * that has padded itself.
 *
 * A name that is not in here is skipped rather than drawn with its raw name. Riot adds
 * objectives between patches and `Atakhan_Kill` in a player-facing list is this app leaking
 * its own ignorance onto the screen.
 */
const KINDS: Record<string, TimelineKind> = {
  DragonKill: "dragon",
  BaronKill: "baron",
  HeraldKill: "herald",
  TurretKilled: "turret",
  FirstBrick: "turret",
  InhibKilled: "inhibitor",
  ChampionKill: "kill",
  Ace: "ace",
  Multikill: "multikill",
};

/**
 * Whether Riot marked this one stolen.
 *
 * The field arrives as a boolean in some payloads and as the string `"False"` in others, and
 * `"False"` is truthy — reading it directly would mark every objective in the game stolen.
 */
export function isStolen(value: boolean | string | undefined): boolean {
  if (typeof value === "boolean") return value;
  return typeof value === "string" && value.toLowerCase() === "true";
}

/**
 * The champion behind a name the event stream used.
 *
 * Events name players the way the client does — a Riot id, or a summoner name on older
 * payloads — and the scoreboard on this screen speaks champions. Matching them here means the
 * panel reads like the rest of the window rather than like a log file.
 *
 * A name that matches nobody comes back null. That is routine rather than a fault: a turret
 * has no killer when minions took it, and Riot fills the field with the name of a structure
 * or leaves it out.
 */
export function championFor(players: readonly LivePlayer[], name: string | undefined): LivePlayer | null {
  if (!name) return null;
  return players.find((p) => displayNameOf(p) === name || p.summonerName === name) ?? null;
}

/**
 * One event as a row, or null when this build has nothing to say about it.
 *
 * Written as a function of the event and the player list alone so the whole panel can be
 * checked against a fixture with no window, no clock and no network.
 */
export function readEvent(
  event: GameEvent,
  players: readonly LivePlayer[],
  me: LivePlayer | null
): TimelineEntry | null {
  const kind = KINDS[event.EventName];
  if (!kind) return null;

  const killer = championFor(players, event.KillerName);
  const victim = championFor(players, event.VictimName);
  const acer = championFor(players, event.Acer);
  const actor = killer ?? acer;
  const stolen = isStolen(event.Stolen);

  const myName = me ? displayNameOf(me) : null;
  const mine =
    myName !== null &&
    (event.KillerName === myName || event.VictimName === myName || event.Acer === myName);

  return {
    id: event.EventID,
    at: event.EventTime,
    kind,
    headline: headlineFor(kind, event, killer, victim, acer, stolen),
    actor: actor?.championName ?? null,
    // The acing team is named by the event itself; everything else is read off whoever did it.
    team: actor?.team ?? teamNamed(event.AcingTeam),
    stolen,
    mine,
  };
}

/** `AcingTeam` is the one place a side is named rather than derived. */
function teamNamed(value: string | undefined): Team | null {
  if (value === "ORDER" || value === "CHAOS") return value;
  return null;
}

/**
 * What the row says.
 *
 * Deliberately plain, and deliberately short of detail this app cannot supply honestly. A
 * turret is "a turret": Riot names it `Turret_T1_C_05_A`, and turning that into "top outer"
 * means knowing a naming scheme Riot does not publish and this repository has not verified.
 * The dragon's type is the one exception, and only because Riot sends the word itself.
 */
function headlineFor(
  kind: TimelineKind,
  event: GameEvent,
  killer: LivePlayer | null,
  victim: LivePlayer | null,
  acer: LivePlayer | null,
  stolen: boolean
): string {
  const by = killer ? ` — ${killer.championName}` : "";
  const stole = stolen ? ", stolen" : "";

  switch (kind) {
    case "dragon":
      // Riot's own word for the dragon, passed through. This app keeps no list of them, so a
      // type added next patch arrives correct rather than as "Dragon".
      return `${event.DragonType ? `${event.DragonType} dragon` : "Dragon"}${by}${stole}`;
    case "baron":
      return `Baron${by}${stole}`;
    case "herald":
      return `Herald${by}${stole}`;
    case "turret":
      return `${event.EventName === "FirstBrick" ? "First turret" : "Turret"}${by}`;
    case "inhibitor":
      return `Inhibitor${by}`;
    case "kill":
      return victim && killer
        ? `${killer.championName} killed ${victim.championName}`
        : victim
          ? `${victim.championName} died`
          : "A champion died";
    case "ace":
      return acer ? `Ace — ${acer.championName}` : "Ace";
    case "multikill":
      // The number Riot sent, not a word for it. "Triple kill" would be this app deciding
      // that three is what triple means, which is knowledge it does not need to have.
      return `${killer ? `${killer.championName} — ` : ""}multikill ×${event.KillStreak ?? 0}`;
  }
}

/**
 * The whole game so far, newest first.
 *
 * Newest first because the row a player wants is the one that just happened, and the panel is
 * read at a glance from the top. The clock is Riot's `EventTime`; `EventID` breaks a tie, so
 * two things in the same second keep the order the client published them in.
 */
export function readTimeline(data: AllGameData, me: LivePlayer | null): TimelineEntry[] {
  return data.events.Events.map((event) => readEvent(event, data.allPlayers, me))
    .filter((entry): entry is TimelineEntry => entry !== null)
    .sort((a, b) => b.at - a.at || b.id - a.id);
}

/** `EventTime` is seconds as a float; the clock the player is used to reads mm:ss. */
export function eventClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
