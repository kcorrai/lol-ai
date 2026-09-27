/**
 * The overlay demo's script: four minutes of a lane, played in ten seconds, as the "This game"
 * panel would read it.
 *
 * Only that panel moves. It is the one the real overlay updates from the running game
 * (`desktop/src/components/game/ThisGamePanel.tsx`); the lane and build panels are patch-wide
 * readings that stay put for the whole match, so animating them would promise something the
 * app deliberately does not do — Riot forbids advice dictated by the live game state.
 *
 * The numbers end where the static drawing sits (7.4 CS/min, 412 gold/min, 4/1/3), so the
 * still frame a reduced-motion reader sees is a moment of this same game.
 */

export const OVERLAY_LOOP_MS = 10_000;

export interface OverlayFrame {
  csPerMin: number;
  goldPerMin: number;
  kills: number;
  deaths: number;
  assists: number;
}

export const OVERLAY_FINAL: OverlayFrame = {
  csPerMin: 7.4,
  goldPerMin: 412,
  kills: 4,
  deaths: 1,
  assists: 3,
};

const START: OverlayFrame = { csPerMin: 7.0, goldPerMin: 371, kills: 2, deaths: 1, assists: 2 };

/** Moments in the loop, as fractions of it, at which the scoreboard changes. */
const EVENTS: readonly { at: number; kills?: number; assists?: number }[] = [
  { at: 0.28, assists: 3 },
  { at: 0.52, kills: 3 },
  { at: 0.81, kills: 4 },
];

export function overlayFrame(elapsedMs: number): OverlayFrame {
  const p = (((elapsedMs % OVERLAY_LOOP_MS) + OVERLAY_LOOP_MS) % OVERLAY_LOOP_MS) / OVERLAY_LOOP_MS;
  // Farming is steady, so CS/min climbs smoothly; gold also jumps a little with each takedown.
  const csPerMin =
    Math.round((START.csPerMin + (OVERLAY_FINAL.csPerMin - START.csPerMin) * p) * 10) / 10;
  let goldPerMin = START.goldPerMin + (OVERLAY_FINAL.goldPerMin - START.goldPerMin - 24) * p;
  let { kills, assists } = START;
  for (const e of EVENTS) {
    if (p < e.at) break;
    kills = e.kills ?? kills;
    assists = e.assists ?? assists;
    goldPerMin += 8;
  }
  return { csPerMin, goldPerMin: Math.round(goldPerMin), kills, deaths: START.deaths, assists };
}
