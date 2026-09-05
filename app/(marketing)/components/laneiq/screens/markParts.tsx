import { Portrait } from "./screenChrome";

/**
 * The pieces the seven free-tool marks are drawn from.
 *
 * These marks live at roughly 340x110 in a tile, which is a quarter of the room
 * `screenChrome.tsx` gives the four full screens, so they need their own smaller
 * vocabulary rather than a scaled-down version of that one.
 *
 * The rule every piece here obeys: **nothing is a bare grey rectangle.** An earlier
 * pass drew champions as plain filled bars, and at this size a row of grey bars is
 * indistinguishable from a loading skeleton — a tile that looks like it is still
 * fetching is worse than a decorative one, because the reader waits for it instead of
 * clicking. So a champion is a portrait plus a bordered plate carrying a rank ordinal,
 * and every row ends in a figure. Ordinals and counts are used wherever a number is
 * needed for that reason, because unlike a win rate they cannot go stale (ADR-050).
 *
 * The portrait is the champion's real Data Dragon art. It was an empty tile, which met the
 * letter of the rule above and not its point: six tiles of grey squares still read as six
 * tiles that had not loaded. Every champion below is written as a display name, never as a
 * Data Dragon key — `normalizeChampionKey` owns that mapping, and a hand-written key 403s
 * back into the letter tile the portrait falls back to.
 */

/**
 * One champion, at the size these marks can afford: a portrait, a plate, and the
 * plate's position in whatever list it belongs to.
 */
export function Plate({
  rank,
  champion,
  width = 62,
  tone = "idle",
  grow = false,
}: {
  /** 1-based; drawn zero-padded, the way every ranked column in the product is. */
  rank: number;
  /** Display name. Falls back to the empty tile when a mark stands for no one in particular. */
  champion?: string;
  width?: number;
  tone?: "idle" | "accent" | "danger";
  /** Share the row's width instead of taking `width`. What a band of champions does. */
  grow?: boolean;
}): React.ReactElement {
  const edge = {
    idle: "border-line-1",
    accent: "border-accent/50",
    danger: "border-danger/40",
  }[tone];
  return (
    <span
      className={`flex h-[15px] items-center gap-1.5 border bg-surface-2 pl-1 ${edge} ${
        grow ? "min-w-0 flex-1" : ""
      }`}
    >
      <Portrait size={11} name={champion} />
      <span
        className="font-mono text-[8px] tabular-nums text-text-muted"
        style={grow ? undefined : { width: width - 22 }}
      >
        {String(rank).padStart(2, "0")}
      </span>
    </span>
  );
}

/**
 * A row of plates, numbered from `from`.
 *
 * They share the row's full width rather than sitting at a fixed one. A band that stopped
 * short left a third of every tier-list tile empty, and a band of three reading wider than
 * a band of four is the right picture anyway — fewer champions, more room each.
 */
export function PlateRow({
  champions,
  from = 1,
  tone = "idle",
}: {
  /** One plate per champion, in order. The list is the count. */
  champions: readonly string[];
  from?: number;
  tone?: "idle" | "accent" | "danger";
}): React.ReactElement {
  return (
    <span className="flex min-w-0 flex-1 gap-1">
      {champions.map((c, i) => (
        <Plate key={c} rank={from + i} champion={c} tone={tone} grow />
      ))}
    </span>
  );
}

/**
 * The lane filter `/tools/tier-list` carries above its bands.
 *
 * It is what separates that tile from the ARAM one at a glance: the Howling Abyss has
 * no lanes, so this control cannot appear there.
 */
export function LaneChips({ active }: { active: string }): React.ReactElement {
  return (
    <span className="flex gap-1">
      {["TOP", "JGL", "MID", "BOT", "SUP"].map((lane) => (
        <span
          key={lane}
          className={`border px-1 py-px font-mono text-[7.5px] tracking-[0.1em] ${
            lane === active
              ? "border-accent bg-accent/15 text-accent"
              : "border-line-1 text-text-faint"
          }`}
        >
          {lane}
        </span>
      ))}
    </span>
  );
}

/**
 * A draft slot — a champion's square on a pick or ban rail.
 *
 * A filled slot holds the champion that was taken, because that is the only difference
 * between a draft rail and ten coloured squares. A banned one is drawn desaturated and dim,
 * which is how the real `BanRail` shows a champion nobody can have. `empty` is a slot the
 * draft has not reached, so it has nothing to show and stays a tile.
 */
export function Slot({
  tone,
  champion,
  size = 15,
  state = "filled",
}: {
  tone: "blue" | "red";
  /** Display name. Omitted on `empty` slots, which stand for a turn nobody has taken. */
  champion?: string;
  size?: number;
  /** `pending` is the slot on the clock; `banned` is struck through; `empty` is unreached. */
  state?: "filled" | "banned" | "pending" | "empty";
}): React.ReactElement {
  const edge =
    tone === "blue"
      ? { filled: "border-accent-blue/60 bg-accent-blue/20", pending: "border-accent bg-accent/20" }
      : { filled: "border-danger/60 bg-danger/20", pending: "border-accent bg-accent/20" };
  const frame =
    state === "empty"
      ? "border-line-1 bg-surface-2"
      : edge[state === "pending" ? "pending" : "filled"];
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden border ${frame} ${
        state === "banned" ? "opacity-45 grayscale" : ""
      }`}
      style={{ width: size, height: size }}
    >
      {champion && state !== "empty" ? <Portrait size={size - 2} name={champion} /> : null}
    </span>
  );
}

/** A signed figure, coloured by its direction. Right-aligned so a column of them lines up. */
export function Delta({ value, up }: { value: string; up: boolean }): React.ReactElement {
  return (
    <span
      className={`ml-auto flex shrink-0 items-center gap-1 font-mono text-[10px] tabular-nums ${
        up ? "text-accent" : "text-danger"
      }`}
    >
      {value}
      <span className="text-[8px]">{up ? "▲" : "▼"}</span>
    </span>
  );
}

/** The mono caption a mark uses to say which of its two halves you are looking at. */
export function MarkNote({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.16em] text-text-faint">
      {children}
    </span>
  );
}
