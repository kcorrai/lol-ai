import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { ItemIcon } from "@/components/ui/ItemIcon";
import { perMinute } from "@/domains/esports/duration";
import type { GameTeamStats } from "@/domains/esports/types";

function pct(fraction: number | null): string {
  return fraction === null ? "—" : `${Math.round(fraction * 100)}%`;
}

function rate(value: number | null, digits = 1): string {
  return value === null ? "—" : value.toFixed(digits);
}

function SideTable({
  team,
  name,
  durationSeconds,
}: {
  team: GameTeamStats;
  name: string;
  /** Null when the feed published no opening frame; every rate column dashes out. */
  durationSeconds: number | null;
}): React.ReactElement {
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-display text-sm font-bold uppercase text-text">
          {name}
          <span
            className={`ml-2 font-mono text-[11px] uppercase ${
              team.side === "blue" ? "text-accent-blue" : "text-danger"
            }`}
          >
            {team.side}
          </span>
        </p>
        <p className="font-mono text-[11px] text-text-body">
          {team.kills} kills · {(team.gold / 1000).toFixed(1)}k gold · {team.towers} towers
          {team.barons > 0 ? ` · ${team.barons} baron` : ""}
          {team.dragons.length > 0 ? ` · ${team.dragons.length} dragons` : ""}
        </p>
      </div>

      {/* Its own scroll container so a wide scoreboard never widens the page. */}
      <div className="gaming-card notch-sm overflow-x-auto">
        <table className="w-full min-w-[44rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th scope="col" className="hud-label px-2 py-2 font-normal">
                Player
              </th>
              <th scope="col" className="hud-label px-2 py-2 text-right font-normal">
                KDA
              </th>
              <th scope="col" className="hud-label px-2 py-2 text-right font-normal">
                CS
              </th>
              <th scope="col" className="hud-label px-2 py-2 text-right font-normal">
                CS/m
              </th>
              <th scope="col" className="hud-label px-2 py-2 text-right font-normal">
                Gold
              </th>
              <th scope="col" className="hud-label px-2 py-2 text-right font-normal">
                G/m
              </th>
              <th scope="col" className="hud-label px-2 py-2 text-right font-normal">
                KP
              </th>
              <th scope="col" className="hud-label px-2 py-2 text-right font-normal">
                Vision
              </th>
              <th scope="col" className="hud-label px-2 py-2 text-right font-normal">
                DMG
              </th>
              <th scope="col" className="hud-label px-2 py-2 font-normal">
                Items
              </th>
            </tr>
          </thead>
          <tbody>
            {team.participants.map((p) => (
              <tr key={p.participantId} className="border-b border-border/60 last:border-0">
                <td className="px-2 py-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <ChampionIcon name={p.championId} size={24} />
                    <span className="min-w-0">
                      <span className="block truncate font-display text-[13px] font-bold uppercase text-text">
                        {p.handle}
                      </span>
                      <span className="block truncate text-[11px] text-text-faint">
                        {p.championId}
                      </span>
                    </span>
                  </span>
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-right font-mono text-text">
                  {p.kills}/{p.deaths}/{p.assists}
                </td>
                <td className="px-2 py-2 text-right font-mono text-text-body">{p.creepScore}</td>
                <td className="px-2 py-2 text-right font-mono text-text-muted">
                  {rate(perMinute(p.creepScore, durationSeconds))}
                </td>
                <td className="px-2 py-2 text-right font-mono text-text-body">
                  {(p.gold / 1000).toFixed(1)}k
                </td>
                <td className="px-2 py-2 text-right font-mono text-text-muted">
                  {rate(perMinute(p.gold, durationSeconds), 0)}
                </td>
                <td className="px-2 py-2 text-right font-mono text-text-muted">
                  {pct(p.killParticipation)}
                </td>
                {/* Wards placed and killed, the only two vision figures either
                    feed publishes. Neither is a vision score. */}
                <td className="whitespace-nowrap px-2 py-2 text-right font-mono text-text-muted">
                  {p.wardsPlaced ?? "—"}
                  <span className="text-text-faint"> / </span>
                  {p.wardsDestroyed ?? "—"}
                </td>
                <td className="px-2 py-2 text-right font-mono text-text-muted">
                  {pct(p.damageShare)}
                </td>
                <td className="px-2 py-2">
                  {p.items.length > 0 ? (
                    <span className="flex gap-0.5">
                      {p.items.map((itemId, index) => (
                        <ItemIcon key={`${itemId}-${index}`} itemId={itemId} size={20} />
                      ))}
                    </span>
                  ) : (
                    <span className="text-text-faint">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Final (or current) per-player numbers for both sides. */
export function Scoreboard({
  blue,
  red,
  blueName,
  redName,
  durationSeconds = null,
}: {
  blue: GameTeamStats;
  red: GameTeamStats;
  blueName: string;
  redName: string;
  durationSeconds?: number | null;
}): React.ReactElement {
  return (
    <div className="grid gap-6">
      <SideTable team={blue} name={blueName} durationSeconds={durationSeconds} />
      <SideTable team={red} name={redName} durationSeconds={durationSeconds} />
    </div>
  );
}
