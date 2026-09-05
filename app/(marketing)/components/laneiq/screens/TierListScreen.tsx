import { Illustration } from "../desktop/chrome";
import { Portrait, TierBadge, Window } from "./screenChrome";

/**
 * The tier list, drawn.
 *
 * Columns and their order are `app/(tools)/tools/tier-list/TierTable.tsx`'s: the ordinal, the
 * tier, the champion, the movement since last patch, then win, pick and ban. The lane and
 * rank chips above them are `TierListConsole.tsx`'s first two filter groups.
 *
 * No patch number anywhere in this drawing, deliberately. The photograph this replaces had
 * one burnt into it, which is why it was wrong by the following Wednesday — the live section
 * further down the page (`TierListPreview`) is where a real patch number belongs, because it
 * reads one.
 */

const ROWS: readonly { n: string; tier: string; name: string; delta: string; win: string }[] = [
  { n: "1", tier: "S", name: "Ahri", delta: "▲1", win: "50.9%" },
  { n: "2", tier: "S", name: "Viktor", delta: "▲1", win: "50.3%" },
  { n: "3", tier: "A", name: "Syndra", delta: "▲2", win: "50.4%" },
  { n: "4", tier: "A", name: "Orianna", delta: "▼1", win: "49.8%" },
];

const LANES: readonly string[] = ["Top", "Jungle", "Mid", "ADC", "Support"];

export function TierListScreen(): React.ReactElement {
  return (
    <Illustration
      label="The tier list drawn as an illustration: lane and rank filters above a table of champions with their tier, movement since the last patch and win rate."
      caption="// Illustration — drawn, not a capture"
    >
      <Window name="Tier list" meta="No login">
        <div className="p-3">
          {/* The two filter groups that change what the table is about. The rank band is a
              row of its own on the real console; here it is one chip standing for the set. */}
          <div className="flex flex-wrap items-center gap-1">
            {LANES.map((lane) => (
              <span
                key={lane}
                className={`border px-1.5 py-[3px] font-mono text-[8.5px] uppercase tracking-[0.12em] ${
                  lane === "Mid" ? "border-accent text-accent" : "border-line-1 text-text-faint"
                }`}
              >
                {lane}
              </span>
            ))}
            <span className="ml-auto border border-line-1 px-1.5 py-[3px] font-mono text-[8.5px] uppercase tracking-[0.12em] text-text-faint">
              Emerald+
            </span>
          </div>

          <div className="mt-2.5 grid grid-cols-[14px_18px_1fr_28px_40px] items-center gap-2 border-b border-line-1 pb-1.5">
            {["#", "", "Champion", "Δ", "Win"].map((h, i) => (
              <span
                key={h || i}
                className={`font-mono text-[8px] uppercase tracking-[0.14em] text-text-faint ${
                  i === 4 ? "text-right" : ""
                }`}
              >
                {h}
              </span>
            ))}
          </div>

          <div className="grid">
            {ROWS.map((r) => (
              <div
                key={r.name}
                className="grid grid-cols-[14px_18px_1fr_28px_40px] items-center gap-2 border-b border-line-1 py-[7px] last:border-0"
              >
                <span className="font-mono text-[9.5px] tabular-nums text-text-faint">{r.n}</span>
                <TierBadge tier={r.tier} />
                <span className="flex min-w-0 items-center gap-1.5">
                  <Portrait size={14} />
                  <span className="truncate text-[11px] text-text">{r.name}</span>
                </span>
                <span
                  className={`font-mono text-[9.5px] ${
                    r.delta.startsWith("▲") ? "text-accent" : "text-danger"
                  }`}
                >
                  {r.delta}
                </span>
                <span className="text-right font-mono text-[11px] font-bold tabular-nums text-text">
                  {r.win}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Window>
    </Illustration>
  );
}
