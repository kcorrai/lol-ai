import { getTierList, formatGamePatch } from "@/domains/meta";
import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/ogImage";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "LoL Tier List";

export default async function Image() {
  const list = await getTierList("MIDDLE");
  const top = list?.entries.slice(0, 3).map((e) => e.name).join(" · ");

  return renderOgImage({
    badge: list ? `Patch ${formatGamePatch(list.patch)}` : "Tier List",
    title: "LoL Tier List",
    subtitle: top
      ? `The strongest champions this patch, by win rate. Top mid: ${top}.`
      : "The strongest champions per lane this patch, ranked by win rate.",
  });
}
