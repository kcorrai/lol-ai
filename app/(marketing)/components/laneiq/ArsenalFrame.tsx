/**
 * Shared chrome for the Arsenal tab illustrations.
 *
 * Every panel is the same object — an inset instrument readout with a labelled
 * header — so the reader learns the shape once and the five tabs feel like five
 * views of one machine rather than five posters.
 */

export function Frame({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  // Border and a darker fill, not `well`: the inset shadow would draw a second
  // 1px edge inside this one, and `notch`'s clip-path cuts it at the chamfers
  // anyway — the same reason FreeToolsGrid keeps its glow off the art tiles.
  return (
    <div className="notch border border-border bg-surface-dark p-4">
      <p className="hud-label mb-3">{label}</p>
      {children}
    </div>
  );
}

export function Row({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <div className={`border-b border-border py-2.5 last:border-0 ${className}`}>{children}</div>
  );
}
