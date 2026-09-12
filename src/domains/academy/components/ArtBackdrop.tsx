import Image from "next/image";
import { championSplashUrl } from "@/lib/ddragon";

/**
 * Which way the darkness falls. `side` keeps the left column readable and lets the art
 * survive on the right — for headers with text beside the picture. `bottom` darkens the
 * floor instead, for cards whose text sits along the lower edge.
 */
type Scrim = "side" | "bottom";

interface ArtBackdropProps {
  /** Data Dragon champion key. */
  champion: string;
  scrim?: Scrim;
  /** CSS object-position for the splash — splashes are wide and the face is rarely centred. */
  focus?: string;
  /** How far the art comes up out of the dark. Kept low: this is a backdrop, not a picture. */
  opacity?: number;
  /** Viewport widths the art is drawn at, so Next serves one size rather than the 1215px original. */
  sizes?: string;
  scanline?: boolean;
}

const SCRIM: Record<Scrim, string> = {
  side: "bg-[linear-gradient(90deg,var(--ink-900)_8%,rgba(8,11,10,0.8)_50%,rgba(8,11,10,0.44))]",
  bottom: "bg-[linear-gradient(0deg,var(--ink-1000)_16%,rgba(5,7,6,0.44)_74%)]",
};

/**
 * Champion splash behind a panel, scrimmed down until it is texture rather than a picture.
 *
 * Decoration only — it carries no meaning a reader could miss, so it is hidden from
 * assistive tech and never the LCP candidate. The parent must be `relative overflow-hidden`.
 */
export function ArtBackdrop({
  champion,
  scrim = "side",
  focus = "58% 18%",
  opacity = 0.28,
  sizes = "100vw",
  scanline = true,
}: ArtBackdropProps): React.ReactElement {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <Image
        src={championSplashUrl(champion)}
        alt=""
        fill
        sizes={sizes}
        // Grayscale knocks the champion's own palette back so it cannot argue with the
        // one accent colour the section is allowed to use.
        className="object-cover brightness-[0.82] contrast-[1.1] grayscale-[0.36]"
        style={{ objectPosition: focus, opacity }}
      />
      <span className={`absolute inset-0 ${SCRIM[scrim]}`} />
      {scrim === "side" && (
        <span className="absolute inset-0 bg-[linear-gradient(0deg,var(--ink-900)_3%,rgba(8,11,10,0)_58%)]" />
      )}
      <span className="bg-scanline absolute inset-0" />
      {scanline && (
        <span className="absolute inset-x-0 h-[16%] animate-academy-scan bg-[linear-gradient(180deg,transparent,rgba(198,255,61,0.06),transparent)]" />
      )}
    </span>
  );
}
