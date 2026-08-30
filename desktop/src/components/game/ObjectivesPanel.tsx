import { Building2, Flame, Landmark, Shield, Swords, type LucideIcon } from "lucide-react";
import { HudPanel } from "@/components/layout/HudPanel";
import { cn } from "@/lib/cn";
import type { Team } from "@/lib/liveClient/schema";
import { countObjectives, otherTeam, share, OBJECTIVES, type Objective } from "@/lib/objectives";
import type { TimelineEntry } from "@/lib/timeline";

const LABELS: Record<Objective, { name: string; icon: LucideIcon }> = {
  dragon: { name: "Dragons", icon: Flame },
  herald: { name: "Heralds", icon: Shield },
  baron: { name: "Barons", icon: Swords },
  turret: { name: "Turrets", icon: Building2 },
  inhibitor: { name: "Inhibitors", icon: Landmark },
};

/**
 * What each side has taken, counted off the same event stream the timeline draws.
 *
 * This panel stands where a map would. The Live Client Data API publishes no coordinates for
 * anybody, so a map with anything marked on it would be a picture of positions this app
 * invented — on the one screen where a player might act on it. What the stream does carry is
 * every objective that fell and who took it, which is the knowable half of the same question.
 *
 * Nothing is predicted and no timer appears: not a respawn, not a next spawn. Those are patch
 * constants this repository has no verified table of, and a confidently wrong countdown over
 * a running game is worse than no panel at all (LA-74).
 */
export function ObjectivesPanel({
  entries,
  /** The player's own side, so the panel reads as us against them. */
  team,
}: {
  entries: readonly TimelineEntry[];
  team: Team;
}): React.ReactElement {
  const count = countObjectives(entries);
  const mine = count[team];
  const theirs = count[otherTeam(team)];

  return (
    <HudPanel title="Objectives" bare>
      <div className="flex items-center justify-between gap-3 border-b border-line-1 px-4 py-2.5">
        <span className="hud-label text-[9.5px] tracking-[0.18em]">Taken so far</span>
        <span className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-accent">
          <span aria-hidden className="hud-pulse block h-[5px] w-[5px] bg-accent" />
          live
        </span>
      </div>

      <dl className="grid gap-4 p-4">
        {OBJECTIVES.map((objective, index) => (
          <Row
            key={objective}
            objective={objective}
            mine={mine[objective]}
            theirs={theirs[objective]}
            index={index}
          />
        ))}
      </dl>

      <p className="border-t border-line-1 px-4 py-3 font-mono text-[9.5px] uppercase leading-relaxed tracking-[0.14em] text-text-faint">
        Counted from what has happened. Nothing here is a timer.
      </p>
    </HudPanel>
  );
}

/**
 * One objective, as a bar split between the two sides.
 *
 * The split is the reading — three dragons to one is a fact about the next fight, and two
 * numbers side by side make you do the arithmetic. Nil-nil sits at the midpoint rather than
 * drawing an empty bar, which would read as a side having lost something it never had.
 */
function Row({
  objective,
  mine,
  theirs,
  index,
}: {
  objective: Objective;
  mine: number;
  theirs: number;
  index: number;
}): React.ReactElement {
  const { name, icon: Icon } = LABELS[objective];
  const none = mine + theirs === 0;

  return (
    <div>
      <div className="flex items-center gap-2.5">
        <Icon
          aria-hidden
          className={cn("h-3.5 w-3.5 shrink-0", none ? "text-text-faint" : "text-text-muted")}
        />
        <dt className="hud-label flex-1 text-[9.5px] tracking-[0.16em]">{name}</dt>
        <dd className="flex items-baseline gap-1.5 font-mono text-[13px] font-bold tabular-nums">
          <span className={mine > theirs ? "text-accent" : "text-text"}>{mine}</span>
          <span className="text-text-faint">–</span>
          <span className={theirs > mine ? "text-danger" : "text-text"}>{theirs}</span>
        </dd>
      </div>
      <span aria-hidden className="mt-2 flex h-1 gap-px overflow-hidden">
        <span
          className={cn("hud-bar block h-full", none ? "bg-line-2" : "bg-accent")}
          style={{ width: `${share(mine, theirs)}%`, animationDelay: `${index * 50}ms` }}
        />
        <span className={cn("block h-full flex-1", none ? "bg-line-2" : "bg-danger")} />
      </span>
    </div>
  );
}
