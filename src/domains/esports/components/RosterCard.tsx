import Image from "next/image";
import type { EsportsPlayer, PlayerRole } from "@/domains/esports/types";

const ROLE_LABEL: Record<PlayerRole, string> = {
  top: "Top",
  jungle: "Jungle",
  mid: "Mid",
  bottom: "Bot",
  support: "Support",
};

/**
 * One player. Not a link yet — player pages land in TASK-302, and the handle is
 * the thing readers scan for, so it leads.
 */
export function RosterCard({ player }: { player: EsportsPlayer }): React.ReactElement {
  return (
    <article className="gaming-card notch-sm flex items-center gap-3 px-3 py-2.5">
      {player.image ? (
        <Image
          src={player.image}
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 object-cover object-top"
          aria-hidden
          unoptimized
        />
      ) : (
        <span className="h-10 w-10 shrink-0 bg-surface-2" aria-hidden />
      )}
      <div className="min-w-0">
        <p className="truncate font-display text-sm font-bold uppercase text-text">
          {player.handle}
        </p>
        <p className="truncate text-[11px] text-text-faint">
          {player.role ? ROLE_LABEL[player.role] : "Substitute / staff"}
          {player.fullName ? ` · ${player.fullName}` : ""}
        </p>
      </div>
    </article>
  );
}
