/**
 * Carrying "this profile is mine" from a public page through sign-up to a connected account.
 *
 * Three separate params rather than one packed string: Riot IDs allow spaces and punctuation, so
 * any separator we picked would be a parsing bug waiting for the right name.
 */

export interface ClaimTarget {
  region: string;
  gameName: string;
  tagLine: string;
}

const REGION = "claimRegion";
const NAME = "claimName";
const TAG = "claimTag";

/** Query string carrying a claim, without the leading `?`. */
export function claimQuery(target: ClaimTarget): string {
  return new URLSearchParams({
    [REGION]: target.region,
    [NAME]: target.gameName,
    [TAG]: target.tagLine,
  }).toString();
}

/** The claim in a URL, or null when there is not a complete one. */
export function parseClaim(params: URLSearchParams | null): ClaimTarget | null {
  if (!params) return null;

  const region = params.get(REGION)?.trim();
  const gameName = params.get(NAME)?.trim();
  const tagLine = params.get(TAG)?.trim();

  if (!region || !gameName || !tagLine) return null;
  return { region: region.toLowerCase(), gameName, tagLine };
}

/** Whether a claim points at an account the user has already connected. */
export function isAlreadyConnected(
  target: ClaimTarget,
  accounts: ReadonlyArray<{ gameName: string; tagLine: string; region: string }>
): boolean {
  const wanted = `${target.region}:${target.gameName}#${target.tagLine}`.toLowerCase();
  return accounts.some((a) => `${a.region}:${a.gameName}#${a.tagLine}`.toLowerCase() === wanted);
}
