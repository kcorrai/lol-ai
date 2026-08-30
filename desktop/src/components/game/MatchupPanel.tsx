import { HudPanel, PanelMeta } from "@/components/layout/HudPanel";
import { NoRiotAccount, noteFor, PanelNote } from "@/components/game/PanelNote";
import { Meter } from "@/components/hud/Meter";
import { StatBlock } from "@/components/hud/StatBlock";
import { cn } from "@/lib/cn";
import { formatCount } from "@/lib/uiLocale";
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
  favored: "text-accent",
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
 * The two halves are kept apart on purpose, and now literally — one either side of a rule.
 * A patch-wide win rate is a fact about the matchup and a personal one is a fact about the
 * player, and blending them into a single number would produce a figure true of nobody.
 */
export function MatchupPanel({ state }: { state: LiveContextState }): React.ReactElement {
  const note = noteFor(state);
  const context = state.status === "ready" ? state.context : null;

  return (
    <HudPanel
      title="This lane"
      action={context ? <Lane context={context} /> : null}
      bare={Boolean(context && context.champion && context.opponent)}
    >
      {note ?? (context ? <Reading context={context} /> : null)}
    </HudPanel>
  );
}

/** The matchup itself, in the header, because it is what names the panel's contents. */
function Lane({ context }: { context: LiveContext }): React.ReactElement | null {
  if (!context.champion) return null;

  return (
    <PanelMeta>
      {context.champion.name}
      {context.opponent ? ` vs ${context.opponent.name}` : ""}
      {context.meta ? ` · ${context.meta.position}` : ""}
    </PanelMeta>
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
    <div className="grid xl:grid-cols-2">
      <div className="border-b border-line-1 p-5 xl:border-b-0 xl:border-r">
        {context.meta ? <MetaReading meta={context.meta} /> : <NoMeta />}
      </div>
      <div className="p-5">
        <p className="hud-label text-[10px] tracking-[0.18em]">Your record here</p>
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
            "font-display text-[30px] font-black leading-none tracking-[0.03em]",
            VERDICT_TONE[meta.verdict] ?? "text-text"
          )}
        >
          {VERDICT_LABEL[meta.verdict] ?? meta.verdict}
        </p>
        <p className="shrink-0 font-mono text-[13px] tabular-nums text-text-body">
          {meta.winRate.toFixed(1)}
          <span className="text-text-faint">% win rate</span>
        </p>
      </div>
      <p className="mt-2.5 font-mono text-[11px] tracking-[0.12em] text-text-faint">
        Patch {meta.patch} · {formatCount(meta.games)} games across everyone
      </p>
      {/* The bar is the same 46–54 scale the champion list uses, so a win rate means the
          same length wherever this app draws one. */}
      <Meter
        value={((meta.winRate - 46) / 8) * 100}
        tone={meta.winRate >= 52 ? "accent" : meta.winRate < 50 ? "danger" : "neutral"}
        height={5}
        className="mt-4"
      />
    </div>
  );
}

function PersonalReading({ personal }: { personal: Personal }): React.ReactElement {
  return (
    <div>
      <div className="mt-3.5 grid grid-cols-3 gap-4">
        <StatBlock
          label="Record"
          value={`${personal.wins}–${personal.games - personal.wins}`}
          size="sm"
        />
        <StatBlock label="Win rate" value={`${personal.winRate}`} unit="%" size="sm" />
        <StatBlock label="KDA" value={personal.avgKda.toFixed(2)} size="sm" />
      </div>
      {/* The sample size travels with the number, because over three games a win rate is a
          story about three games and the player is the one who has to know that. */}
      <p className="mt-3.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-accent">
        {TREND_LABEL[personal.trend] ?? personal.trend}
        <span className="text-text-faint">
          {" · "}
          {personal.games} ranked {personal.games === 1 ? "game" : "games"}
        </span>
      </p>
    </div>
  );
}
