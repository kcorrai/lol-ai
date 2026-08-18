import { Chip } from "@/domains/esports/components/Chip";

export interface ChipRowItem {
  key: string;
  label: string;
  href: string;
  active?: boolean;
}

interface ChipRowProps {
  /** The mono caption printed before the chips — "League", "Role", "Region". */
  label: string;
  items: ChipRowItem[];
  /** Read out to assistive tech; defaults to the visible caption. */
  ariaLabel?: string;
}

/** One labelled row of scope chips inside a filter console. */
export function ChipRow({ label, items, ariaLabel }: ChipRowProps): React.ReactElement | null {
  if (items.length === 0) return null;

  return (
    <nav aria-label={ariaLabel ?? label} className="flex flex-wrap items-center gap-1.5">
      <span className="hud-label mr-1">{label}</span>
      {items.map((item) => (
        <Chip key={item.key} href={item.href} active={item.active}>
          {item.label}
        </Chip>
      ))}
    </nav>
  );
}
