import { AbilityClip } from "@/components/ui/AbilityClip";
import { abilityVideoUrl, championIconUrl } from "@/lib/ddragon";
import type { ClipBlock } from "@/domains/academy/types";

/**
 * Riot's own ability preview, inside the lesson about the champion it belongs to. The clip is
 * the one piece of moving picture the Academy shows, and it costs us nothing: it is Riot's
 * file on Riot's CDN, already allowed by the media CSP, and it loads only once a reader points
 * at it. The champion portrait stands in until then, and stays if the clip cannot be fetched.
 */
export function LessonClip({ block }: { block: ClipBlock }): React.ReactElement {
  return (
    <figure className="my-6">
      <div className="notch border border-line-1 bg-surface p-5">
        <AbilityClip
          videoUrl={abilityVideoUrl(String(block.championId), block.slot)}
          posterUrl={championIconUrl(block.championName)}
          alt={`${block.championName} ability preview`}
          className="mx-auto aspect-video w-full max-w-[420px] rounded ring-1 ring-line-2"
        />
        <p className="mt-4 text-[13.5px] leading-relaxed text-text-body">{block.note}</p>
      </div>
      <figcaption className="mt-2 font-mono text-[11px] text-text-faint">{block.caption}</figcaption>
    </figure>
  );
}
