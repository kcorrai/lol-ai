import Image from "next/image";

interface TeamCrestProps {
  src: string | null;
  /** Sits behind the logo when the feed has none — a crest is never blank. */
  code: string;
  /** Box size in pixels. The chamfer is scaled with it by `tag-cut`. */
  size?: number;
  /** Draws the accent outline, for the subject of the page. */
  accent?: boolean;
  className?: string;
}

/**
 * A team logo in its own inset tile.
 *
 * The tile exists so that logos of wildly different aspect ratios — a wordmark
 * beside a round crest — still line up in a row, and so the many teams with no
 * published logo occupy the same space as the ones that have one.
 */
export function TeamCrest({
  src,
  code,
  size = 28,
  accent = false,
  className = "",
}: TeamCrestProps): React.ReactElement {
  return (
    <span
      className={`tag-cut grid shrink-0 place-items-center bg-surface-dark ring-1 ${
        accent ? "ring-accent" : "ring-line-2"
      } ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {src ? (
        <Image
          src={src}
          alt=""
          width={size}
          height={size}
          className="object-contain"
          style={{ width: size * 0.72, height: size * 0.72 }}
          unoptimized
        />
      ) : (
        <span
          className="font-display font-bold uppercase leading-none text-text-muted"
          style={{ fontSize: Math.max(9, size * 0.34) }}
        >
          {code.slice(0, 3)}
        </span>
      )}
    </span>
  );
}
