// Game-clock text ↔ seconds.
//
// A coach reads "12:30" off the replay client, so that is what they type; the
// database stores seconds, because anchoring and sorting on text would mean
// parsing it every time anyway. Pure, so both the editor and the reader agree.

export const ANNOTATION_CATEGORIES = [
  { value: "LANING", label: "Laning" },
  { value: "MACRO", label: "Macro" },
  { value: "MICRO", label: "Mechanics" },
  { value: "VISION", label: "Vision" },
  { value: "DRAFT", label: "Draft" },
  { value: "POSITIONING", label: "Positioning" },
  { value: "MENTAL", label: "Mental" },
] as const;

/** Seconds as `m:ss`, or `h:mm:ss` once a game runs past the hour. */
export function secondsToClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/**
 * `mm:ss` or `h:mm:ss` as seconds.
 *
 * Forgiving on purpose — a coach typing fast produces "7:5" and "07:05", and
 * both plainly mean the same thing. Anything unparseable becomes 0 rather than
 * an error, because losing the note a coach just wrote to a typo in its
 * timestamp would be the worse failure.
 */
export function clockToSeconds(clock: string): number {
  const parts = clock
    .trim()
    .split(":")
    .map((part) => Number(part.trim()));

  if (parts.some((part) => !Number.isFinite(part) || part < 0)) return 0;

  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return 0;
}
