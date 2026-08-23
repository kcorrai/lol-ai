import Image from "next/image";
import Link from "next/link";
import { championIconUrl, rankEmblemUrl } from "@/lib/ddragon";
import { POSITION_LABELS, tierColorClass, tierLabel } from "@/lib/riot/rankDisplay";
import type { LiveScoutPlayer } from "@/domains/riot";

interface Props {
  players: LiveScoutPlayer[];
  label: string;
  /** True for the side the searched player is on, which is the one worth colouring. */
  yours: boolean;
  region: string;
}

function winRate(rank: NonNullable<LiveScoutPlayer["rank"]>): number | null {
  const games = rank.wins + rank.losses;
  return games > 0 ? Math.round((rank.wins / games) * 100) : null;
}

function PlayerRow({ p, region }: { p: LiveScoutPlayer; region: string }): React.ReactElement {
  const [gameName, tagLine] = (p.riotId ?? "").split("#");
  const href =
    gameName && tagLine
      ? `/s/${region}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
      : null;
  const wr = p.rank ? winRate(p.rank) : null;

  return (
    <li
      className={`flex items-center gap-3 border-l-2 px-3 py-2 ${
        p.isSubject ? "border-accent bg-accent/10" : "border-transparent bg-surface-dark"
      }`}
    >
      {p.championKey ? (
        <Image
          src={championIconUrl(p.championKey)}
          alt={p.championKey}
          width={34}
          height={34}
          unoptimized
          className="shrink-0 border border-border"
        />
      ) : (
        <span className="block h-[34px] w-[34px] shrink-0 border border-border bg-surface" />
      )}

      <div className="min-w-0 flex-1">
        {/* The name is the point of this page, so it is the line that links out — but only when
            there is a real one. Riot anonymises some players and puts the champion where the Riot
            ID goes, and printing that as a name would invent an identity Riot deliberately hid. */}
        {href ? (
          <Link
            href={href}
            className={`block truncate text-[13px] transition-colors hover:text-accent ${
              p.isSubject ? "text-accent" : "text-text"
            }`}
          >
            {p.riotId}
          </Link>
        ) : (
          <span className="block truncate text-[13px] italic text-text-muted">
            {p.anonymous ? "Hidden by Riot" : "Name unavailable"}
          </span>
        )}
        <p className="hud-label truncate">
          {p.position ? POSITION_LABELS[p.position] : "Lane unknown"}
          {p.championKey ? ` · ${p.championKey}` : ""}
        </p>
      </div>

      <div className="shrink-0 text-right">
        {p.rank ? (
          <>
            <span className="flex items-center justify-end gap-1.5">
              <Image
                src={rankEmblemUrl(p.rank.tier)}
                alt=""
                aria-hidden
                width={16}
                height={16}
                unoptimized
              />
              <span className={`font-mono text-[11px] ${tierColorClass(p.rank.tier)}`}>
                {tierLabel(p.rank.tier)} {p.rank.division}
              </span>
            </span>
            <p className="font-mono text-[10px] text-text-muted">
              {p.rank.lp} LP{wr !== null ? ` · ${wr}%` : ""}
            </p>
          </>
        ) : (
          <span className="font-mono text-[11px] text-text-muted">
            {p.anonymous ? "—" : "Unranked"}
          </span>
        )}
      </div>
    </li>
  );
}

export function LiveTeamColumn({ players, label, yours, region }: Props): React.ReactElement {
  return (
    <section className="notch border border-border bg-surface p-4">
      <p className={`hud-label mb-3 ${yours ? "text-accent" : ""}`}>
        {`// ${label}`}
        {yours ? " · your side" : ""}
      </p>
      <ul className="space-y-1.5">
        {players.map((p) => (
          <PlayerRow key={p.puuid ?? `anon-${p.teamId}-${p.championId}`} p={p} region={region} />
        ))}
      </ul>
    </section>
  );
}
