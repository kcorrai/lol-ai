import Image from "next/image";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { ItemIcon } from "@/components/ui/ItemIcon";
import { championSplashUrl } from "@/lib/ddragon";
import { Bar, Chip, Illustration, Panel, Stat } from "./chrome";
import { OVERLAY_FINAL, type OverlayFrame } from "./overlayDemoTimeline";

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

/**
 * The build, with the icons the real panel draws.
 *
 * `desktop/src/components/build/BuildReading.tsx` renders an item as its icon *and* its name,
 * because "the icon beside each one is what they actually recognise mid-game". This drawing
 * showed only the names, which made it a worse likeness of the panel than it needed to be.
 *
 * The ids are Data Dragon's, read off `item.json` for the pinned version rather than recalled
 * — they are the one thing here a reader can catch us getting wrong, since a wrong id renders
 * somebody else's item. Verified 200 on the CDN at the time of writing.
 */
const ITEMS: readonly { id: number; name: string; done: boolean }[] = [
  { id: 6692, name: "Eclipse", done: true },
  { id: 3158, name: "Ionian Boots", done: true },
  { id: 6610, name: "Sundered Sky", done: true },
  { id: 6333, name: "Death's Dance", done: false },
  { id: 3053, name: "Sterak's Gage", done: false },
];

/**
 * Bar lengths for the "This game" readings. The scales are the ones that put the drawing's
 * resting numbers (7.4, 412, 4/1/3) where they have always sat — 78, 64 and 71 — so a moving
 * frame and the still one agree.
 */
function thisGameBars(game: OverlayFrame): { cs: number; gold: number; kda: number } {
  const kda = (game.kills + game.assists) / Math.max(game.deaths, 1);
  return {
    cs: Math.round((game.csPerMin / 9.5) * 100),
    gold: Math.round((game.goldPerMin / 644) * 100),
    kda: Math.round((kda / 9.86) * 100),
  };
}

export function OverlayVisual({
  compact = false,
  game = OVERLAY_FINAL,
}: {
  compact?: boolean;
  /** The "This game" readings. `OverlayDemo` moves them; everywhere else they rest. */
  game?: OverlayFrame;
} = {}): React.ReactElement {
  const bars = thisGameBars(game);
  return (
    <Illustration
      label="The companion's overlay drawn over a running game: three panels showing this game's numbers against the player's own average, the lane matchup, and the build."
      caption="// Illustration — the overlay's own panels, drawn"
    >
      <div className="notch-lg relative overflow-hidden border border-border bg-ink-1000">
        {/* The match underneath.
            Still not a screenshot of League — there is no honest way to ship one — but no longer
            nothing either. An earlier pass argued champion art would compete with the panels and
            left only coloured light, which read as an empty box: the overlay is transparent to
            *something*, and a reader could not tell what. Darius is the champion the panels are
            about, so he is what is behind them, at a fifth of full strength and desaturated with
            the light and the vignette still stacked on top. Nothing in him survives legibly at
            that weight, which was the original worry, and the frame stops looking unfinished. */}
        <Image
          src={championSplashUrl("Darius")}
          alt=""
          aria-hidden
          fill
          sizes="(max-width: 1024px) 100vw, 720px"
          className="object-cover object-[62%_28%] opacity-[0.2] grayscale-[0.35]"
        />
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
                <Stat
                  label="CS / min"
                  value={game.csPerMin.toFixed(1)}
                  bar={bars.cs}
                  note="You usually finish on 6.1"
                />
                <Stat
                  label="Gold / min"
                  value={String(game.goldPerMin)}
                  bar={bars.gold}
                  tone="info"
                />
                <Stat
                  label="KDA"
                  value={`${game.kills} / ${game.deaths} / ${game.assists}`}
                  bar={bars.kda}
                  tone="accent"
                />
              </div>
            </Panel>

            {/* All three panels in both sizes. An earlier draft dropped this one when
                `compact`, which left the landing band's frame two-thirds empty — the panels
                are the subject, and fewer of them does not make the picture smaller, it makes
                it emptier. `compact` is a width and a padding, nothing else. */}
            <Panel title="This lane" meta="15.3">
              <div className="grid gap-2.5">
                {/* The matchup, as the two faces rather than as two words in the header. Display
                    names, not Data Dragon keys: `normalizeChampionKey` owns that mapping and a
                    hand-written key 403s into a letter tile. */}
                <div className="flex items-center gap-2">
                  <ChampionIcon name="Darius" size={18} />
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-faint">
                    vs
                  </span>
                  <ChampionIcon name="Sett" size={18} />
                </div>
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
                  <div key={item.id} className="flex items-center gap-2.5">
                    {/* Bought items are lit and unbought ones are dimmed, which is the state
                        the empty boxes used to carry in their border. Dimming the icon rather
                        than hiding it keeps the build path readable as a path — the reader can
                        see what is coming, not only what is there. */}
                    <span
                      className={`flex shrink-0 ${item.done ? "" : "opacity-40 grayscale"}`}
                      style={{ lineHeight: 0 }}
                    >
                      <ItemIcon itemId={item.id} size={18} />
                    </span>
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
