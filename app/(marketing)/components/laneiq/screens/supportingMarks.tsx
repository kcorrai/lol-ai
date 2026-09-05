import { TierBadge, Track } from "./screenChrome";
import { Delta, MarkNote, Plate, Slot } from "./markParts";

/**
 * The four marks on the free-tools grid's second row — the lookups.
 *
 * `featuredMarks.tsx` holds the three lead ones and carries the rules both files follow.
 * These tiles are shorter, so each of these marks is three or four rows rather than five.
 */

/** Two comps, graded against each other — `/tools/draft-analyzer`. */
export function DraftMark(): React.ReactElement {
  return (
    <div aria-hidden className="grid gap-2">
      {(["blue", "red"] as const).map((side) => (
        <div key={side} className="flex items-center gap-1.5">
          <span
            className={`w-7 shrink-0 font-mono text-[8.5px] uppercase tracking-[0.12em] ${
              side === "blue" ? "text-accent-blue" : "text-danger"
            }`}
          >
            {side}
          </span>
          {[0, 1, 2, 3, 4].map((i) => (
            <Slot key={i} tone={side} />
          ))}
          <span
            className={`ml-auto font-mono text-[13px] font-bold tabular-nums ${
              side === "blue" ? "text-accent" : "text-text-muted"
            }`}
          >
            {side === "blue" ? "58%" : "42%"}
          </span>
        </div>
      ))}
      {/* The axes `CompReadout` grades a comp on. A single 58/42 says who wins; these say
          why, which is the only reason to open the analyzer rather than the tier list. */}
      <div className="flex items-center gap-3">
        {[
          { axis: "Frontline", v: 72 },
          { axis: "Engage", v: 44 },
        ].map((a) => (
          <span key={a.axis} className="flex min-w-0 flex-1 items-center gap-1.5">
            <MarkNote>{a.axis}</MarkNote>
            <Track value={a.v} tone={a.v >= 50 ? "accent" : "warning"} className="min-w-0 flex-1" />
          </span>
        ))}
      </div>
    </div>
  );
}

/** A keystone, the items it is bought towards, and the order the spells go up. */
export function BuildMark(): React.ReactElement {
  return (
    <div aria-hidden className="grid gap-2">
      <div className="flex items-center gap-2">
        <span className="block h-[16px] w-[16px] rotate-45 border border-accent bg-accent/25" />
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="block h-[7px] w-[7px] border border-accent/40" />
          ))}
        </span>
        <MarkNote>keystone</MarkNote>
      </div>
      <div className="flex items-center gap-1.5">
        {[true, true, true, false, false, false].map((done, i) => (
          <span
            key={i}
            className={`block h-[16px] w-[16px] border ${
              done ? "border-accent bg-accent/25" : "border-line-1 bg-surface-2"
            }`}
          />
        ))}
        <span className="ml-1 font-mono text-[9.5px] tabular-nums text-text-muted">3 / 6</span>
        <span className="ml-auto">
          <MarkNote>items</MarkNote>
        </span>
      </div>
      <div className="flex items-center gap-1">
        <MarkNote>skills</MarkNote>
        {["Q", "W", "E", "Q", "R"].map((k, i) => (
          <span
            key={i}
            className={`flex h-[13px] w-[13px] items-center justify-center border font-mono text-[8px] ${
              k === "R" ? "border-accent text-accent" : "border-line-1 text-text-muted"
            }`}
          >
            {k}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * The balance changes that only exist on the Howling Abyss — `/aram/tier-list`.
 *
 * They lead rather than trail: a separate dataset is the tile's entire claim, and the
 * letter bands it used to open with were the same drawing as the tier list tile.
 */
export function AramMark(): React.ReactElement {
  return (
    <div aria-hidden className="grid gap-[6px]">
      <div className="flex items-center justify-between gap-2">
        <MarkNote>aram balance</MarkNote>
        <MarkNote>howling abyss</MarkNote>
      </div>
      {[
        { r: 1, mod: "+5% dmg", up: true },
        { r: 2, mod: "−10% heal", up: false },
        { r: 3, mod: "+8% taken", up: false },
      ].map((row) => (
        <div key={row.r} className="flex items-center gap-2">
          <Plate rank={row.r} tone={row.up ? "accent" : "danger"} />
          <span
            className={`font-mono text-[9.5px] tabular-nums ${
              row.up ? "text-accent" : "text-danger"
            }`}
          >
            {row.mod}
          </span>
          <span className="ml-auto">
            <TierBadge tier={row.up ? "S" : "B"} />
          </span>
        </div>
      ))}
    </div>
  );
}

/** Who moved, and by how much — the only thing a patch report is read for. */
export function MetaMark(): React.ReactElement {
  return (
    <div aria-hidden className="grid gap-[6px]">
      <div className="flex items-center justify-between gap-2">
        <MarkNote>rising</MarkNote>
        <MarkNote>falling</MarkNote>
      </div>
      {[
        { r: 1, d: "+2.1", up: true, w: 68 },
        { r: 2, d: "+1.4", up: true, w: 52 },
        { r: 3, d: "−1.8", up: false, w: 44 },
        { r: 4, d: "−2.6", up: false, w: 60 },
      ].map((row) => (
        <div key={row.d} className="flex items-center gap-2">
          <Plate rank={row.r} tone={row.up ? "accent" : "danger"} />
          <Track value={row.w} tone={row.up ? "accent" : "danger"} className="min-w-0 flex-1" />
          <Delta value={row.d} up={row.up} />
        </div>
      ))}
    </div>
  );
}
