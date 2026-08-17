import type { ChipOption } from "@/domains/marketplace/components/ChipSelect";

// Picker options shared by the coach-side forms and the storefront filters, so
// the two never drift into offering different sets of the same field.

/**
 * The languages a coach can list, as ISO 639-1 codes.
 *
 * Not every language in the world — a list nobody can scan is one nobody fills
 * in honestly. These are the ones LoL's own regions actually run in, plus the
 * ones that turn up across them.
 */
export const LANGUAGE_OPTIONS: ChipOption[] = [
  { value: "en", label: "English" },
  { value: "tr", label: "Türkçe" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "pt", label: "Português" },
  { value: "it", label: "Italiano" },
  { value: "pl", label: "Polski" },
  { value: "ru", label: "Русский" },
  { value: "ko", label: "한국어" },
  { value: "ja", label: "日本語" },
  { value: "zh", label: "中文" },
  { value: "ar", label: "العربية" },
];

/** The five positions, labelled the way players say them rather than the way Riot spells them. */
export const ROLE_OPTIONS: ChipOption[] = [
  { value: "TOP", label: "Top" },
  { value: "JUNGLE", label: "Jungle" },
  { value: "MIDDLE", label: "Mid" },
  { value: "BOTTOM", label: "ADC" },
  { value: "UTILITY", label: "Support" },
];

/** The three things a coach can sell, named the way a student would ask for them. */
export const KIND_OPTIONS: ChipOption[] = [
  { value: "VOD_REVIEW", label: "Replay review" },
  { value: "LIVE_SESSION", label: "Live 1:1 session" },
  { value: "LIVE_SPECTATE", label: "Live game coaching" },
];

const KIND_LABELS = new Map(KIND_OPTIONS.map((o) => [o.value, o.label]));

/** A session kind as a reader should see it. */
export function kindLabel(kind: string): string {
  return KIND_LABELS.get(kind) ?? kind;
}

const LANGUAGE_LABELS = new Map(LANGUAGE_OPTIONS.map((o) => [o.value, o.label]));
const ROLE_LABELS = new Map(ROLE_OPTIONS.map((o) => [o.value, o.label]));

/** A language code as a reader should see it; the raw code if we do not know it. */
export function languageLabel(code: string): string {
  return LANGUAGE_LABELS.get(code) ?? code.toUpperCase();
}

/** A position as players say it; the raw value if we do not know it. */
export function roleLabel(role: string): string {
  return ROLE_LABELS.get(role) ?? role;
}
