// Stripping contact details out of messages.
//
// Every marketplace in this category loses revenue to the same move: two people
// meet on the platform, swap a Discord tag, and settle up somewhere else. Metafy
// bans it in its terms and enforces it by keeping first contact on-platform;
// Airbnb is the most documented automated version, and its own engineering
// writing is candid that a regex is circumventable.
//
// So this is deliberately modest. It removes what a person types when they are
// not trying to hide it, marks the message as redacted, and leaves the rest to
// the terms of service. Chasing leetspeak and spelled-out digits would cost
// more in false positives — a coach saying "play at 9 30" is not swapping a
// phone number — than the leakage is worth at this size.

const MASK = "[removed]";

/**
 * Ordered so the greedier patterns run before the ones they contain.
 *
 * The reader-facing label lives on the pattern rather than in a lookup table
 * beside it. A table needs a fallback for a name it does not know, that
 * fallback is unreachable while the two agree, and an unreachable branch is
 * exactly the kind of thing that stops being unreachable the day somebody adds
 * a sixth pattern and forgets the table.
 */
const PATTERNS: readonly { name: string; label: string; pattern: RegExp }[] = [
  {
    name: "email",
    label: "an email address",
    pattern: /[a-z0-9._%+-]+\s*(?:@|\(at\)|\[at\])\s*[a-z0-9.-]+\.[a-z]{2,}/gi,
  },
  // Invite links first, so the bare-domain rule below cannot eat half of one.
  {
    name: "invite",
    label: "an invite link",
    pattern: /\b(?:https?:\/\/)?(?:www\.)?(?:discord\.(?:gg|com\/invite)|t\.me|wa\.me|join\.skype\.com)\/\S+/gi,
  },
  {
    name: "discord",
    label: "a Discord tag",
    pattern: /\b(?:discord|disc)\s*(?:id|tag|user(?:name)?)?\s*[:#-]\s*\S{2,32}/gi,
  },
  // Long enough to be a real number, loose enough to catch the usual spacing.
  // The optional leading bracket matters: without it "(555) 123-4567" matches
  // from the 5 and leaves a stray "(" sitting in front of the mask.
  {
    name: "phone",
    label: "a phone number",
    pattern: /(?<!\d)\(?\+?\d[\d\s().-]{8,17}\d(?!\d)/g,
  },
  { name: "handle", label: "a handle", pattern: /(?:^|\s)@[a-z0-9_.]{3,30}\b/gi },
];

export interface RedactionResult {
  text: string;
  redacted: boolean;
  /** Which kinds of thing were removed, for a warning that says something useful. */
  kinds: string[];
  /** The same list, as a reader should see it. */
  labels: string[];
}

/**
 * Remove contact details from a message.
 *
 * Returns what will be stored. The original is never kept — a detail that can
 * be recovered from the row later has not really been removed, and keeping it
 * would make the table a nice list of everyone's phone numbers.
 */
export function redactContacts(input: string): RedactionResult {
  let text = input;
  const kinds: string[] = [];
  const labels: string[] = [];

  for (const { name, label, pattern } of PATTERNS) {
    // `lastIndex` is per-regex state and these are module-level, so it has to be
    // reset or a second call skips the start of the string.
    pattern.lastIndex = 0;
    if (!pattern.test(text)) continue;

    pattern.lastIndex = 0;
    text = text.replace(pattern, (match) => {
      // Keep any leading whitespace the pattern swallowed, so words do not run
      // together after the mask.
      const lead = /^\s/.test(match) ? match[0] : "";
      return `${lead}${MASK}`;
    });
    kinds.push(name);
    labels.push(label);
  }

  return { text, redacted: kinds.length > 0, kinds, labels };
}

/** A warning naming what was taken out, or null when nothing was. */
export function redactionNotice(result: RedactionResult): string | null {
  if (!result.redacted) return null;

  const what = result.labels.join(" and ");

  return `We removed ${what} from that message. Keep sessions on LaneIQ — off-platform arrangements are not covered if something goes wrong.`;
}
