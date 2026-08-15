"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Eye, Shield } from "lucide-react";
import type { DraftSeriesState, ViewerRole } from "@/domains/draft";
import { DraftShareLinks } from "./DraftShareLinks";
import { readDraftLinks, type DraftLinks } from "./draftLinkStore";

interface Props {
  state: DraftSeriesState;
  role: ViewerRole;
}

function sideLabel(state: DraftSeriesState, role: ViewerRole, gameNumber: number): string {
  const game = state.games.find((g) => g.gameNumber === gameNumber);
  if (!game || role === "SPECTATOR") return "Spectator";
  const team = role === "BLUE" ? game.blueTeam : game.blueTeam === 1 ? 2 : 1;
  const name = team === 1 ? state.team1Name : state.team2Name;
  return `${name} · ${role === "BLUE" ? "blue" : "red"} side`;
}

/**
 * Who you are in this room, and — if you created it — the links for everyone
 * else. A spectator is told plainly that a drafter link has to come from the
 * person who made the draft; there is no request flow, because a capability you
 * can ask for is not a capability.
 */
export function JoinDraftPanel({ state, role }: Props): React.ReactElement {
  const [links, setLinks] = useState<DraftLinks | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLinks(readDraftLinks(state.code));
  }, [state.code]);

  const activeGame = state.games.find((g) => g.phase !== "COMPLETE") ?? state.games[0];

  async function copySpectatorLink(): Promise<void> {
    await navigator.clipboard.writeText(`${window.location.origin}/draft/${state.code}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        {role === "SPECTATOR" ? (
          <Eye className="h-5 w-5 shrink-0 text-text-muted" aria-hidden />
        ) : (
          <Shield
            className={`h-5 w-5 shrink-0 ${role === "BLUE" ? "text-accent-blue" : "text-danger"}`}
            aria-hidden
          />
        )}
        <div>
          <p className="text-[14px] font-semibold text-text">
            {sideLabel(state, role, activeGame?.gameNumber ?? 1)}
          </p>
          <p className="text-[12px] text-text-muted">
            {role === "SPECTATOR"
              ? "Watching. To draft, ask whoever created this room for a drafter link."
              : "You can pick and ban for this side."}
          </p>
        </div>
      </div>

      {links ? (
        <DraftShareLinks
          code={state.code}
          blueToken={links.blueToken}
          redToken={links.redToken}
          team1Name={state.team1Name}
          team2Name={state.team2Name}
        />
      ) : (
        <button
          type="button"
          onClick={() => void copySpectatorLink()}
          className="notch-sm inline-flex items-center justify-center gap-2 border border-border bg-surface-2 px-3 py-2 text-[13px] font-semibold text-text-body hover:bg-surface"
        >
          {copied ? (
            <Check className="h-4 w-4 text-accent" aria-hidden />
          ) : (
            <Copy className="h-4 w-4" aria-hidden />
          )}
          {copied ? "Spectator link copied" : "Copy spectator link"}
        </button>
      )}
    </div>
  );
}
