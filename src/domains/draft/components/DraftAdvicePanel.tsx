"use client";

import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { HudPanel, HudRule } from "@/components/dashboard/laneiq/HudPanel";
import type { DraftAdvice } from "@/domains/draft/advice/advice.types";
import { CompReadout } from "./CompReadout";

interface Props {
  advice: DraftAdvice | null;
  patch: string;
  onSelect: (championKey: string) => void;
  /** Hidden from spectators and from the opposing drafter while the game runs. */
  visible: boolean;
}

/**
 * What the patch data says about the turn in front of you.
 *
 * Visible to your own side only, and only while the game is live — a scrim tool
 * that leaks your shortlist to the other bench is a scrim tool nobody uses
 * twice. Everything here is arithmetic over numbers already on the client, so it
 * costs no request and makes no claim it cannot show its working for.
 */
export function DraftAdvicePanel({
  advice,
  patch,
  onSelect,
  visible,
}: Props): React.ReactElement | null {
  if (!visible || !advice) return null;

  return (
    <HudPanel className="p-4">
      <HudRule label={advice.kind === "PICK" ? "SUGGESTED PICKS" : "SUGGESTED BANS"} />

      <ul className="mt-3 flex flex-col gap-1">
        {advice.entries.map((entry) => (
          <li key={entry.champion.key}>
            <button
              type="button"
              onClick={() => onSelect(entry.champion.key)}
              className="notch-sm flex w-full items-center gap-2.5 border border-transparent px-2 py-1.5 text-left transition-colors hover:border-border hover:bg-surface-2"
            >
              <ChampionIcon name={entry.champion.key} size={32} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-text">
                  {entry.champion.name}
                </span>
                <span className="block truncate text-[11px] text-text-muted">
                  {entry.reasons.join(" · ")}
                </span>
              </span>
              <span
                className={`shrink-0 font-mono text-[12px] font-bold ${
                  entry.total > 0 ? "text-accent" : "text-text-faint"
                }`}
              >
                {entry.total > 0 ? "+" : ""}
                {entry.total}
              </span>
            </button>
          </li>
        ))}
        {advice.entries.length === 0 && (
          <li className="px-2 py-3 text-[12px] text-text-muted">
            No patch data for the champions still available.
          </li>
        )}
      </ul>

      <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
        <CompReadout profile={advice.ally} label="Your comp" />
        <CompReadout profile={advice.enemy} label="Their comp" />
      </div>

      <p className="mt-3 text-[10.5px] text-text-faint">
        Scores are win-rate points from patch {patch || "current"} ranked games. Only your side sees
        this.
      </p>
    </HudPanel>
  );
}
