import { cn } from "@/lib/cn";

/**
 * A chip: a filter that is on or off, or a label that is neither.
 *
 * Rendered as a button only when it does something. A `<span>` that responds to clicks is
 * one a keyboard cannot reach and a screen reader does not announce, and this window is a
 * column of small controls where that would add up.
 */
export function Tag({
  children,
  active,
  onClick,
  className,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}): React.ReactElement {
  const skin = cn(
    "inline-flex items-center gap-2 border px-2.5 py-[5px] text-xs tracking-[0.04em]",
    "transition-colors duration-150 ease-out",
    active
      ? "border-accent bg-accent/10 text-accent"
      : "border-line-2 bg-transparent text-text-body",
    className
  );

  if (!onClick) {
    return <span className={skin}>{children}</span>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(skin, "cursor-pointer hover:border-line-3 hover:text-text")}
    >
      {children}
    </button>
  );
}
