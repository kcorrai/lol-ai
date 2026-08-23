import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/ogImage";

// Default social card for every free-tool route that doesn't define its own
// (counters/[champion] and matchups/[slug] override this with dynamic cards).
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Free LoL Tools — LoL AI Coach";

export default function Image() {
  return renderOgImage({
    badge: "100% Free · No login",
    title: "Free LoL Tools",
    subtitle:
      "Counter picker, matchup analyzer, draft analyzer, tier lists and champion builds — from real ranked data.",
  });
}
