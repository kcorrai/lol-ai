import { ChampionTile } from "@/components/hud/ChampionTile";
import { ChampionSplash, ScanBand } from "@/components/hud/Splash";
import { itemIconUrl } from "@/lib/ddragon";
import { cn } from "@/lib/cn";
import type { AllGameData, LivePlayer } from "@/lib/liveClient/schema";
import { activePlayerOf, laneOpponentOf } from "@/lib/liveMatchup";
import type { LiveContext } from "@/lib/liveContext";

const VERDICT_LABEL: Record<string, string> = {
  favored: "Favoured",
  even: "Even",
  unfavored: "Unfavoured",
};

/**
 * The game, as a header: you, the player opposite, and how the two sides stand.
 *
 * The two halves of this app in one band — the champions are read off the client on this
 * machine, and the verdict between them is the website's. It is the top of the screen because
 * it is the one thing a player glancing over mid-fight can take in without reading.
 *
 * The bar underneath counts **kills**, not gold. The Live Client Data API publishes the
 * player's own gold and nobody else's, so a team gold bar would be a number this app made up
 * — and made up on the one screen where a player might act on it.
 */
export function LiveHeader({
  data,
  context,
}: {
  data: AllGameData;
  context: LiveContext | null;
}): React.ReactElement | null {
  const me = activePlayerOf(data);
  if (!me) return null;

  const opponent = laneOpponentOf(data, me);
  const meta = context?.meta ?? null;
  const verdict = meta ? (VERDICT_LABEL[meta.verdict] ?? meta.verdict) : null;

  const mine = data.allPlayers.filter((player) => player.team === me.team);
  const theirs = data.allPlayers.filter((player) => player.team !== me.team);
  const myKills = mine.reduce((total, player) => total + player.scores.kills, 0);
  const theirKills = theirs.reduce((total, player) => total + player.scores.kills, 0);
  const total = myKills + theirKills;

  return (
    <section className="notch-lg relative overflow-hidden border border-border">
      <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <ChampionSplash champion={me.championName} side="left" opacity={0.42} />
        {opponent ? (
          <ChampionSplash
            champion={opponent.championName}
            side="right"
            opacity={0.34}
            flip
            position="44% 20%"
          />
        ) : null}
        <span className="absolute inset-0 bg-[linear-gradient(90deg,var(--ink-900)_4%,rgba(8,11,10,.56)_34%,rgba(8,11,10,.82)_50%,rgba(8,11,10,.58)_66%,var(--ink-900)_96%)]" />
        <span className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <span className="bg-scanline absolute inset-0" />
        <ScanBand />
      </span>

      <div className="relative grid items-center gap-6 p-6 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <Side player={me} you />
        <span className="text-center">
          <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-text-faint">
            {opponent ? "Lane" : "Mode"}
          </span>
          {opponent ? (
            <span className="mt-1.5 block font-display text-[15px] font-bold tracking-[0.12em] text-text-muted">
              VS
            </span>
          ) : null}
          <span
            className={cn(
              "tag-cut mt-2.5 inline-block border px-2.5 py-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.16em]",
              verdict
                ? "border-accent bg-accent/10 text-accent"
                : "border-line-2 bg-surface-dark text-text-muted"
            )}
          >
            {verdict ?? data.gameData.gameMode}
          </span>
        </span>
        {opponent ? (
          <Side player={opponent} align="end" />
        ) : (
          // No lane to name, so the space says what the mode does have: how the two sides
          // stand on kills. Never an empty column.
          <span className="flex items-center justify-end gap-8 font-mono text-text-muted">
            <span className="text-right">
              <span className="hud-label block text-[9.5px]">Team kills</span>
              <span className="mt-1.5 block text-xl font-bold tabular-nums text-text">
                {myKills}–{theirKills}
              </span>
            </span>
          </span>
        )}
      </div>

      <div className="relative px-6 pb-5">
        <div className="mb-2 flex items-center justify-between gap-3.5">
          <span className="hud-label text-[10px] tracking-[0.18em]">Team kills</span>
          <span
            className={cn(
              "font-mono text-[12.5px] tabular-nums",
              myKills >= theirKills ? "text-accent" : "text-danger"
            )}
          >
            {myKills >= theirKills ? "+" : "−"}
            {Math.abs(myKills - theirKills)}
          </span>
        </div>
        <div className="relative h-1.5 overflow-hidden bg-surface-dark">
          <span
            className="hud-bar block h-full bg-accent"
            style={{ width: `${total === 0 ? 50 : (myKills / total) * 100}%` }}
          />
          <span aria-hidden className="absolute -bottom-1 -top-1 left-1/2 w-px bg-text-muted" />
        </div>
        <div className="mt-2 flex justify-between font-mono text-[11px] tabular-nums text-text-muted">
          <span>{myKills}</span>
          <span>{theirKills}</span>
        </div>
      </div>
    </section>
  );
}

/** One of the two champions, with the six things they are holding. */
function Side({
  player,
  you,
  align = "start",
}: {
  player: LivePlayer;
  you?: boolean;
  align?: "start" | "end";
}): React.ReactElement {
  const line = [
    player.position?.trim() || null,
    `${player.scores.kills}/${player.scores.deaths}/${player.scores.assists}`,
    `${player.scores.creepScore} CS`,
  ]
    .filter(Boolean)
    .join(" · ");

  const tile = <ChampionTile champion={player.championName} size={56} selected={you} />;

  return (
    <span
      className={cn("flex min-w-0 items-center gap-4", align === "end" && "justify-end text-right")}
    >
      {align === "start" ? tile : null}
      <span className="min-w-0">
        <span
          className={cn("flex flex-wrap items-center gap-2.5", align === "end" && "justify-end")}
        >
          <span className="truncate font-display text-[23px] font-black uppercase tracking-[0.04em] text-text">
            {player.championName}
          </span>
          {you ? (
            <span className="tag-cut bg-accent px-1.5 py-[3px] font-mono text-[8.5px] font-bold uppercase tracking-[0.16em] text-ink-1000">
              You
            </span>
          ) : null}
        </span>
        <span className="mt-1.5 block truncate font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-muted">
          {line}
        </span>
        <Items player={player} align={align} accent={you} />
      </span>
      {align === "end" ? tile : null}
    </span>
  );
}

/**
 * What they are holding, as icons and nothing else.
 *
 * The client publishes the whole inventory every poll, trinket and consumables included, and
 * `slot` is what orders it rather than array position. Six boxes always: an empty one is the
 * shape of a slot they have not filled, which is itself worth seeing.
 */
function Items({
  player,
  align,
  accent,
}: {
  player: LivePlayer;
  align: "start" | "end";
  accent?: boolean;
}): React.ReactElement {
  const held = [...(player.items ?? [])].sort((a, b) => a.slot - b.slot).slice(0, 6);

  return (
    <span className={cn("mt-2.5 flex gap-1.5", align === "end" && "justify-end")}>
      {Array.from({ length: 6 }, (_, index) => {
        const item = held[index];
        return (
          <span
            key={index}
            title={item?.displayName ?? undefined}
            className={cn(
              "tag-cut block h-[26px] w-[26px] shrink-0 border bg-surface-dark bg-cover",
              item && accent ? "border-accent/40" : "border-line-2"
            )}
            style={item ? { backgroundImage: `url(${itemIconUrl(item.itemID)})` } : undefined}
          />
        );
      })}
    </span>
  );
}
