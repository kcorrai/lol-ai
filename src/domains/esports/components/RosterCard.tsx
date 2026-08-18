import Image from "next/image";
import Link from "next/link";
import { ROLE_SHORT } from "@/domains/esports/roles";
import type { EsportsPlayer } from "@/domains/esports/types";

/**
 * One player.
 *
 * Every card is drawn the same. The feed publishes a lane for substitutes as
 * readily as for the five who start, so there is nothing here to hang a
 * "starter" outline on — and fourteen accented cards would claim a distinction
 * the data cannot make. The lane badge says what is actually known.
 */
export function RosterCard({
  player,
  href,
}: {
  player: EsportsPlayer;
  href?: string;
}): React.ReactElement {
  const lane = player.role ? ROLE_SHORT[player.role] : null;

  const className = [
    "notch-sm flex items-center gap-3 border border-line-1 bg-surface px-3.5 py-3",
    href ? "transition-colors hover:border-line-3 hover:bg-surface-2" : "",
  ].join(" ");

  const body = (
    <>
      {player.image ? (
        <Image
          src={player.image}
          alt=""
          width={40}
          height={40}
          className="tag-cut h-10 w-10 shrink-0 bg-surface-dark object-cover object-top"
          aria-hidden
          unoptimized
        />
      ) : (
        <span className="tag-cut h-10 w-10 shrink-0 bg-surface-dark" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2">
          <span className="truncate font-display text-[15px] font-extrabold uppercase tracking-[0.05em] text-text">
            {player.handle}
          </span>
          {lane && (
            <span className="tag-cut shrink-0 bg-surface-2 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-label text-accent">
              {lane}
            </span>
          )}
        </p>
        <p className="mt-0.5 truncate font-mono text-[9.5px] tracking-[0.12em] text-text-faint">
          {player.fullName ?? (lane ? "Name unpublished" : "Substitute / staff")}
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
