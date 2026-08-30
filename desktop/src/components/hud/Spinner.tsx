import { cn } from "@/lib/cn";

/**
 * Waiting, with no claim about how long.
 *
 * A ring rather than a progress bar, deliberately: every wait on these screens is a round
 * trip to the website through the core, and none of them can report how far along they are.
 * A bar that crept forward on a timer would be an invention.
 */
export function Spinner({
  size = 34,
  className,
}: {
  size?: number;
  className?: string;
}): React.ReactElement {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn("hud-spin block shrink-0 rounded-full border-2 border-line-2", className)}
      style={{ width: size, height: size, borderTopColor: "#C6FF3D" }}
    />
  );
}
