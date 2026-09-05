import Image from "next/image";
import { ItemIcon } from "@/components/ui/ItemIcon";
import { keystoneIconUrl } from "@/lib/ddragonRunes";
import { TierBadge, Track } from "./screenChrome";
import { Delta, MarkNote, Plate, Slot } from "./markParts";

/**
 * The four marks on the free-tools grid's second row — the lookups.
 *
 * `featuredMarks.tsx` holds the three lead ones and carries the rules both files follow.
 * These tiles are shorter, so each of these marks is three or four rows rather than five.
 */

/** Two comps, graded against each other — `/tools/draft-analyzer`. */
// Two finished comps, five champions each — the analyzer only has anything to say once both
// sides are full. Display names, never Data Dragon keys (`markParts.tsx`).
const COMPS: Record<"blue" | "red", readonly string[]> = {
  blue: ["K'Sante", "Sejuani", "Orianna", "Jinx", "Rell"],
  red: ["Aatrox", "Vi", "Ahri", "Ashe", "Nautilus"],
};

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
          {COMPS[side].map((c) => (
            <Slot key={c} tone={side} champion={c} />
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

/**
 * A keystone, the items it is bought towards, and the order the spells go up.
 *
 * Riot's own rune and item art, the same assets `desktop/OverlayVisual.tsx` draws its build
 * path from. A rotated green square standing for a keystone and six grey boxes standing for
 * items was the tile in this grid that said least about what its tool does — a build page is
 * read by recognising the icons, so the drawing has to carry them.
 *
 * Electrocute into a mid-lane burst build. Item ids are Data Dragon's and are stable across
 * patches; the three unbought ones are dimmed rather than hidden, which is how a build path
 * reads as a path.
 */
const KEYSTONE_ID = 9101; // Electrocute
const BUILD: readonly { id: number; done: boolean }[] = [
  { id: 6655, done: true }, // Luden's Companion
  { id: 3020, done: true }, // Sorcerer's Shoes
  { id: 4645, done: true }, // Shadowflame
  { id: 3089, done: false }, // Rabadon's Deathcap
  { id: 3157, done: false }, // Zhonya's Hourglass
  { id: 3135, done: false }, // Void Staff
];

export function BuildMark(): React.ReactElement {
  return (
    <div aria-hidden className="grid gap-2">
      <div className="flex items-center gap-2">
        <Image
          src={keystoneIconUrl(KEYSTONE_ID)}
          alt=""
          aria-hidden
          width={18}
          height={18}
          unoptimized
          className="block shrink-0"
        />
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="block h-[7px] w-[7px] border border-accent/40" />
          ))}
        </span>
        <MarkNote>keystone</MarkNote>
      </div>
      <div className="flex items-center gap-1.5">
        {BUILD.map((item) => (
          <span
            key={item.id}
            className={`flex shrink-0 ${item.done ? "" : "opacity-40 grayscale"}`}
            style={{ lineHeight: 0 }}
          >
            <ItemIcon itemId={item.id} size={16} />
          </span>
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
        { r: 1, c: "Ziggs", mod: "+5% dmg", up: true },
        { r: 2, c: "Soraka", mod: "−10% heal", up: false },
        { r: 3, c: "Lux", mod: "+8% taken", up: false },
      ].map((row) => (
        <div key={row.c} className="flex items-center gap-2">
          <Plate rank={row.r} champion={row.c} tone={row.up ? "accent" : "danger"} />
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
        { r: 1, c: "Yone", d: "+2.1", up: true, w: 68 },
        { r: 2, c: "Sejuani", d: "+1.4", up: true, w: 52 },
        { r: 3, c: "Kai'Sa", d: "−1.8", up: false, w: 44 },
        { r: 4, c: "Nautilus", d: "−2.6", up: false, w: 60 },
      ].map((row) => (
        <div key={row.c} className="flex items-center gap-2">
          <Plate rank={row.r} champion={row.c} tone={row.up ? "accent" : "danger"} />
          <Track value={row.w} tone={row.up ? "accent" : "danger"} className="min-w-0 flex-1" />
          <Delta value={row.d} up={row.up} />
        </div>
      ))}
    </div>
  );
}
