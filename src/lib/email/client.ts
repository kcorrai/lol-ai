import { Resend } from "resend";

// Singleton — returns null when RESEND_API_KEY is not configured so callers
// can gracefully skip email sending in development/test.
let _client: Resend | null = null;

export function getEmailClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  _client ??= new Resend(apiKey);
  return _client;
}

export const EMAIL_FROM = process.env.EMAIL_FROM ?? "LoL AI Coach <noreply@lolaicoach.gg>";
