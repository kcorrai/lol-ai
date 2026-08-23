import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/ogImage";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Free LoL Tools";

export default function Image() {
  return renderOgImage({
    badge: "100% Free",
    title: "Free LoL Tools",
    subtitle:
      "Counter picks, matchups, draft analysis and tier lists — powered by real ranked data.",
  });
}
