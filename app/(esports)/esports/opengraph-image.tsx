import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/ogImage";

// Section card. Match, team and player pages get their own dynamic cards in
// TASK-309; this is the fallback for everything under /esports until then.
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "LoL Esports — live scores, schedule and results";

export default function Image() {
  return renderOgImage({
    badge: "Free · No login",
    title: "LoL Esports",
    subtitle:
      "Live scores, the full schedule and results from every pro league — with the drafts, builds and pro stats behind them.",
  });
}
