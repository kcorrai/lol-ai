import { Bar, Chip, Illustration, Panel, Stat } from "./chrome";

/**
 * The overlay, over a game.
 *
 * `desktop/src/screens/OverlayScreen.tsx` is a transparent window drawing a `grid gap-3 p-3`
 * of opaque panels and nothing else — no chrome, no navigation, no ground of its own — so
 * that is what this draws, on a dark rectangle standing in for the match underneath.
 *
 * The three panels are the ones a player is most likely to have switched on, in the order
 * that file lists them: `ThisGamePanel`, `MatchupPanel`, `BuildPanel`. Their content follows
 * the real ones — this game's numbers against the player's own baseline, the patch-wide
 * matchup kept apart from the personal record with its sample size attached, and the item
 * the build is working towards.
 *
 * The two halves of the lane panel sit either side of a rule for the same reason they do in
 * `MatchupPanel.tsx`: a patch win rate is a fact about the matchup, a personal one is a fact
 * about the player, and averaging them produces a number true of nobody.
 */

const ITEMS: readonly { name: string; done: boolean }[] = [
  { name: "Eclipse", done: true },
  { name: "Ionian Boots", done: true },
  { name: "Sundered Sky", done: true },
  { name: "Death's Dance", done: false },
  { name: "Sterak's Gage", done: false },
];

export function OverlayVisual({ compact = false }: { compact?: boolean } = {}): React.ReactElement {
  return (
    <Illustration
      label="The companion's overlay drawn over a running game: three panels showing this game's numbers against the player's own average, the lane matchup, and the build."
      caption="// Illustration — the overlay's own panels, drawn"
    >
      <div className="notch-lg relative overflow-hidden border border-border bg-ink-1000">
        {/* The match underneath.
            Deliberately not a screenshot of League and deliberately not champion art: this is
            the ground the overlay is transparent to, and anything legible in it would compete
            with the panels, which are the subject. What it has to do instead is read as depth
            rather than as an empty box — so it is a fight's worth of coloured light going off
            behind frosted glass, two teams' worth of it, over the instrument grid. */}
        <div
          aria-hidden
          className="absolute inset-0"
          // `background`, not `backgroundImage`: `--bg-grid` carries a position and a size
          // (`0 0 / 32px 32px`), which only the shorthand accepts. Naming it in
          // `background-image` makes the whole declaration invalid, and an invalid
          // declaration is dropped in silence — the frame renders flat black with no error
          // anywhere to say why.
          style={{
            background:
              "radial-gradient(58% 62% at 26% 74%, rgba(198,255,61,.22), transparent 66%)," +
              "radial-gradient(46% 52% at 46% 34%, rgba(76,143,255,.18), transparent 68%)," +
              "radial-gradient(38% 44% at 12% 26%, rgba(255,140,60,.12), transparent 70%)," +
              "var(--bg-grid)",
          }}
        />
        {/* A vignette, so the frame has edges and the light has somewhere to fall off to. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(120% 92% at 46% 52%, transparent 42%, rgba(5,7,6,.72) 100%)",
          }}
        />
        <div aria-hidden className="bg-scanline absolute inset-0 opacity-60" />

        <div className={`relative ${compact ? "p-4" : "p-5 md:p-7"}`}>
          {/* The corner it is pinned to is the player's — screen, corner and margin are all
              settings. Drawn top-right because that is where the window opens by default. */}
          <div className={`ml-auto grid gap-3 ${compact ? "max-w-[260px]" : "max-w-[300px]"}`}>
            <Panel title="This game" meta="vs your last 20">
              <div className="grid gap-2.5">
                <Stat label="CS / min" value="7.4" bar={78} note="You usually finish on 6.1" />
                <Stat label="Gold / min" value="412" bar={64} tone="info" />
                <Stat label="KDA" value="4 / 1 / 3" bar={71} tone="accent" />
              </div>
            </Panel>

            {/* All three panels in both sizes. An earlier draft dropped this one when
                `compact`, which left the landing band's frame two-thirds empty — the panels
                are the subject, and fewer of them does not make the picture smaller, it makes
                it emptier. `compact` is a width and a padding, nothing else. */}
            <Panel title="This lane" meta="Darius vs Sett · 15.3">
              <div className="grid gap-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-faint">
                    Patch
                  </span>
                  <span className="font-display text-[11px] font-bold uppercase tracking-[0.06em] text-danger">
                    Unfavoured
                  </span>
                </div>
                <Stat label="Matchup win rate" value="46.8%" bar={47} tone="danger" />
                {/* The rule. Above it is everyone, below it is this player. */}
                <div className="border-t border-line-1 pt-2.5">
                  <Stat
                    label="Yours"
                    value="2W 3L"
                    bar={40}
                    tone="warning"
                    note="5 games — too few to call a trend"
                  />
                </div>
              </div>
            </Panel>

            <Panel title="Build" meta="Next: Death's Dance">
              <div className="grid gap-2">
                {ITEMS.map((item) => (
                  <div key={item.name} className="flex items-center gap-2.5">
                    <span
                      className={`h-4 w-4 shrink-0 border ${
                        item.done ? "border-accent bg-accent/20" : "border-line-1 bg-surface-dark"
                      }`}
                    />
                    <span
                      className={`min-w-0 flex-1 truncate text-[11px] ${
                        item.done ? "text-text-body" : "text-text-faint"
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>
                ))}
                <Bar value={62} tone="accent" className="mt-1" />
              </div>
            </Panel>

            <div className="flex justify-end">
              <Chip tone="accent">Ctrl + Alt + L to hide</Chip>
            </div>
          </div>
        </div>
      </div>
    </Illustration>
  );
}
