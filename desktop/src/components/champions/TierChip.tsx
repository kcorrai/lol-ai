import { cn } from "@/lib/cn";

/**
 * A tier as a letter in a box.
 *
 * S is amber and not accent, which looks backwards until you count what else is on the
 * screen: the accent already marks the selected row, every good win rate and every filled
 * meter, and a fifth use of it would stop meaning anything (ADR-015). Amber is the rank
 * colour this product already uses for gold, and a top tier is a medal.
 *
 * D is red rather than grey because a D tier in this list is almost always a thin sample
 * rather than a bad champion, and the row says so beside it — the colour is what makes
 * somebody look.
 */
const TIERS: Record<string, string> = {
  S: "border-warning bg-warning/15 text-warning",
  A: "border-accent bg-accent/10 text-accent",
  B: "border-info bg-info/10 text-info",
  C: "border-line-2 bg-surface-dark text-text-muted",
  D: "border-danger bg-danger/10 text-danger",
};

export function TierChip({
  tier,
  size = "sm",
}: {
  /** The letter, not the number: `tierLetter` has already been applied. */
  tier: string;
  size?: "sm" | "lg";
}): React.ReactElement {
  return (
    <span
      aria-label={`Tier ${tier}`}
      className={cn(
        "tag-cut grid shrink-0 place-items-center border font-mono font-bold",
        size === "lg" ? "h-7 w-7 text-sm" : "h-[21px] w-[21px] text-[11px]",
        TIERS[tier] ?? TIERS.C
      )}
    >
      {tier}
    </span>
  );
}
