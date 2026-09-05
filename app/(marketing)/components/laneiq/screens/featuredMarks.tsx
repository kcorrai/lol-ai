import { Portrait, TierBadge, Track } from "./screenChrome";
import { LaneChips, MarkNote, Plate, PlateRow, Slot } from "./markParts";

/**
 * The three marks on the free-tools grid's lead row — the tools that answer the question
 * a visitor actually arrives with. `supportingMarks.tsx` holds the four lookups.
 *
 * These are not screens. A lead tile gives its drawing about 340px of width and 170px of
 * height, and the captures that used to sit here were 1440px pages scaled into that — every
 * one came out an unreadable grey rectangle (ADR-050). What fits is the smallest drawing
 * that says what the tool answers: four or five rows, no page furniture.
 *
 * Two rules the earlier pass broke, kept in both files on purpose:
 *
 * **No two marks draw the same picture.** The tier list and the ARAM tier list both
 * rendered plain letter bands, landing one above the other in the same column and reading
 * as the same tile twice. The lane filter belongs only to the Rift list, and the ARAM one
 * now leads with the balance table that is the entire reason it exists as a separate
 * dataset.
 *
 * **Each mark runs the full width of its tile.** They used to stop at 130-190px caps,
 * which left the right half of every tile empty.
 *
 * Each is `aria-hidden`: the card's own label and stat line carry the meaning, and
 * announcing an illustrative win rate as well would only add noise.
 */

/** A tier band: the letter, then the champions sitting in it. */
function Band({
  tier,
  champions,
  from,
}: {
  tier: string;
  champions: readonly string[];
  from: number;
}): React.ReactElement {
  return (
    <div className="flex items-center gap-1.5">
      <TierBadge tier={tier} />
      <PlateRow champions={champions} from={from} tone={tier === "S" ? "accent" : "idle"} />
    </div>
  );
}

/**
 * The best answers to one pick, ranked — `/tools/counter-picker`'s whole output.
 *
 * The `vs` header is what makes this a counter picker rather than a tier list: the list
 * only means anything against a champion somebody has already locked.
 */
export function CounterMark(): React.ReactElement {
  return (
    <div aria-hidden className="grid gap-[7px]">
      <div className="flex items-center gap-2 pb-0.5">
        <MarkNote>vs</MarkNote>
        <Portrait size={15} name="Zed" />
        <span className="border border-line-1 px-1 py-px font-mono text-[7.5px] tracking-[0.1em] text-text-muted">
          MID
        </span>
        <MarkNote>best answers</MarkNote>
      </div>
      {[
        { r: 1, c: "Malzahar", w: 74, v: "54.1%", up: true },
        { r: 2, c: "Lissandra", w: 61, v: "52.6%", up: true },
        { r: 3, c: "Galio", w: 55, v: "51.2%", up: true },
        { r: 4, c: "Kassadin", w: 42, v: "47.9%", up: false },
      ].map((row) => (
        <div key={row.c} className="flex items-center gap-2">
          <Plate rank={row.r} champion={row.c} tone={row.up ? "accent" : "danger"} />
          <Track value={row.w} tone={row.up ? "accent" : "danger"} className="min-w-0 flex-1" />
          <span
            className={`w-[38px] shrink-0 text-right font-mono text-[10px] tabular-nums ${
              row.up ? "text-accent" : "text-danger"
            }`}
          >
            {row.v}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Champions sorted into letter bands, one lane at a time — `/tools/tier-list`. */
export function TierMark(): React.ReactElement {
  return (
    <div aria-hidden className="grid gap-[7px]">
      <div className="flex items-center justify-between gap-2 pb-0.5">
        <LaneChips active="MID" />
        <MarkNote>this patch</MarkNote>
      </div>
      <Band tier="S" champions={["Ahri", "Viktor", "Sylas"]} from={1} />
      <Band tier="A" champions={["Syndra", "Orianna", "Yone", "Akali"]} from={4} />
      <Band tier="B" champions={["Zed", "Vex", "Ryze", "Corki"]} from={8} />
    </div>
  );
}

/**
 * A pick/ban in progress — `src/domains/draft/components/BanRail.tsx` and
 * `TurnIndicator.tsx`. The clock and the slot under it are the point: this is the only
 * tool in the grid where something is happening while you look at it.
 */
// A draft eleven actions deep: three bans a side, two picks each locked, and red on the
// clock for its third. An empty string is a slot the sequence has not reached.
const BLUE_BANS: readonly string[] = ["Aatrox", "Vi", "Ahri", "", ""];
const RED_BANS: readonly string[] = ["Jinx", "Sett", "Zed", "", ""];
const BLUE_PICKS: readonly string[] = ["K'Sante", "Sejuani", "Orianna", "", ""];
const RED_PICKS: readonly string[] = ["Rell", "Ashe", "", "", ""];

export function DraftRoomMark(): React.ReactElement {
  return (
    <div aria-hidden className="grid gap-2">
      <div className="flex items-center gap-2">
        <MarkNote>bans</MarkNote>
        <span className="flex gap-1">
          {BLUE_BANS.map((c, i) => (
            <Slot key={`b${i}`} tone="blue" champion={c} size={11} state={c ? "banned" : "empty"} />
          ))}
        </span>
        <span className="flex gap-1">
          {RED_BANS.map((c, i) => (
            <Slot key={`r${i}`} tone="red" champion={c} size={11} state={c ? "banned" : "empty"} />
          ))}
        </span>
        <span className="ml-auto shrink-0 border border-accent/50 px-1 py-px font-mono text-[7.5px] tracking-[0.1em] text-accent">
          FEARLESS
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-7 shrink-0 font-mono text-[8.5px] uppercase tracking-[0.12em] text-accent-blue">
          Blue
        </span>
        {BLUE_PICKS.map((c, i) => (
          <Slot key={i} tone="blue" champion={c} state={c ? "filled" : "empty"} />
        ))}
        <span className="ml-auto font-mono text-[13px] font-bold tabular-nums text-accent">
          0:24
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-7 shrink-0 font-mono text-[8.5px] uppercase tracking-[0.12em] text-danger">
          Red
        </span>
        {RED_PICKS.map((c, i) => (
          <Slot
            key={i}
            tone="red"
            champion={c}
            state={i === 2 ? "pending" : c ? "filled" : "empty"}
          />
        ))}
        <span className="ml-auto">
          <MarkNote>red to pick</MarkNote>
        </span>
      </div>
      {/* Where in the twenty-step sequence the room is. `DRAFT_SEQUENCE` is twenty actions
          long, and the phase label is `BanRail`'s own. */}
      <div className="flex items-center gap-2">
        <MarkNote>pick phase 1</MarkNote>
        <span className="flex flex-1 gap-[3px]">
          {Array.from({ length: 20 }, (_, i) => (
            <span
              key={i}
              className={`h-[5px] flex-1 ${i < 9 ? "bg-accent/60" : i === 9 ? "bg-accent" : "bg-surface-2"}`}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
