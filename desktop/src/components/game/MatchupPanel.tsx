import { HudPanel } from "@/components/layout/HudPanel";
import { NoRiotAccount, noteFor, PanelNote } from "@/components/game/PanelNote";
import { cn } from "@/lib/cn";
import type { LiveContext } from "@/lib/liveContext";
import type { LiveContextState } from "@/lib/useLiveContext";

type Meta = NonNullable<LiveContext["meta"]>;
type Personal = NonNullable<LiveContext["personal"]>;

const VERDICT_LABEL: Record<string, string> = {
  favored: "Favoured",
  even: "Even",
  unfavored: "Unfavoured",
};

const VERDICT_TONE: Record<string, string> = {
  favored: "text-success",
  even: "text-text-body",
  unfavored: "text-danger",
};

const TREND_LABEL: Record<string, string> = {
  improving: "Improving",
  declining: "Declining",
  stable: "Steady",
  insufficient_data: "Too few games to call",
};

/**
 * The lane, as the website sees it: what this matchup does for everyone on this patch, and
 * what it has done for this account.
 *
 * The two halves are kept apart on purpose. A patch-wide win rate is a fact about the
 * matchup and a personal one is a fact about the player, and blending them into a single
 * number would produce a figure that is true of nobody.
 */
export function MatchupPanel({ state }: { state: LiveContextState }): React.ReactElement {
  const note = noteFor(state);
  const context = state.status === "ready" ? state.context : null;

  return (
    <HudPanel title="This lane" action={context ? <Lane context={context} /> : null}>
      {note ?? (context ? <Reading context={context} /> : null)}
    </HudPanel>
  );
}

/** The matchup itself, in the header, because it is what names the panel's contents. */
function Lane({ context }: { context: LiveContext }): React.ReactElement | null {
  if (!context.champion) return null;

  return (
    <p className="truncate font-mono text-xs text-text-muted">
      {context.champion.name}
      {context.opponent ? ` vs ${context.opponent.name}` : ""}
      {context.meta ? <span className="ml-2 text-text-faint">{context.meta.position}</span> : null}
    </p>
  );
}

function Reading({ context }: { context: LiveContext }): React.ReactElement {
  if (!context.champion) {
    // The website could not resolve the name the game client gave. Rare, and worth saying
    // plainly rather than rendering as a lane with no data.
    return <PanelNote>This version does not recognise the champion you are playing.</PanelNote>;
  }
  if (!context.opponent) {
    return <PanelNote>This game has no lane opponent to read.</PanelNote>;
  }

  return (
    <div className="grid gap-4">
      {context.meta ? <MetaReading meta={context.meta} /> : <NoMeta />}
      <div className="border-t border-line-1 pt-4">
        <p className="hud-label mb-2">Your record here</p>
        {!context.riotAccountLinked ? (
          <NoRiotAccount />
        ) : context.personal ? (
          <PersonalReading personal={context.personal} />
        ) : (
          <PanelNote>No ranked games in this matchup yet.</PanelNote>
        )}
      </div>
    </div>
  );
}

function NoMeta(): React.ReactElement {
  return <PanelNote>No patch data for this pair yet.</PanelNote>;
}

function MetaReading({ meta }: { meta: Meta }): React.ReactElement {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p
          className={cn(
            "font-display text-2xl font-bold",
            VERDICT_TONE[meta.verdict] ?? "text-text"
          )}
        >
          {VERDICT_LABEL[meta.verdict] ?? meta.verdict}
        </p>
        <p className="font-mono text-sm text-text-body">
          {meta.winRate.toFixed(1)}
          <span className="text-text-faint">% win rate</span>
        </p>
      </div>
      <p className="mt-1 text-xs text-text-muted">
        Patch {meta.patch} · {meta.games.toLocaleString()} games across everyone
      </p>
    </div>
  );
}

function PersonalReading({ personal }: { personal: Personal }): React.ReactElement {
  return (
    <div className="grid grid-cols-3 gap-px bg-line-1">
      <Cell label="Record" value={`${personal.wins}-${personal.games - personal.wins}`} />
      <Cell label="Win rate" value={`${personal.winRate}%`} />
      <Cell label="KDA" value={personal.avgKda.toFixed(2)} />
      <div className="col-span-3 bg-surface px-3 py-2">
        <p className="text-xs text-text-muted">
          {TREND_LABEL[personal.trend] ?? personal.trend}
          {/* The sample size travels with the number, because over three games a win rate
              is a story about three games and the player is the one who has to know that. */}
          <span className="text-text-faint">
            {" · "}
            {personal.games} ranked {personal.games === 1 ? "game" : "games"}
          </span>
        </p>
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="bg-surface px-3 py-2.5">
      <p className="hud-label">{label}</p>
      <p className="mt-1 font-mono text-lg font-bold text-text">{value}</p>
    </div>
  );
}
