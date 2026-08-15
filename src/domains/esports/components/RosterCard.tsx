import Image from "next/image";
import Link from "next/link";
import type { EsportsPlayer, PlayerRole } from "@/domains/esports/types";

const ROLE_LABEL: Record<PlayerRole, string> = {
  top: "Top",
  jungle: "Jungle",
  mid: "Mid",
  bottom: "Bot",
  support: "Support",
};

/** One player. Links to their page when the caller resolved a slug for them. */
export function RosterCard({
  player,
  href,
}: {
  player: EsportsPlayer;
  href?: string;
}): React.ReactElement {
  const className = `gaming-card notch-sm flex items-center gap-3 px-3 py-2.5${
    href ? " transition-colors hover:border-line-2" : ""
  }`;

  const body = (
    <>
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
    </>
  );

  if (!href) return <article className={className}>{body}</article>;

  return (
    <Link href={href} className={className}>
      {body}
    </Link>
  );
}
