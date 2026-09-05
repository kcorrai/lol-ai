import { Portrait, TierBadge, Track } from "./screenChrome";

/**
 * The six marks on the free-tools grid.
 *
 * Not screens. A tool card is about 400px across and gives its drawing roughly 100px of
 * height, and the captures that used to sit here were 1440px pages scaled into that — every
 * one came out an unreadable grey rectangle (ADR-050). What fits is the smallest drawing that
 * says what the tool answers: three or four rows, no page furniture.
 *
 * Everything carries a number or a portrait. An earlier pass drew these as plain grey bars,
 * which at this size is indistinguishable from a loading skeleton — a tile that looks like it
 * is still fetching is worse than one that looks decorative, because the reader waits for it.
 *
 * Each is `aria-hidden`: the card's own label and stat line carry the meaning, and announcing
 * an invented win rate as well would only add noise.
 */

/** A champion, at the size these marks can afford. */
function Chip({ w = 34 }: { w?: number }): React.ReactElement {
  return (
    <span
      className="flex h-[13px] items-center border border-line-1 bg-surface-2"
      style={{ width: w }}
    />
  );
}

function Band({ tier, count }: { tier: string; count: number }): React.ReactElement {
  return (
    <div className="flex items-center gap-1.5">
      <TierBadge tier={tier} />
      <span className="flex gap-1">
        {Array.from({ length: count }, (_, i) => (
          <Chip key={i} w={i % 2 === 0 ? 34 : 26} />
        ))}
      </span>
    </div>
  );
}

/** The best answers to one pick, ranked — `/tools/counter-picker`'s whole output. */
export function CounterMark(): React.ReactElement {
  return (
    <div aria-hidden className="grid gap-[7px]">
      {[
        { w: 74, v: "54.1%", up: true },
        { w: 61, v: "52.6%", up: true },
        { w: 42, v: "47.9%", up: false },
      ].map((r) => (
        <div key={r.v} className="flex items-center gap-2">
          <Portrait size={13} />
          <Track value={r.w} tone={r.up ? "accent" : "danger"} className="max-w-[130px] flex-1" />
          <span
            className={`font-mono text-[10px] tabular-nums ${r.up ? "text-accent" : "text-danger"}`}
          >
            {r.v}
          </span>
          <span className={`font-mono text-[9px] ${r.up ? "text-accent" : "text-danger"}`}>
            {r.up ? "▲" : "▼"}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Champions sorted into letter bands, which is what a tier list is. */
export function TierMark(): React.ReactElement {
  return (
    <div aria-hidden className="grid gap-[7px]">
      <Band tier="S" count={3} />
      <Band tier="A" count={4} />
      <Band tier="B" count={4} />
    </div>
  );
}

function Slot({ tone }: { tone: "blue" | "red" }): React.ReactElement {
  return (
    <span
      className={`block h-[15px] w-[15px] border ${
        tone === "blue"
          ? "border-accent-blue/60 bg-accent-blue/20"
          : "border-danger/60 bg-danger/20"
      }`}
    />
  );
}

/** Two comps, graded against each other. */
export function DraftMark(): React.ReactElement {
  return (
    <div aria-hidden className="grid gap-2">
      <div className="flex items-center gap-1.5">
        <span className="w-7 font-mono text-[8.5px] uppercase tracking-[0.12em] text-accent-blue">
          Blue
        </span>
        {[0, 1, 2, 3, 4].map((i) => (
          <Slot key={i} tone="blue" />
        ))}
        <span className="ml-auto font-mono text-[13px] font-bold tabular-nums text-accent">
          58%
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-7 font-mono text-[8.5px] uppercase tracking-[0.12em] text-danger">
          Red
        </span>
        {[0, 1, 2, 3, 4].map((i) => (
          <Slot key={i} tone="red" />
        ))}
        <span className="ml-auto font-mono text-[13px] font-bold tabular-nums text-text-muted">
          42%
        </span>
      </div>
      <Track value={58} className="max-w-[190px]" />
    </div>
  );
}

/** A keystone and the items it is bought towards. */
export function BuildMark(): React.ReactElement {
  return (
    <div aria-hidden className="grid gap-2.5">
      <div className="flex items-center gap-2">
        <span className="block h-[18px] w-[18px] rotate-45 border border-accent bg-accent/25" />
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="block h-[7px] w-[7px] border border-accent/40" />
          ))}
        </span>
        <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.12em] text-text-faint">
          Keystone
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        {[true, true, true, false, false, false].map((done, i) => (
          <span
            key={i}
            className={`block h-[17px] w-[17px] border ${
              done ? "border-accent bg-accent/25" : "border-line-1 bg-surface-2"
            }`}
          />
        ))}
        <span className="ml-1.5 font-mono text-[9.5px] tabular-nums text-text-muted">3 / 6</span>
      </div>
    </div>
  );
}

/** The same bands, plus the balance change that only exists on the Howling Abyss. */
export function AramMark(): React.ReactElement {
  return (
    <div aria-hidden className="grid gap-[7px]">
      <Band tier="S" count={3} />
      <Band tier="A" count={4} />
      <div className="flex items-center gap-2 pt-0.5">
        <span className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-text-faint">
          Balance
        </span>
        <span className="font-mono text-[9.5px] tabular-nums text-accent">+5% dmg</span>
        <span className="font-mono text-[9.5px] tabular-nums text-danger">−10% heal</span>
      </div>
    </div>
  );
}

/** Who moved, and by how much — the only thing a patch report is read for. */
export function MetaMark(): React.ReactElement {
  return (
    <div aria-hidden className="grid gap-[6px]">
      {[
        { d: "+2.1", up: true, w: 68 },
        { d: "+1.4", up: true, w: 52 },
        { d: "−1.8", up: false, w: 44 },
        { d: "−2.6", up: false, w: 60 },
      ].map((r) => (
        <div key={r.d} className="flex items-center gap-2">
          <Portrait size={12} />
          <Chip w={r.w} />
          <span
            className={`ml-auto font-mono text-[10px] tabular-nums ${
              r.up ? "text-accent" : "text-danger"
            }`}
          >
            {r.d}
          </span>
        </div>
      ))}
    </div>
  );
}
