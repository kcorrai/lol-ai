import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/ogImage";

// Section card, and the inherited fallback for every page under /esports that
// does not render its own — the schedule, the two indexes. Match, league, team
// and player pages each carry a card built from their own data.
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
