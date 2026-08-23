/**
 * Riot's internal game-mode enum, in words.
 *
 * Lives in lib because two surfaces read it — the Discord `/live` card and the web live scout —
 * and a map that must track Riot's enum is exactly the thing CLAUDE.md §4 keeps out of a domain
 * once a second consumer appears.
 *
 * These are the modes actually reachable today. Anything else is title-cased from its own name
 * rather than hidden, so a mode Riot adds reads acceptably the day it lands instead of the day
 * somebody remembers this file.
 */
const GAME_MODE_LABELS: Record<string, string> = {
  CLASSIC: "Summoner's Rift",
  ARAM: "ARAM",
  URF: "URF",
  CHERRY: "Arena",
  NEXUSBLITZ: "Nexus Blitz",
  ONEFORALL: "One for All",
  ULTBOOK: "Ultimate Spellbook",
  STRAWBERRY: "Swarm",
  TUTORIAL: "Tutorial",
};

export function gameModeLabel(mode: string): string {
  return GAME_MODE_LABELS[mode] ?? mode.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
