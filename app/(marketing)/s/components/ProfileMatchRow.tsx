"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { MatchScoreboard } from "@/domains/match/components/MatchScoreboard";
import { queueLabel } from "@/domains/match/archive/archiveLabels";
import { championIconUrl, itemIconUrl } from "@/lib/ddragon";
import { keystoneIconUrl, runePathIconUrl, summonerSpellUrl } from "@/lib/ddragonRunes";
import { POSITION_LABELS } from "@/lib/riot/rankDisplay";
import type { PreviewMatch, PreviewScoreboard } from "@/types/preview";
import { formatDuration, kdaRatioLabel, timeAgo } from "./matchRowFormat";

interface Props {
  match: PreviewMatch;
  /** Absent while a page of rows is still loading its scoreboards — the row just will not expand. */
  scoreboard: PreviewScoreboard | null;
  /** The searched player, so their row is the highlighted one inside the scoreboard. */
  puuid: string | null;
  region: string;
  /** Fixed per render of the list so ten rows cannot disagree about what "3h ago" means. */
  now: number;
}

const ITEM_SLOTS = 6;

function ItemSlot({ id }: { id: number }): React.ReactElement {
  return (
    <span className="block h-[22px] w-[22px] border border-border bg-surface-dark">
      {id > 0 ? (
        <Image src={itemIconUrl(id)} alt="" aria-hidden width={22} height={22} unoptimized />
      ) : null}
    </span>
  );
}

/**
 * One 20px spell or rune tile.
 *
 * `summonerSpellUrl` and the two rune helpers answer `""` for an id they do not have a name for,
 * and their tables are not exhaustive — every new keystone is unknown until someone adds it. An
 * empty `src` makes `next/image` throw, so the miss is drawn as the same empty box an unfilled
 * item slot uses; the row keeps its shape either way.
 */
function SpellOrRune({ src, alt }: { src: string; alt: string }): React.ReactElement {
  return (
    <span className="block h-5 w-5 border border-border bg-surface-dark">
      {src ? <Image src={src} alt={alt} width={20} height={20} unoptimized /> : null}
    </span>
  );
}

export function ProfileMatchRow({
  match,
  scoreboard,
  puuid,
  region,
  now,
}: Props): React.ReactElement {
  const [open, setOpen] = useState(false);
  const expandable = scoreboard !== null;

  return (
    <li className={`border-l-2 bg-surface-dark ${match.win ? "border-accent" : "border-danger"}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5">
        {/* Result + when + how long: the three things read before anything else on the row. */}
        <div className="w-[92px] shrink-0">
          <p
            className={`font-mono text-[10px] font-bold uppercase tracking-label ${
              match.win ? "text-accent" : "text-danger"
            }`}
          >
            {match.win ? "Win" : "Loss"}
          </p>
          <p className="hud-label">{match.queueType ? queueLabel(match.queueType) : "Match"}</p>
          <p className="font-mono text-[10px] text-text-muted">
            {timeAgo(match.gameEndedAt, now)} · {formatDuration(match.gameDurationSeconds)}
          </p>
        </div>

        {/* Champion, level, spells, runes — the loadout. */}
        <div className="flex shrink-0 items-center gap-2">
          <span className="relative">
            <Image
              src={championIconUrl(match.championName)}
              alt={match.championName}
              width={40}
              height={40}
              unoptimized
              className="block border border-border"
            />
            <span className="absolute -bottom-1 -right-1 bg-surface px-1 font-mono text-[9px] text-text">
              {match.champLevel}
            </span>
          </span>
          <span className="flex flex-col gap-0.5">
            <SpellOrRune src={summonerSpellUrl(match.summonerSpell1)} alt="Summoner spell" />
            <SpellOrRune src={summonerSpellUrl(match.summonerSpell2)} alt="Summoner spell" />
          </span>
          <span className="flex flex-col gap-0.5">
            {match.runePrimaryKeystone !== null && (
              <SpellOrRune src={keystoneIconUrl(match.runePrimaryKeystone)} alt="Keystone" />
            )}
            {match.runeSecondaryPath !== null && (
              <SpellOrRune src={runePathIconUrl(match.runeSecondaryPath)} alt="Secondary path" />
            )}
          </span>
        </div>

        <div className="min-w-[104px] shrink-0">
          <p className="truncate text-[13px] text-text">{match.championName}</p>
          <p className="hud-label">{POSITION_LABELS[match.position] ?? match.position}</p>
        </div>

        <div className="w-[86px] shrink-0 text-right">
          <p className="font-mono text-[13px] text-text">
            {match.kills}/{match.deaths}/{match.assists}
          </p>
          <p className="font-mono text-[10px] text-text-muted">
            {kdaRatioLabel(match.kills, match.deaths, match.assists)} KDA
          </p>
        </div>

        <div className="w-[92px] shrink-0 text-right">
          <p className="font-mono text-[12px] text-text-body">
            {match.cs} CS ({match.csPerMinute.toFixed(1)})
          </p>
          <p className="font-mono text-[10px] text-text-muted">
            {Math.round(match.killParticipation * 100)}% KP · {match.visionScore} vis
          </p>
        </div>

        <div className="flex shrink-0 gap-1">
          {Array.from({ length: ITEM_SLOTS }, (_, i) => (
            <ItemSlot key={i} id={match.itemIds[i] ?? 0} />
          ))}
          <ItemSlot id={match.trinketId} />
        </div>

        {expandable && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Hide the scoreboard" : "Show the scoreboard"}
            className="ml-auto p-1 text-text-muted transition-colors hover:text-accent"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      {open && scoreboard && (
        <div className="border-t border-border p-3">
          <MatchScoreboard
            participants={scoreboard.participants}
            userPuuid={puuid}
            winningTeam={scoreboard.winningTeam}
            objectives={null}
            profileRegion={region}
          />
        </div>
      )}
    </li>
  );
}
