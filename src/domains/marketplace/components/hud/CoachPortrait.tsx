import { cn } from "@/lib/utils";
import { tierColorClass } from "@/lib/riot/rankDisplay";

interface CoachPortraitProps {
  name: string;
  /** Tints the frame. Omitted means an unranked, neutral frame. */
  tier?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE = {
  sm: "h-10 w-10 text-sm",
  md: "h-[62px] w-[62px] text-xl",
  lg: "h-20 w-20 text-2xl",
};

/**
 * A coach's frame: initials in a chamfered well, ringed in their tier colour.
 *
 * We host no avatars (nothing in this product uploads an image), so the frame
 * itself has to carry the identity — and tinting it by rank makes the one fact
 * about a coach that is actually verified the first thing a reader sees.
 */
export function CoachPortrait({
  name,
  tier,
  size = "md",
  className,
}: CoachPortraitProps): React.ReactElement {
  return (
    <span
      aria-hidden
      className={cn(
        "notch-sm flex shrink-0 items-center justify-center border border-current bg-surface-dark",
        "font-display font-extrabold uppercase tracking-[0.04em]",
        "shadow-[inset_0_0_0_3px_rgba(0,0,0,0.42)]",
        tier ? tierColorClass(tier) : "text-line-3",
        SIZE[size],
        className
      )}
    >
      {initials(name)}
    </span>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
