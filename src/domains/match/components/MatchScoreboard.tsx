"use client";

import Link from "next/link";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { ItemIcon } from "@/components/ui/ItemIcon";
import { cn } from "@/lib/utils";
import type { ParticipantDetail, TeamObjectives } from "@/domains/match";

interface MatchScoreboardProps {
  participants: ParticipantDetail[];
  userPuuid: string | null;
  winningTeam: number;
  objectives: Record<string, TeamObjectives> | null;
}

// Mirrors `toProfileSlug` in the identity domain. Inlined rather than imported
// because that module pulls Prisma in with it and this is a client component.
function profileHref(gameName: string, tagLine: string | null): string {
  return `/u/${`${gameName}-${tagLine ?? ""}`.replace(/[^a-zA-Z0-9-_]/g, "-")}`;
}

const COLS =
  "grid grid-cols-[minmax(0,1.5fr)_96px_78px_82px_108px_108px_66px_62px_148px] items-center gap-3.5 px-5";

function thousands(value: number): string {
  return `${(value / 1000).toFixed(1)}k`;
}

function TeamBlock({
  rows,
  won,
  userPuuid,
  objectives,
  maxDealt,
  maxTaken,
}: {
  rows: ParticipantDetail[];
  won: boolean;
  userPuuid: string | null;
  objectives: TeamObjectives | null;
  maxDealt: number;
  maxTaken: number;
}): React.JSX.Element {
  const kills = rows.reduce((s, p) => s + p.kills, 0);
  const gold = rows.reduce((s, p) => s + p.goldEarned, 0);
  const cs = rows.reduce((s, p) => s + p.cs, 0);
  const damage = rows.reduce((s, p) => s + p.damageDealt, 0);

  return (
    <div>
      <div
        className={cn(
          "flex flex-wrap items-center gap-3.5 border-b border-l-[3px] border-line-1 px-5 py-3",
          won ? "border-l-acid-500 bg-acid-500/10" : "border-l-danger bg-danger/5"
        )}
      >
        <span
          className={cn(
            "font-display text-sm font-extrabold uppercase tracking-widest",
            won ? "text-acid-500" : "text-danger"
          )}
        >
          {won ? "Victory" : "Defeat"}
        </span>
        <span className="ml-auto flex gap-5 font-mono text-[11px] tracking-wide text-fg-3">
          <span>
            <span className="text-fg-1">{kills}</span> kills
          </span>
          <span>
            <span className="text-fg-1">{thousands(damage)}</span> damage
          </span>
          <span>
            <span className="text-fg-1">{thousands(gold)}</span> gold
          </span>
          <span>
            <span className="text-fg-1">{cs}</span> CS
          </span>
          {objectives && (
            <span>
              <span className="text-fg-1">{objectives.towers}</span> towers
            </span>
          )}
        </span>
      </div>

      <div
        className={cn(
          COLS,
          "border-b border-line-1 bg-surface-dark py-2 font-mono text-[9.5px] uppercase tracking-label text-text-muted"
        )}
      >
        <span>Champion</span>
        <span>Rank</span>
        <span className="text-center">K/D/A</span>
        <span className="text-right">CS</span>
        <span className="text-right">Dealt</span>
        <span className="text-right">Taken</span>
        <span className="text-right">Gold</span>
        <span className="text-right">Vision</span>
        <span>Items</span>
      </div>

      {rows.map((p) => {
        const you = p.puuid === userPuuid;
        return (
          <div
            key={p.id}
            className={cn(
              COLS,
              "border-b border-l-2 border-line-1 py-2.5",
              you ? "border-l-acid-500 bg-acid-500/10" : "border-l-transparent"
            )}
          >
            <span className="flex min-w-0 items-center gap-3">
              <ChampionIcon name={p.championName} size={34} />
              <span className="min-w-0">
                <span
                  className={cn(
                    "block truncate text-[13px]",
                    you ? "text-acid-500" : "text-fg-1"
                  )}
                >
                  {p.championName}
                </span>
                {p.gameName ? (
                  <Link
                    href={profileHref(p.gameName, p.tagLine)}
                    data-tour={you ? "my-profile-link" : undefined}
                    className="block truncate font-mono text-[9.5px] tracking-wide text-fg-4 hover:text-acid-500 hover:underline"
                  >
                    {`${p.gameName}#${p.tagLine ?? ""}`}
                  </Link>
                ) : (
                  <span className="block truncate font-mono text-[9.5px] tracking-wide text-fg-4">
                    {p.position}
                  </span>
                )}
              </span>
            </span>

            <span className="font-mono text-[10px] uppercase tracking-wide text-warning">
              {p.rankTier ? `${p.rankTier} ${p.rankDivision ?? ""}`.trim() : "—"}
            </span>
            <span className="text-center font-mono text-[12.5px] tabular-nums text-fg-1">
              {p.kills}/{p.deaths}/{p.assists}
            </span>
            <span className="text-right font-mono text-xs tabular-nums text-fg-2">
              {p.cs} · {p.csPerMinute.toFixed(1)}/m
            </span>

            <span className="flex items-center justify-end gap-2">
              <span className="h-1 w-11 bg-surface-dark">
                <span
                  className="block h-1 bg-danger"
                  style={{ width: `${maxDealt > 0 ? (p.damageDealt / maxDealt) * 100 : 0}%` }}
                />
              </span>
              <span className="w-9 text-right font-mono text-[11.5px] text-fg-2">
                {thousands(p.damageDealt)}
              </span>
            </span>

            <span className="flex items-center justify-end gap-2">
              <span className="h-1 w-11 bg-surface-dark">
                <span
                  className="block h-1 bg-warning"
                  style={{ width: `${maxTaken > 0 ? (p.damageTaken / maxTaken) * 100 : 0}%` }}
                />
              </span>
              <span className="w-9 text-right font-mono text-[11.5px] text-fg-3">
                {thousands(p.damageTaken)}
              </span>
            </span>

            <span className="text-right font-mono text-xs tabular-nums text-fg-2">
              {thousands(p.goldEarned)}
            </span>
            <span className="text-right font-mono text-xs tabular-nums text-fg-3">
              {p.visionScore}
            </span>
            <span className="flex gap-1">
              {Array.from({ length: 6 }, (_, i) => p.itemIds[i] ?? null).map((id, i) => (
                <span key={i} className="block h-[22px] w-[22px] border border-line-1 bg-surface-dark">
                  {id ? <ItemIcon itemId={id} size={20} /> : null}
                </span>
              ))}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function MatchScoreboard({
  participants,
  userPuuid,
  winningTeam,
  objectives,
}: MatchScoreboardProps): React.JSX.Element {
  const maxDealt = Math.max(...participants.map((p) => p.damageDealt), 0);
  const maxTaken = Math.max(...participants.map((p) => p.damageTaken), 0);
  // Winning side first: the result is the first thing the reader is checking.
  const teams = [winningTeam, winningTeam === 100 ? 200 : 100];

  return (
    <section className="notch overflow-x-auto border border-border bg-surface">
      {/* The fixed columns alone total ~860px with gaps; anything less and the
          champion column is squeezed to nothing and its name truncates away. */}
      <div className="min-w-[1120px]">
        {teams.map((team) => (
          <TeamBlock
            key={team}
            rows={participants.filter((p) => p.teamId === team)}
            won={team === winningTeam}
            userPuuid={userPuuid}
            objectives={objectives?.[String(team)] ?? null}
            maxDealt={maxDealt}
            maxTaken={maxTaken}
          />
        ))}
      </div>
    </section>
  );
}
