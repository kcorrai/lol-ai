import { PackageOpen } from "lucide-react";
import { BuildReading, BuildSample } from "@/components/build/BuildReading";
import { HudPanel } from "@/components/layout/HudPanel";
import { noteFor } from "@/components/game/PanelNote";
import type { LiveContextState } from "@/lib/useLiveContext";

/**
 * How the champion being played is built on the current patch.
 *
 * Static advice about a champion rather than a reading of the running game, which is what
 * keeps it clear of Riot's ban on notifications that dictate play from the game state: this
 * is the same thing the website would have told the player before they queued, put where
 * they can still act on it.
 *
 * The reading itself is `BuildReading`, shared with the champion browser — this panel is the
 * half that knows about the live game and its four ways of having nothing to show.
 */
export function BuildPanel({ state }: { state: LiveContextState }): React.ReactElement {
  const note = noteFor(state);
  const context = state.status === "ready" ? state.context : null;
  const build = context?.build ?? null;

  return (
    <HudPanel title="Build" action={build ? <BuildSample build={build} /> : null}>
      {note ?? (context ? build ? <BuildReading build={build} /> : <NoBuild /> : null)}
    </HudPanel>
  );
}

function NoBuild(): React.ReactElement {
  // Two different reasons — a mode with no lane, and a lane the snapshot has no build for —
  // and the player can act on neither, so they get one honest line rather than a guess about
  // which applies.
  return (
    <p className="flex items-center justify-center gap-3 py-8 text-center text-sm text-text-muted">
      <PackageOpen aria-hidden className="h-4 w-4 shrink-0 text-warning" />
      No build for this champion and lane on the current patch.
    </p>
  );
}
