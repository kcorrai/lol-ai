import { BuildReading, BuildSample } from "@/components/build/BuildReading";
import { PanelNote } from "@/components/game/PanelNote";
import { HudPanel } from "@/components/layout/HudPanel";
import { LANE_LABELS, type DesktopChampion, type DesktopCounter, type Lane } from "@/lib/champions";
import { formatCount } from "@/lib/uiLocale";
import type { ChampionState } from "@/lib/useChampions";

/**
 * One champion in one lane: its record, how it is built, and what beats it.
 *
 * The same three things the website's counter page shows, in the order a player reads them
 * — how it is doing, what to buy, who to avoid.
 */
export function ChampionDetail({ state }: { state: ChampionState }): React.ReactElement {
  if (state.status !== "ready") return <DetailNote state={state} />;
  const { champion } = state;

  return (
    <div className="grid gap-4">
      <HudPanel
        title={champion.champion.name}
        action={
          <p className="truncate font-mono text-xs text-text-muted">
            {LANE_LABELS[champion.position as Lane] ?? champion.position}
            <span className="text-text-faint"> · patch {champion.patch}</span>
          </p>
        }
      >
        <Stats champion={champion} />
        {/* The lane asked for is not always the lane answered: a champion nobody plays
            where you looked is answered where it is played, and saying so beats showing
            numbers from a lane the player did not ask about. */}
        {champion.availablePositions.length > 1 ? (
          <p className="mt-3 border-t border-line-1 pt-3 text-xs text-text-faint">
            Also played:{" "}
            {champion.availablePositions
              .filter((position) => position !== champion.position)
              .map((position) => LANE_LABELS[position as Lane] ?? position)
              .join(", ")}
          </p>
        ) : null}
      </HudPanel>

      <HudPanel
        title="Build"
        action={champion.build ? <BuildSample build={champion.build} /> : null}
      >
        {champion.build ? (
          <BuildReading build={champion.build} />
        ) : (
          <PanelNote>No build for this champion and lane on the current patch.</PanelNote>
        )}
      </HudPanel>

      <HudPanel title="Matchups">
        <div className="grid gap-4 md:grid-cols-2">
          <Matchups label="Struggles into" matchups={champion.counteredBy} />
          <Matchups label="Beats" matchups={champion.goodInto} />
        </div>
      </HudPanel>
    </div>
  );
}

function Stats({ champion }: { champion: DesktopChampion }): React.ReactElement {
  return (
    <dl className="grid grid-cols-4 gap-px bg-line-1">
      <Stat label="Win" value={`${champion.stats.winRate.toFixed(1)}%`} />
      <Stat label="Pick" value={`${champion.stats.pickRate.toFixed(1)}%`} />
      <Stat label="Ban" value={`${champion.stats.banRate.toFixed(1)}%`} />
      <Stat label="Games" value={formatCount(champion.stats.games)} />
    </dl>
  );
}

function Stat({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="bg-surface px-3 py-2.5">
      <dt className="hud-label">{label}</dt>
      <dd className="mt-1 font-mono text-base font-bold text-text">{value}</dd>
    </div>
  );
}

function Matchups({
  label,
  matchups,
}: {
  label: string;
  matchups: DesktopCounter[];
}): React.ReactElement {
  return (
    <div>
      <p className="hud-label mb-2">{label}</p>
      {matchups.length === 0 ? (
        <p className="text-xs text-text-faint">Not enough games in this lane.</p>
      ) : (
        <ul className="grid gap-px bg-line-1">
          {matchups.map((matchup) => (
            <li
              key={matchup.championKey}
              className="flex items-baseline justify-between gap-3 bg-surface px-3 py-2"
            >
              <span className="truncate text-sm text-text-body">{matchup.name}</span>
              <span className="shrink-0 font-mono text-xs text-text-muted">
                {/* The subject's rate in both columns, so the number means one thing. */}
                {matchup.subjectWinRate.toFixed(1)}%
                <span className="ml-2 text-text-faint">{formatCount(matchup.games)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The pane's five ways of having nothing to show, each with what the player can do. */
function DetailNote({ state }: { state: Exclude<ChampionState, { status: "ready" }> }) {
  switch (state.status) {
    case "idle":
      return <PanelNote>Pick a champion and its build and matchups appear here.</PanelNote>;
    case "unavailable":
      return (
        <PanelNote>
          This preview cannot reach the website. Run the desktop app, which has the credential
          store.
        </PanelNote>
      );
    case "loading":
      return <PanelNote>Reading this champion…</PanelNote>;
    case "unpaired":
      return <PanelNote>Pair this machine on the Pairing screen.</PanelNote>;
    case "error":
      return <PanelNote>{state.message}</PanelNote>;
  }
}
