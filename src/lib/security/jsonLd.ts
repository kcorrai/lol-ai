// Characters that are harmless inside JSON but not inside an HTML `<script>` body, plus
// the two line terminators that are legal in JSON and illegal in a JavaScript source text.
// Keys are the raw characters; values are the JSON unicode escape that replaces them.
const ESCAPES: Record<string, string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

const HTML_SENSITIVE = /[<>&]|\u2028|\u2029/g;

/**
 * Serialises a JSON-LD object for injection into a `<script type="application/ld+json">`
 * tag via `dangerouslySetInnerHTML`.
 *
 * `JSON.stringify` alone is not safe there. It escapes nothing that matters to an HTML
 * parser: a string containing `</script>` closes the tag early and everything after it is
 * parsed as markup. Structured data on this site is built from names people choose — a
 * coach's display name and headline, a team name, and on `/s/[region]/[gameName]/[tagLine]`
 * the Riot ID taken straight out of the URL — so the payload is attacker-controlled, and the
 * site's own CSP allows inline script. That is a stored and reflected XSS, not a theoretical
 * one.
 *
 * Replacing them with unicode escapes leaves the value identical to a JSON parser (they are
 * legal escapes inside a JSON string) while making the breakout impossible.
 */
export function jsonLdHtml(data: unknown): string {
  return JSON.stringify(data).replace(HTML_SENSITIVE, (c) => ESCAPES[c] ?? c);
}

/** Ready-made prop object, so a call site stays one expression rather than two. */
export function jsonLdProps(data: unknown): { __html: string } {
  return { __html: jsonLdHtml(data) };
}
