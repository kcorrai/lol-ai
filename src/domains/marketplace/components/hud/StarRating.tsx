import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  /** 0–5; fractions fill the last star partway. */
  value: number;
  size?: number;
  className?: string;
}

/**
 * Five stars with the last one filled to the fraction.
 *
 * A 4.6 drawn as five full stars is a rounding the reader never agreed to, so
 * the overlay is clipped to the exact share rather than rounded to a star.
 */
export function StarRating({ value, size = 14, className }: StarRatingProps): React.ReactElement {
  const clamped = Math.max(0, Math.min(5, value));

  return (
    <span
      className={cn("inline-flex gap-0.5", className)}
      role="img"
      aria-label={`${clamped.toFixed(1)} out of 5`}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, clamped - i));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star
              className="absolute inset-0 text-ink-400"
              style={{ width: size, height: size }}
              fill="currentColor"
              strokeWidth={0}
            />
            <span
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star
                className="text-accent"
                style={{ width: size, height: size }}
                fill="currentColor"
                strokeWidth={0}
              />
            </span>
          </span>
        );
      })}
    </span>
  );
}
