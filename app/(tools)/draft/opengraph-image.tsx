import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/ogImage";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Free LoL Draft Tool";

// Draft links travel through Discord, so the card is how most people first see
// this page.
export default function Image() {
  return renderOgImage({
    badge: "Free · No login",
    title: "LoL Draft Room",
    subtitle:
      "Full tournament pick/ban, fearless series in one link — with live pick advice from real patch data.",
  });
}
