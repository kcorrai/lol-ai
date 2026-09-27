import Image from "next/image";
import { cn } from "@/lib/utils";
import { roleIconUrl } from "@/lib/ddragon";
import { roleLabel } from "@/domains/marketplace/components/options";

interface RoleIconProps {
  role: string;
  /** Prints the role's name beside the glyph. */
  labelled?: boolean;
  size?: number;
  className?: string;
}

/** A position as the game client draws it, named the way players say it. */
export function RoleIcon({
  role,
  labelled,
  size = 16,
  className,
}: RoleIconProps): React.ReactElement {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Image
        src={roleIconUrl(role)}
        alt={labelled ? "" : roleLabel(role)}
        width={size}
        height={size}
        className="shrink-0 opacity-90"
      />
      {labelled && <span>{roleLabel(role)}</span>}
    </span>
  );
}
