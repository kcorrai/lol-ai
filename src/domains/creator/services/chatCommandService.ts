import { formatLpDelta } from "@/domains/creator/lp";
import type { ChatCommand, OverlayPayload } from "@/domains/creator/types";

// One line of plain text per command.
//
// These are fetched by the streamer's existing chat bot — Nightbot,
// StreamElements, Fossabot and Kick's Botrix all support `$(urlfetch <url>)`
// inside a custom command — which is why one endpoint covers Twitch, Kick and
// YouTube without us holding a socket open per channel (ADR-026).
//
// The constraint that shapes everything here: the reply is pasted straight into
// chat, so it must be one line, no markup, and short enough to survive the
// platform's message limit.

/**
 * Twitch's limit is 500 bytes; Kick and YouTube are more generous. 400 leaves
 * room for the prefix a bot adds ("@viewer -> ...") without the platform
 * truncating mid-word.
 */
export const CHAT_MAX_LENGTH = 400;

const PROMO_URL = "https://laneiq.gg";

/** Collapse anything that would break a chat line, then cap the length. */
export function toChatLine(text: string): string {
  const flattened = text.replace(/\s+/g, " ").trim();
  if (flattened.length <= CHAT_MAX_LENGTH) return flattened;
  return `${flattened.slice(0, CHAT_MAX_LENGTH - 1).trimEnd()}…`;
}

function subjectOf(payload: OverlayPayload): string {
  return payload.identity.name ?? "The streamer";
}

function rankLine(payload: OverlayPayload): string {
  const rank = payload.rank;
  if (!rank) return `${subjectOf(payload)} has no ranked games this season yet.`;

  const delta =
    rank.sessionLpDelta === null ? "" : ` · ${formatLpDelta(rank.sessionLpDelta)} LP this session`;

  return `${subjectOf(payload)} — ${rank.label}, ${rank.lp} LP${delta}`;
}

function sessionLine(payload: OverlayPayload): string {
  const s = payload.session;
  if (s.games === 0) return `${subjectOf(payload)} has not played a ranked game this session yet.`;

  return (
    `Session: ${s.wins}W ${s.losses}L (${s.winRate}%) · ` +
    `${s.kills}/${s.deaths}/${s.assists} · ${s.kda?.toFixed(2)} KDA`
  );
}

function lastGameLine(payload: OverlayPayload): string {
  const game = payload.lastGame;
  if (!game) return `${subjectOf(payload)} has no finished games to show yet.`;

  const minutes = Math.round(game.durationSeconds / 60);
  return (
    `Last game: ${game.championName} — ${game.win ? "Win" : "Loss"} · ` +
    `${game.kills}/${game.deaths}/${game.assists} · ` +
    `${game.csPerMinute.toFixed(1)} CS/min · ${minutes} min (${game.queueLabel})`
  );
}

function championsLine(payload: OverlayPayload): string {
  const champions = payload.champions.slice(0, 3);
  if (champions.length === 0) return `${subjectOf(payload)} has no champion stats yet.`;

  const parts = champions.map(
    (c) => `${c.championName} (${c.games}g, ${c.winRate}%, ${c.kda.toFixed(2)} KDA)`
  );
  return `Most played: ${parts.join(" · ")}`;
}

function promoLine(payload: OverlayPayload): string {
  const rank = payload.rank
    ? ` ${subjectOf(payload)} is ${payload.rank.label} (${payload.rank.lp} LP).`
    : "";
  return `LaneIQ reads your ranked history and tells you what is actually holding you back.${rank} ${PROMO_URL}`;
}

export function renderChatCommand(command: ChatCommand, payload: OverlayPayload): string {
  switch (command) {
    case "rank":
      return toChatLine(rankLine(payload));
    case "session":
      return toChatLine(sessionLine(payload));
    case "lastgame":
      return toChatLine(lastGameLine(payload));
    case "champs":
      return toChatLine(championsLine(payload));
    case "laneiq":
      return toChatLine(promoLine(payload));
  }
}
