import Image from "next/image";
import Link from "next/link";
import { championIconUrl, profileIconUrl, rankEmblemUrl } from "@/lib/ddragon";
import { tierColorClass, tierLabel } from "@/lib/riot/rankDisplay";
import type { LobbyPlayer, LobbyScout } from "@/domains/riot";

function points(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
}

function PlayerCard({ p, region }: { p: LobbyPlayer; region: string }): React.ReactElement {
  const href = `/s/${region}/${encodeURIComponent(p.gameName)}/${encodeURIComponent(p.tagLine)}`;

  if (!p.found) {
    return (
      <li className="notch border border-dashed border-border bg-surface p-4">
        <p className="truncate text-[13px] text-text-muted">{p.riotId}</p>
        <p className="hud-label mt-1">Not on this platform</p>
      </li>
    );
  }

  return (
    <li className="notch border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        {p.profileIconId !== null && (
          <Image
            src={profileIconUrl(p.profileIconId)}
            alt=""
            aria-hidden
            width={38}
            height={38}
            unoptimized
            className="shrink-0 border border-border"
          />
        )}
        <div className="min-w-0 flex-1">
          <Link href={href} className="block truncate text-[13px] text-text hover:text-accent">
            {p.riotId}
          </Link>
          {p.summonerLevel !== null && <p className="hud-label">Level {p.summonerLevel}</p>}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {p.rank ? (
          <>
            <Image
              src={rankEmblemUrl(p.rank.tier)}
              alt=""
              aria-hidden
              width={22}
              height={22}
              unoptimized
            />
            <div>
              <p className={`font-mono text-[12px] font-bold ${tierColorClass(p.rank.tier)}`}>
                {tierLabel(p.rank.tier)} {p.rank.division}
              </p>
              <p className="font-mono text-[10px] text-text-muted">
                {p.rank.lp} LP · {p.rank.wins}W {p.rank.losses}L · {p.rank.winRate}%
              </p>
            </div>
          </>
        ) : (
          <p className="font-mono text-[12px] text-text-muted">Unranked</p>
        )}
      </div>

      {p.mastery.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          {/* Mastery rather than recent form: it is one cached call instead of six, and for a
              champion-select read "what do they actually play" is the question anyway. */}
          <p className="hud-label mb-2">Most played</p>
          <div className="space-y-1.5">
            {p.mastery.map((m) => (
              <div key={m.championId} className="flex items-center gap-2">
                <Image
                  src={championIconUrl(m.championName)}
                  alt=""
                  aria-hidden
                  width={22}
                  height={22}
                  unoptimized
                  className="shrink-0 border border-border"
                />
                <span className="min-w-0 flex-1 truncate text-[12px] text-text-body">
                  {m.championName}
                </span>
                <span className="shrink-0 font-mono text-[10px] text-text-muted">
                  {points(m.championPoints)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}

export function LobbyResults({ scout }: { scout: LobbyScout }): React.ReactElement | null {
  if (scout.players.length === 0) return null;

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {scout.players.map((p) => (
        <PlayerCard key={p.riotId} p={p} region={scout.region} />
      ))}
    </ul>
  );
}
