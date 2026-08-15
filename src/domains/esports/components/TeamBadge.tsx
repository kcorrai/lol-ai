import Image from "next/image";
import type { EsportsEventTeam } from "@/domains/esports/types";

interface TeamBadgeProps {
  team: EsportsEventTeam;
  /** Renders the pair mirrored, so both teams face the scoreline. */
  align?: "left" | "right";
  /** Dims the badge — used for the losing side of a finished series. */
  muted?: boolean;
}

const LOGO_PX = 28;

/**
 * A team's logo and code. Falls back to the code alone when the feed has no
 * logo, which is common for tier-2 teams and stand-ins.
 */
export function TeamBadge({
  team,
  align = "left",
  muted = false,
}: TeamBadgeProps): React.ReactElement {
  const logo = team.image ? (
    <Image
      src={team.image}
      alt=""
      width={LOGO_PX}
      height={LOGO_PX}
      className={`h-7 w-7 shrink-0 object-contain ${muted ? "opacity-40" : ""}`}
      // Logos are decorative here: the team code beside them carries the name.
      aria-hidden
      unoptimized
    />
  ) : (
    <span className="h-7 w-7 shrink-0" aria-hidden />
  );

  return (
    <div
      className={`flex min-w-0 items-center gap-2 ${align === "right" ? "flex-row-reverse text-right" : ""}`}
    >
      {logo}
      <span
        className={`truncate font-display text-sm font-bold uppercase ${muted ? "text-text-muted" : "text-text"}`}
        title={team.name}
      >
        {team.code || team.name}
      </span>
    </div>
  );
}
