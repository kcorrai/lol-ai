import { BarChart3, CloudOff, MonitorSmartphone, PackageOpen, Trees } from "lucide-react";
import { BuildReading, BuildSample } from "@/components/build/BuildReading";
import { AbilityPanel } from "@/components/champions/AbilityPanel";
import { ChampionHero } from "@/components/champions/ChampionHero";
import { ChampionMatchups } from "@/components/champions/ChampionMatchups";
import { ChampionSuggestions, type Suggestion } from "@/components/champions/ChampionSuggestions";
import { EmptyState } from "@/components/hud/EmptyState";
import { HudPanel } from "@/components/layout/HudPanel";
import type { ChampionState } from "@/lib/useChampions";

/**
 * One champion in one lane: who it is, how it is built, what its kit does, and what beats it.
 *
 * The right-hand pane of the champion browser, and the half of that screen worth opening
 * with no game running. It reads top to bottom in the order a player asks the questions —
 * how is it doing, what does it do, what do I buy, who do I avoid.
 */
export function ChampionDetail({
  state,
  /** The busiest champion in this lane, so the sample bar has a real ceiling. */
  laneMaxGames,
  /** Offered on the opening state, so the pane is a way in rather than an instruction. */
  suggestions,
  onSelect,
}: {
  state: ChampionState;
  laneMaxGames: number;
  suggestions: readonly Suggestion[];
  onSelect: (key: string) => void;
}): React.ReactElement {
  if (state.status !== "ready") {
    return <DetailNote state={state} suggestions={suggestions} onSelect={onSelect} />;
  }

  const { champion } = state;
  const sampleFill = laneMaxGames > 0 ? (champion.stats.games / laneMaxGames) * 100 : 0;

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 p-5 [&>*]:min-w-0">
      <ChampionHero champion={champion} sampleFill={sampleFill} />

      <AbilityPanel
        abilities={champion.abilities}
        champion={champion.champion.name}
        title="Abilities"
        meta="Riot's own clips and cooldowns"
      />

      <HudPanel
        title="Build"
        action={champion.build ? <BuildSample build={champion.build} /> : null}
      >
        {champion.build ? (
          <BuildReading build={champion.build} />
        ) : (
          <p className="flex items-center justify-center gap-3 py-8 text-center text-sm text-text-muted">
            <PackageOpen aria-hidden className="h-4 w-4 text-warning" />
            No build for this champion and lane on the current patch.
          </p>
        )}
      </HudPanel>

      <ChampionMatchups counteredBy={champion.counteredBy} goodInto={champion.goodInto} />
    </div>
  );
}

/**
 * The pane's five ways of having nothing to show, each saying which one it is.
 *
 * The opening state is the odd one out and the one that mattered most: "pick a champion" is
 * an instruction, and an instruction is a worse opening screen than three champions the
 * player can click. So the empty pane carries the lane's strongest three.
 */
function DetailNote({
  state,
  suggestions,
  onSelect,
}: {
  state: Exclude<ChampionState, { status: "ready" }>;
  suggestions: readonly Suggestion[];
  onSelect: (key: string) => void;
}): React.ReactElement {
  const splash = suggestions[0]?.championKey ?? "Viego";

  if (state.status === "idle") {
    return (
      <EmptyState
        icon={BarChart3}
        title="Pick a champion"
        body="Its build, its abilities and the lanes it wins and loses appear here. Start with one of the three below."
        splash={splash}
        action={<ChampionSuggestions suggestions={suggestions} onSelect={onSelect} />}
      />
    );
  }

  if (state.status === "loading") {
    return (
      <EmptyState
        icon={BarChart3}
        busy
        title="Reading this champion"
        body="Pulling the build, the matchups and the kit for this patch."
        splash={splash}
      />
    );
  }

  if (state.status === "unpaired") {
    return (
      <EmptyState
        icon={MonitorSmartphone}
        title="This machine is not paired"
        body="Pair this machine on the Pairing screen and the ranked meta appears here."
        splash={splash}
      />
    );
  }

  if (state.status === "unavailable") {
    return (
      <EmptyState
        icon={Trees}
        title="This is the browser preview"
        body="It has no credential store, so it cannot reach the website. Run the desktop app."
        splash={splash}
      />
    );
  }

  return (
    <EmptyState
      icon={CloudOff}
      tone="danger"
      title="Cannot reach LoL AI Coach"
      body={state.message}
      splash={splash}
    />
  );
}
