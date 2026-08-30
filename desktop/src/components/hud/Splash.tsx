import { championSplashUrl } from "@/lib/ddragon";
import { cn } from "@/lib/cn";

/**
 * Champion art, used as ground rather than as a picture.
 *
 * The window is a HUD and the design leans on splash art the way a scoreboard leans on a
 * team colour: it tells you at a glance whose screen this is, from across a desk, without
 * being read. So every one of these is desaturated, dimmed and buried under a gradient —
 * the numbers on top are the content, and art that competed with them would be a worse
 * screen, not a richer one.
 *
 * `aria-hidden` on all of it. The champion is named in text within a few pixels of every
 * one of these, and a second announcement of the same fact is noise.
 *
 * The URL is Data Dragon's, which this window's content policy admits. It is also the one
 * remote image that can fail slowly on a bad connection, which is why it is a background
 * rather than an `<img>`: a background that never arrives leaves the panel's own fill and
 * the reading on top of it exactly as they were.
 */
export function ChampionSplash({
  /** A display name or a Data Dragon id — `championSplashUrl` normalises either. */
  champion,
  opacity = 0.4,
  /** Which half of the panel it covers. `full` is the whole ground. */
  side = "full",
  /** Mirrored, so two champions facing each other look like they are. */
  flip,
  /** CSS `background-position`. The default frames most portraits on the face. */
  position = "56% 20%",
  className,
}: {
  champion: string;
  opacity?: number;
  side?: "left" | "right" | "full";
  flip?: boolean;
  position?: string;
  className?: string;
}): React.ReactElement {
  const half =
    side === "full"
      ? "inset-0"
      : side === "left"
        ? "left-0 top-0 bottom-0"
        : "right-0 top-0 bottom-0";

  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute bg-cover", half, className)}
      style={{
        width: side === "full" ? undefined : "56%",
        backgroundImage: `url(${championSplashUrl(champion)})`,
        backgroundPosition: position,
        opacity,
        filter: "grayscale(.3) contrast(1.12)",
        transform: flip ? "scaleX(-1)" : undefined,
      }}
    />
  );
}

/**
 * A band of light crawling down a panel, so a still image reads as a live readout.
 *
 * Decoration, and it says so: it carries no state and stops entirely under reduced motion.
 * The red variant is for the panels that are reporting a failure, where a calm accent-green
 * sweep would be saying the opposite of the words under it.
 */
export function ScanBand({ tone = "accent" }: { tone?: "accent" | "danger" }): React.ReactElement {
  const colour = tone === "danger" ? "rgba(255,90,90,.07)" : "rgba(198,255,61,.06)";

  return (
    <span
      aria-hidden
      className="hud-scan pointer-events-none absolute inset-x-0 h-[18%]"
      style={{ background: `linear-gradient(180deg, transparent, ${colour}, transparent)` }}
    />
  );
}
