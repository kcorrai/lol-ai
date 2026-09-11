import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/ogImage";

/**
 * The card every route falls back to.
 *
 * The root layout declares `twitter: { card: "summary_large_image" }` and there was no image
 * anywhere to fill it — no static one in `public/`, and `opengraph-image` files only inside the
 * `(tools)` and `(esports)` groups. So the home page, pricing, download, the champion index, the
 * academy, the marketplace and every shared recap link posted into Discord or Twitter as a bare
 * link with no picture: a large-image card declared and then not supplied renders worse than a
 * small one honestly declared.
 *
 * A file here is inherited by every segment below it, so the groups that already define their own
 * keep theirs and everything else gets this.
 */
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "LoL AI Coach — AI-powered League of Legends coaching";

export default function Image() {
  return renderOgImage({
    badge: "AI coaching · Free to start",
    title: "Stop being hardstuck",
    subtitle:
      "Connect your Riot account and get specific, honest feedback on what is actually holding you back.",
  });
}
