"use client";

import Link from "next/link";
import Image from "next/image";
import { profileIconUrl, championIconUrl, rankEmblemUrl } from "@/lib/ddragon";
import { tierColorClass, tierLabel } from "@/lib/riot/rankDisplay";
import type { PreviewResponse } from "@/types/preview";

interface Props {
  data: PreviewResponse;
}

export function PreviewResultCard({ data }: Props) {
  const { summoner, rank, recentMatches, topChampions, aiInsight } = data;
  const wins = recentMatches.filter(m => m.win).length;
  const totalGames = recentMatches.length;
  const recentWr = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  // The headline win rate is the season's, not the last five games'. Five games is
  // noise — one win swings it 20 points — and the tile beside it already shows the
  // season record, so a recent-form number here read as a contradiction.
  const seasonGames = rank ? rank.wins + rank.losses : 0;
  const seasonWr = seasonGames > 0 ? Math.round((rank!.wins / seasonGames) * 100) : null;
  const shownWr = seasonWr ?? recentWr;

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-surface-2 px-5 py-4">
        <Image
          src={profileIconUrl(summoner.profileIconId)}
          alt={summoner.gameName}
          width={40}
          height={40}
          unoptimized
          className="h-10 w-10 rounded-full border border-accent/40"
        />
        <div>
          <p className="font-semibold text-text">
            {summoner.gameName}
            <span className="text-text-muted">#{summoner.tagLine}</span>
          </p>
          <p className="text-xs text-text-muted">Level {summoner.summonerLevel}</p>
        </div>
        {rank && (
          <div className="ml-auto flex items-center gap-2.5">
            <Image
              src={rankEmblemUrl(rank.tier)}
              alt={`${tierLabel(rank.tier)} emblem`}
              width={32}
              height={32}
              unoptimized
              className="h-8 w-8 shrink-0"
            />
            <div className={`text-right text-sm font-bold ${tierColorClass(rank.tier)}`}>
              {tierLabel(rank.tier)} {rank.division}
              <p className="text-xs font-normal text-text-muted">{rank.lp} LP</p>
            </div>
          </div>
        )}
        {!rank && (
          <div className="ml-auto text-right text-sm font-medium text-text-muted">
            No Ranked
          </div>
        )}
      </div>

      <div className="space-y-4 p-5">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Recent Matches" value={`${wins}W / ${totalGames - wins}L`} />
          <Stat
            label={seasonWr !== null ? "Win Rate (Season)" : `Win Rate (Last ${totalGames})`}
            value={`${shownWr}%`}
            highlight={shownWr >= 50}
          />
          <Stat
            label={rank ? "Ranked (Season)" : "Ranked"}
            value={rank ? `${rank.wins}W / ${rank.losses}L` : "—"}
          />
        </div>

        {/* Recent matches */}
        {recentMatches.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
              Last {recentMatches.length} Matches
            </p>
            <div className="flex gap-1.5">
              {recentMatches.map((m, i) => (
                <div
                  key={i}
                  title={`${m.championName} — ${m.kills}/${m.deaths}/${m.assists}`}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-md border px-2 py-2 text-center ${
                    m.win
                      ? "border-success/30 bg-success/10"
                      : "border-danger/30 bg-danger/10"
                  }`}
                >
                  <span className="max-w-full truncate text-[10px] font-medium text-text">
                    {m.championName}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {m.kills}/{m.deaths}/{m.assists}
                  </span>
                  <span className={`text-[10px] font-semibold ${m.win ? "text-success" : "text-danger"}`}>
                    {m.win ? "W" : "L"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top champions */}
        {topChampions.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
              Favorite Champions
            </p>
            <div className="space-y-1.5">
              {topChampions.map(c => (
                <div key={c.championName} className="flex items-center gap-3 text-sm">
                  <Image
                    src={championIconUrl(c.championName)}
                    alt={c.championName}
                    width={24}
                    height={24}
                    unoptimized
                    className="h-6 w-6 shrink-0 rounded-md border border-border"
                  />
                  <span className="w-20 truncate font-medium text-text">{c.championName}</span>
                  <span className="text-xs text-text-muted">{c.games} matches</span>
                  <div className="flex-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                      <div
                        className={`h-full rounded-full ${c.winRate >= 50 ? "bg-success" : "bg-danger"}`}
                        style={{ width: `${c.winRate}%` }}
                      />
                    </div>
                  </div>
                  <span className={`w-10 text-right text-xs font-semibold ${c.winRate >= 50 ? "text-success" : "text-danger"}`}>
                    {c.winRate}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Insight — blurred */}
        <div className="relative overflow-hidden rounded-lg border border-accent/30 bg-accent/5 p-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-accent">
            AI Coach Analysis
          </p>
          <p className="text-sm leading-relaxed text-text-muted blur-[4px] select-none">
            {aiInsight}
          </p>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface/70 backdrop-blur-[1px]">
            <p className="text-xs font-semibold text-text">Link your account to see full analysis</p>
            <Link
              href="/register"
              className="rounded-md bg-accent px-5 py-2 text-xs font-semibold text-background transition-opacity hover:opacity-90"
            >
              Get Started Free →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-3 text-center">
      <p className={`text-base font-bold ${highlight ? "text-accent" : "text-text"}`}>{value}</p>
      <p className="mt-0.5 text-[10px] text-text-muted">{label}</p>
    </div>
  );
}
