import { ChampionTile } from "@/components/hud/ChampionTile";
import { HudPanel, PanelMeta } from "@/components/layout/HudPanel";
import { cn } from "@/lib/cn";
import type { AllGameData, LivePlayer, Team } from "@/lib/liveClient/schema";
import { activePlayerOf } from "@/lib/liveMatchup";

/**
 * All ten players, as the client publishes them.
 *
 * The only panel on this screen that needs nothing from the website: it is the scoreboard the
 * player already has, put somewhere they can read it without tabbing away from the fight. The
 * CS bar behind each name is the one thing it adds — a number nobody compares across ten rows
 * becomes a shape that does.
 *
 * The player's own row is marked by a rule and a fill, not by colour alone.
 */
export function Scoreboard({ data }: { data: AllGameData }): React.ReactElement {
  const me = activePlayerOf(data);
  const order = data.allPlayers.filter((player) => player.team === "ORDER");
  const chaos = data.allPlayers.filter((player) => player.team === "CHAOS");

  return (
    <HudPanel
      title="Scoreboard"
      action={<PanelMeta>Live from the client</PanelMeta>}
      bare
      className="overflow-hidden"
    >
      <div className="grid md:grid-cols-2">
        <Side
          team="ORDER"
          label="Order"
          players={order}
          me={me}
          className="border-b border-line-1 md:border-b-0 md:border-r"
        />
        <Side team="CHAOS" label="Chaos" players={chaos} me={me} />
      </div>
    </HudPanel>
  );
}

function Side({
  team,
  label,
  players,
  me,
  className,
}: {
  team: Team;
  label: string;
  players: LivePlayer[];
  me: LivePlayer | null;
  className?: string;
}): React.ReactElement {
  const kills = players.reduce((total, player) => total + player.scores.kills, 0);
  const mine = me?.team === team;

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-line-1 bg-ink-700 px-4 py-2.5">
        <span
          className={cn(
            "font-mono text-[10px] font-bold uppercase tracking-[0.2em]",
            mine ? "text-accent" : "text-danger"
          )}
        >
          {label}
        </span>
        <span className="font-mono text-[11.5px] tabular-nums text-text-muted">{kills} kills</span>
      </div>
      {players.map((player, index) => (
        <Row
          key={`${player.championName}-${index}`}
          player={player}
          you={player === me}
          index={index}
        />
      ))}
    </div>
  );
}

/**
 * The CS bar is scaled to 200, which is roughly a good farming game at thirty minutes.
 * It is a fixed ceiling on purpose: scaling to whoever is highest would redraw every bar
 * whenever one player got a wave, and the shape a glance is reading is "how am I doing", not
 * "how are we ranked".
 */
const CS_CEILING = 200;

function Row({
  player,
  you,
  index,
}: {
  player: LivePlayer;
  you: boolean;
  index: number;
}): React.ReactElement {
  const { kills, deaths, assists, creepScore } = player.scores;

  return (
    <div
      style={{ animationDelay: `${index * 40}ms` }}
      className={cn(
        "hud-row-in grid grid-cols-[32px_minmax(50px,1fr)_max-content_max-content] items-center gap-3 border-b border-l-2 border-b-line-1 px-3.5 py-2",
        you ? "border-l-accent bg-accent/10" : "border-l-transparent"
      )}
    >
      <ChampionTile champion={player.championName} size={32} selected={you} />
      <span className="min-w-0">
        <span className={cn("block truncate text-[13.5px]", you ? "text-accent" : "text-text")}>
          {player.championName}
        </span>
        <span aria-hidden className="mt-1.5 block h-[3px] bg-surface-dark">
          <span
            className={cn("hud-bar block h-full", you ? "bg-accent" : "bg-ink-400")}
            style={{
              width: `${Math.min(100, (creepScore / CS_CEILING) * 100)}%`,
              animationDelay: `${index * 60}ms`,
            }}
          />
        </span>
      </span>
      <span className="text-right font-mono text-[12.5px] tabular-nums text-text-body">
        {kills}/{deaths}/{assists}
      </span>
      <span className="w-14 text-right font-mono text-[11.5px] tabular-nums text-text-faint">
        {creepScore} cs
      </span>
    </div>
  );
}
