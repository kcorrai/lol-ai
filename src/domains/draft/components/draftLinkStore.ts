export interface DraftLinks {
  blueToken: string;
  redToken: string;
}

const key = (code: string): string => `draft:${code}:links`;

/**
 * Both drafter tokens, kept for the creator only.
 *
 * The room itself can never reconstruct the opposite side's link — that is the
 * point of the capability model — but the person who made the draft still has to
 * hand it out. `sessionStorage` keeps that to the tab they created it in, so the
 * link does not survive into a shared machine or a stream overlay.
 */
export function rememberDraftLinks(code: string, links: DraftLinks): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(key(code), JSON.stringify(links));
}

export function readDraftLinks(code: string): DraftLinks | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(key(code));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<DraftLinks>;
    if (!parsed.blueToken || !parsed.redToken) return null;
    return { blueToken: parsed.blueToken, redToken: parsed.redToken };
  } catch {
    return null;
  }
}

export function forgetDraftLinks(code: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(key(code));
}
