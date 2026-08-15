import Image from "next/image";
import { profileIconUrl, rankEmblemUrl, normalizeChampionKey } from "@/lib/ddragon";
import { tierColorClass, tierLabel } from "@/lib/riot/rankDisplay";
import { regionLabel } from "@/lib/riot/regions";
import type { PreviewResponse } from "@/types/preview";

interface Props {
  data: PreviewResponse;
  region: string;
}

export function ProfileHero({ data, region }: Props): React.ReactElement {
  const { summoner, rank, recentMatches, topChampions } = data;

  const seasonGames = rank ? rank.wins + rank.losses : 0;
  const seasonWr = seasonGames > 0 ? Math.round((rank!.wins / seasonGames) * 100) : null;
  const recentWins = recentMatches.filter((m) => m.win).length;

  const featured = topChampions[0]?.championName ?? null;
  const splashUrl = featured
    ? `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${normalizeChampionKey(featured)}_0.jpg`
    : null;

  return (
    <section className="notch-lg relative overflow-hidden border border-border bg-surface">
      {splashUrl && (
        <>
          <Image
            fill
            alt=""
            aria-hidden
            src={splashUrl}
            className="object-cover object-[60%_15%] opacity-[0.10]"
            style={{ filter: "blur(2px) saturate(0.45)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-surface/50 via-surface/85 to-surface" />
        </>
      )}

      <div className="relative flex flex-wrap items-center gap-5 p-5 md:p-7">
        <div className="relative shrink-0">
          <Image
            src={profileIconUrl(summoner.profileIconId)}
            alt=""
            aria-hidden
            width={72}
            height={72}
            unoptimized
            className="rounded-full border border-line-2"
          />
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 border border-line-2 bg-surface-dark px-1.5 font-mono text-[10px] text-text-muted">
            {summoner.summonerLevel}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-2xl font-extrabold uppercase text-text md:text-[28px]">
            {summoner.gameName}
            <span className="text-text-muted/60">#{summoner.tagLine}</span>
          </h1>
          <p className="hud-label mt-1">{regionLabel(region)}</p>
        </div>

        {/* The season record is the headline, not the last ten games: ten games is noise, and one
            win moves it ten points. Recent form gets its own, smaller tile. */}
        <div className="flex shrink-0 items-center gap-6">
          <div>
            <p className="hud-label">Rank</p>
            <div className="mt-1 flex items-center gap-2">
              {rank && (
                <Image
                  src={rankEmblemUrl(rank.tier)}
                  alt=""
                  aria-hidden
                  width={26}
                  height={26}
                  unoptimized
                />
              )}
              <span className={`font-mono text-base font-bold ${rank ? tierColorClass(rank.tier) : "text-text-muted"}`}>
                {rank ? `${tierLabel(rank.tier)} ${rank.division}` : "Unranked"}
              </span>
            </div>
            {rank && (
              <p className="mt-0.5 font-mono text-[11px] text-text-muted">
                {rank.lp} LP · {rank.wins}W {rank.losses}L
                {seasonWr !== null && ` · ${seasonWr}%`}
              </p>
            )}
          </div>

          {recentMatches.length > 0 && (
            <div>
              <p className="hud-label">Recent</p>
              <p className="mt-1 font-mono text-base font-bold text-text">
                {recentWins}
                <span className="text-text-muted">/{recentMatches.length}</span>
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-text-muted">last games won</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
