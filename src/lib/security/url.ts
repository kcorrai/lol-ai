import { z } from "zod";

/**
 * The schema for any URL a person types and another person's browser then follows.
 *
 * `z.string().url()` is not that. It accepts anything the `URL` constructor parses,
 * and `javascript:alert(1)` and `data:text/html,...` both parse — so a coach could
 * put either into the meeting link on a booking, or into the source link on a replay
 * review, and the student's browser would run it the moment they clicked. React
 * escapes text; it does not vet an `href` scheme.
 *
 * Limiting the scheme to http and https is what makes those values safe to render.
 * A blank host is rejected too, so `https:///` cannot slip through.
 */
export const httpUrl = z
  .string()
  .trim()
  .max(500)
  .refine((value) => {
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      return false;
    }
    return (parsed.protocol === "https:" || parsed.protocol === "http:") && parsed.host !== "";
  }, "Must be an http or https URL");

/**
 * Runtime guard for a URL that is already stored. Values written before the schema
 * above existed were never checked, so a link out of the database is not trustworthy
 * on the strength of having been accepted once.
 */
export function isSafeHttpUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  return httpUrl.safeParse(value).success;
}

/** The value to hand an `href`, or `null` when the stored one must not be followed. */
export function safeHref(value: string | null | undefined): string | null {
  return isSafeHttpUrl(value) ? (value as string) : null;
}
