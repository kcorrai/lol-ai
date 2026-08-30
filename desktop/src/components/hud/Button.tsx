import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * The design system's button, as this window draws it.
 *
 * Written here rather than lifted from the website: the website's is a shadcn `Button`
 * carrying variants, slots and a class merger this app has no other use for, and ADR-039
 * shares the *stylesheet* between the two products, not the component tree. What is shared
 * is the appearance — display type, chamfered corners, accent fill, one pixel of travel on
 * press and never a scale.
 */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "border-accent bg-accent text-ink-1000 hover:bg-acid-400 active:bg-acid-600 hover:glow-accent-soft",
  secondary: "border-line-2 bg-ink-700 text-text hover:border-line-3 hover:bg-surface-2",
  ghost: "border-line-2 bg-transparent text-accent hover:bg-accent/10 hover:text-acid-400",
  danger: "border-danger bg-danger text-ink-1000 hover:bg-[#FF7373]",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-[30px] px-3.5 text-[11px]",
  md: "h-[38px] px-5 text-xs",
};

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  disabled,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  disabled?: boolean;
  className?: string;
}): React.ReactElement {
  const glyph = size === "sm" ? 15 : 16;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "notch-sm inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap border",
        "font-display font-bold uppercase tracking-[0.10em] transition-colors duration-150 ease-out",
        "active:translate-y-px",
        SIZES[size],
        // Disabled wins over the variant, so a greyed control cannot also carry a hover.
        disabled
          ? "cursor-not-allowed border-transparent bg-ink-600 text-text-faint"
          : cn("cursor-pointer", VARIANTS[variant]),
        className
      )}
    >
      {Icon ? <Icon aria-hidden style={{ width: glyph, height: glyph }} /> : null}
      {children}
      {IconRight ? <IconRight aria-hidden style={{ width: glyph, height: glyph }} /> : null}
    </button>
  );
}
