"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HudPanel, HudRule } from "@/components/dashboard/laneiq/HudPanel";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { ALL_POSITIONS, POSITION_LABELS } from "@/domains/meta/positions";
import type { DraftTeam } from "@/domains/meta";
import type { DraftGameState, DraftSeriesState, DraftSide, ViewerRole } from "@/domains/draft";
import type { DraftSummary as Summary } from "@/domains/draft/services/draftSummaryService";
import { LaneEdges } from "./LaneEdges";
import { analyzerUrl, buildSummaryText } from "./summaryText";
import type { LiveLaneEdge } from "@/domains/draft/advice/laneEdges";

interface Props {
  state: DraftSeriesState;
  game: DraftGameState;
  role: ViewerRole;
  summary: Summary | undefined;
  laneEdges: LiveLaneEdge[];
  onSetWinner: (side: DraftSide) => void;
  pending: boolean;
}

export function DraftSummary({
  state,
  game,
  role,
  summary,
  laneEdges,
  onSetWinner,
  pending,
}: Props): React.ReactElement {
  const [copied, setCopied] = useState(false);
  const blueName = game.blueTeam === 1 ? state.team1Name : state.team2Name;
  const redName = game.blueTeam === 1 ? state.team2Name : state.team1Name;
  const nextGame = state.games.find((g) => g.gameNumber === game.gameNumber + 1);

  async function copySummary(): Promise<void> {
    if (!summary) return;
    await navigator.clipboard.writeText(
      buildSummaryText(
        state,
        game,
        summary.blue,
        summary.red,
        summary.evaluation?.verdict ?? null,
        `${window.location.origin}/draft/${state.code}?game=${game.gameNumber}`
      )
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <HudPanel className="p-4">
      <HudRule label={`GAME ${game.gameNumber} — DRAFT COMPLETE`} />

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <CompColumn team={summary?.blue} name={blueName} accent="text-accent-blue" />
        <CompColumn team={summary?.red} name={redName} accent="text-danger" />
      </div>

      {summary?.evaluation?.verdict && (
        <p className="mt-4 border-t border-border pt-4 text-[13px] leading-relaxed text-text-body">
          {summary.evaluation.verdict}
        </p>
      )}

      {laneEdges.length > 0 && (
        <div className="mt-4">
          <span className="hud-label">Lane edges</span>
          <div className="mt-2">
            <LaneEdges edges={laneEdges} />
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
        {role !== "SPECTATOR" && (
          <>
            <span className="text-[11.5px] text-text-muted">
              {game.winnerSide
                ? `Recorded: ${game.winnerSide === "BLUE" ? blueName : redName} won.`
                : "Who won?"}
            </span>
            <Button
              size="sm"
              variant={game.winnerSide === "BLUE" ? "default" : "outline"}
              onClick={() => onSetWinner("BLUE")}
              disabled={pending}
            >
              {blueName}
            </Button>
            <Button
              size="sm"
              variant={game.winnerSide === "RED" ? "default" : "outline"}
              onClick={() => onSetWinner("RED")}
              disabled={pending}
            >
              {redName}
            </Button>
          </>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {summary && (
          <Link
            href={analyzerUrl(summary.blue, summary.red)}
            target="_blank"
            rel="noopener"
            className="notch-sm inline-flex items-center gap-1.5 border border-border px-2.5 py-1.5 text-[11.5px] font-semibold text-text-body hover:bg-surface-2"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            Open in the draft analyser
          </Link>
        )}
        <button
          type="button"
          onClick={() => void copySummary()}
          disabled={!summary}
          className="notch-sm inline-flex items-center gap-1.5 border border-border px-2.5 py-1.5 text-[11.5px] font-semibold text-text-body hover:bg-surface-2 disabled:opacity-50"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-accent" aria-hidden />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden />
          )}
          {copied ? "Copied" : "Copy summary"}
        </button>
        {nextGame && (
          <Link
            href={`/draft/${state.code}?game=${nextGame.gameNumber}`}
            className="notch-sm inline-flex items-center gap-1.5 border border-accent bg-accent/10 px-2.5 py-1.5 text-[11.5px] font-semibold text-accent"
          >
            Go to game {nextGame.gameNumber}
          </Link>
        )}
      </div>
    </HudPanel>
  );
}

function CompColumn({
  team,
  name,
  accent,
}: {
  team: DraftTeam | undefined;
  name: string;
  accent: string;
}): React.ReactElement {
  return (
    <div>
      <p className={`mb-2 font-display text-[14px] font-bold ${accent}`}>{name}</p>
      <ul className="flex flex-col gap-1">
        {ALL_POSITIONS.map((lane) => (
          <li key={lane} className="flex items-center gap-2 text-[12px]">
            <span className="w-12 shrink-0 uppercase tracking-label text-text-faint">
              {POSITION_LABELS[lane]}
            </span>
            {team?.[lane] ? (
              <>
                <ChampionIcon name={team[lane]!} size={20} />
                <span className="text-text-body">{team[lane]}</span>
              </>
            ) : (
              <span className="text-text-faint">—</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
