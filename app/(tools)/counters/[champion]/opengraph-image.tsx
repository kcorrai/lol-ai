import { getCounterData, formatGamePatch } from "@/domains/meta";
import { fetchChampionDetail } from "@/lib/ddragon/championsData";
import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/ogImage";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Champion counters";

export default async function Image({ params }: { params: { champion: string } }) {
  const detail = await fetchChampionDetail(params.champion);
  const name = detail?.name ?? params.champion;
  const data = detail ? await getCounterData(detail.id) : null;

  const topCounters = data?.strongAgainstSubject
    .slice(0, 3)
    .map((c) => c.name)
    .join(" · ");

  return renderOgImage({
    badge: data ? `Patch ${formatGamePatch(data.patch)}` : "Counters",
    title: `${name} Counters`,
    subtitle: topCounters
      ? `Best picks to beat ${name}: ${topCounters}`
      : `The best champions to beat ${name}, by real ranked win rate.`,
  });
}
