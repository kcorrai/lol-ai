import { useState } from "react";
import { championIconUrl } from "@/lib/ddragon";
import { cn } from "@/lib/cn";

/**
 * A champion's portrait, square and outlined.
 *
 * A plain `<img>` rather than the website's `ChampionIcon`: that one is a `next/image`
 * behind a shim, and it rounds its corners — which is the one thing ADR-015 says shape here
 * never does. Squares with a one-pixel line, all the way down.
 *
 * The fallback is the first letters rather than a broken frame. Data Dragon is the only
 * remote host these screens need and it is reachable in practice, but a companion that has
 * to open while the player's connection is busy carrying a game cannot assume it.
 */
export function ChampionTile({
  /** A display name or a Data Dragon id — `championIconUrl` normalises either. */
  champion,
  size = 36,
  selected,
  className,
}: {
  champion: string;
  size?: number;
  selected?: boolean;
  className?: string;
}): React.ReactElement {
  const [failed, setFailed] = useState(false);

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden border bg-surface-dark",
        selected ? "border-accent" : "border-line-2",
        className
      )}
      style={{ width: size, height: size }}
    >
      {failed ? (
        <span
          aria-hidden
          className="font-mono uppercase tracking-[0.06em] text-text-faint"
          style={{ fontSize: size * 0.3 }}
        >
          {champion.slice(0, 2)}
        </span>
      ) : (
        <img
          src={championIconUrl(champion)}
          alt=""
          width={size}
          height={size}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      )}
    </span>
  );
}
