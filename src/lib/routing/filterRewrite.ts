// The shape shared by every filter rewrite (ADR-061): a public page whose filters are search
// params is served from a static copy at an internal path that carries them as segments.
// Constants only — this is imported by middleware.

/** Stands in for a filter that is not set; never a valid filter value. */
export const ANY = "any";

/** The internal segment. Requests that name it directly are refused in middleware. */
export const FILTER_SEGMENT = "f";

export type FilterRoute =
  | { kind: "rewrite"; pathname: string }
  | { kind: "redirect"; pathname: string }
  | { kind: "not-found" }
  | null;

/** The segment back to the value the page expects, or undefined for "not set". */
export function fromSegment(segment: string): string | undefined {
  if (segment === ANY) return undefined;
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/** A value as a path segment, or the placeholder when it is not set. */
export function toSegment(value: string | null | undefined): string {
  return value ? encodeURIComponent(value) : ANY;
}
