// PoC: .rofl metadata extractor
// See ADR-007 for analysis and go/no-go decision.
//
// WHAT THIS DOES: Parses the unencrypted metadata JSON header from a .rofl file.
// WHAT IT CANNOT DO: Decode the encrypted game event payload (see ADR-007).
// STATUS: Reference implementation only — not called in production code.

import { Buffer } from "buffer";

const ROFL_MAGIC = "RIOT:ROFL:";
const MAGIC_LENGTH = 10;
const HEADER_OFFSET_POSITION = 12; // u16 at bytes 10-11 = length of signature; then u32 at 12-15 = header offset
const METADATA_LENGTH_OFFSET = 16; // u32 at 16-19 = metadata JSON length

export interface RoflParticipant {
  NAME: string;
  CHAMPIONS: string;
  SKIN: string;
  WIN: string;
  KILLS: string;
  DEATHS: string;
  ASSISTS: string;
  GOLD: string;
  LEVEL: string;
  MINIONS_KILLED: string;
  VISION_SCORE: string;
  ITEMS: string;
  [key: string]: string;
}

export interface RoflMetadata {
  gameVersion: string;
  gameLength: number;
  lastGameChunkId: number;
  lastKeyframeId: number;
  participants: RoflParticipant[];
  matchId?: string;
}

export type RoflParseResult = { ok: true; metadata: RoflMetadata } | { ok: false; error: string };

export function parseRoflBuffer(buffer: Buffer): RoflParseResult {
  // Validate magic bytes
  const magic = buffer.slice(0, MAGIC_LENGTH).toString("ascii");
  if (!magic.startsWith(RIOT_MAGIC_PREFIX)) {
    return { ok: false, error: "Not a valid .rofl file: missing RIOT:ROFL: magic bytes" };
  }

  if (buffer.length < 20) {
    return { ok: false, error: "File too small to contain a valid .rofl header" };
  }

  // Read header offset (u32 LE at byte 12)
  const headerOffset = buffer.readUInt32LE(HEADER_OFFSET_POSITION);
  // Read metadata JSON length (u32 LE at byte 16)
  const metadataLength = buffer.readUInt32LE(METADATA_LENGTH_OFFSET);

  if (headerOffset + metadataLength > buffer.length) {
    return { ok: false, error: "File truncated: metadata extends beyond file length" };
  }

  const metadataStart = headerOffset;
  const metadataEnd = metadataStart + metadataLength;
  const metadataRaw = buffer.slice(metadataStart, metadataEnd).toString("utf8").trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(metadataRaw) as Record<string, unknown>;
  } catch {
    return { ok: false, error: "Failed to parse metadata JSON from .rofl header" };
  }

  // statsJSON is a nested JSON string within the metadata
  const statsRaw = parsed["statsJSON"] as string | undefined;
  let participants: RoflParticipant[] = [];

  if (statsRaw) {
    try {
      const stats = JSON.parse(statsRaw) as RoflParticipant[];
      participants = Array.isArray(stats) ? stats : [];
    } catch {
      // Non-fatal: metadata without participant stats is still useful
    }
  }

  return {
    ok: true,
    metadata: {
      gameVersion: (parsed["gameVersion"] as string | undefined) ?? "unknown",
      gameLength: Number((parsed["gameLength"] as number | undefined) ?? 0),
      lastGameChunkId: Number((parsed["lastGameChunkId"] as number | undefined) ?? 0),
      lastKeyframeId: Number((parsed["lastKeyframeId"] as number | undefined) ?? 0),
      participants,
      matchId: parsed["matchId"] as string | undefined,
    },
  };
}

// This prefix is used only internally in this file
const RIOT_MAGIC_PREFIX = ROFL_MAGIC;

// Summary helper: converts raw participant records to a coaching-friendly summary
export function summarizeParticipants(participants: RoflParticipant[]): Array<{
  name: string;
  champion: string;
  won: boolean;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  gold: number;
}> {
  return participants.map((p) => ({
    name: p.NAME ?? "Unknown",
    champion: (p.CHAMPIONS ?? "").split("|")[0] ?? "Unknown",
    won: p.WIN === "Win",
    kills: Number(p.KILLS ?? 0),
    deaths: Number(p.DEATHS ?? 0),
    assists: Number(p.ASSISTS ?? 0),
    cs: Number(p.MINIONS_KILLED ?? 0),
    gold: Number(p.GOLD ?? 0),
  }));
}
