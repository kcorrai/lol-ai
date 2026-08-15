"use client";

import { useSearchParams } from "next/navigation";
import { HudPanel, HudRule } from "@/components/dashboard/laneiq/HudPanel";
import { useDraftSync } from "@/hooks/useDraftSync";
import { useDraftToken } from "@/hooks/useDraftToken";
import { JoinDraftPanel } from "./JoinDraftPanel";

interface Props {
  code: string;
}

/**
 * The room. Resolves the viewer's seat from their token, then renders the
 * series. The board itself lands in TASK-302; this shell owns the parts that
 * have to exist before there is anything to draft on — the seat, the series
 * header and the share links.
 */
export function DraftRoomShell({ code }: Props): React.ReactElement {
  const params = useSearchParams();
  const gameNumber = Math.max(1, Number(params.get("game") ?? "1") || 1);
  const { token, ready } = useDraftToken(code);
  const { data, isLoading, error } = useDraftSync(code, gameNumber, token);

  if (!ready || isLoading) {
    return <p className="p-8 text-center text-[13px] text-text-muted">Opening the room…</p>;
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center">
        <p className="text-[14px] font-semibold text-text">This draft is not available.</p>
        <p className="mt-1 text-[13px] text-text-muted">
          The link may be mistyped, or the series may have expired — drafts are kept for seven days.
        </p>
      </div>
    );
  }

  const { state, role } = data;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-text">
          {state.team1Name} <span className="text-text-faint">vs</span> {state.team2Name}
        </h1>
        <p className="hud-label">
          {state.mode === "NORMAL"
            ? "Normal"
            : state.mode === "FEARLESS"
              ? "Fearless"
              : "Team fearless"}
          {" · "}
          Bo{state.gameCount}
          {" · "}
          {state.timerSeconds === 0 ? "Untimed" : `${state.timerSeconds}s`}
        </p>
      </header>

      <HudPanel className="max-w-md p-5">
        <HudRule label="YOUR SEAT" />
        <div className="mt-4">
          <JoinDraftPanel state={state} role={role} />
        </div>
      </HudPanel>
    </div>
  );
}
