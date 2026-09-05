import Image from "next/image";
import { rankEmblemUrl } from "@/lib/ddragon";
import { Frame, Row } from "./ArsenalFrame";

/**
 * The two Arsenal illustrations that are a readout and nothing else.
 *
 * The other four moved out as they gained media: the draft and the scoreboard to
 * `ArsenalBoards` for champion art and per-cell motion, the AI Coach and Academy panels to
 * `ArsenalMedia` for Riot's ability clips. What is left here needs neither, so it stays
 * static and server-rendered.
 *
 * Everything stated here is a real product default, cited where it is not obvious.
 * They are worked examples, not live queries.
 */

// ── Coaches ───────────────────────────────────────────────────────────────
// A storefront card as it is actually built: the badge is the one thing no
// competitor has, so it is what the card leads on. The three rows are the three
// session kinds a coach can sell, under the names a student sees them by
// (KIND_OPTIONS, src/domains/marketplace/components/options.ts:39). The prices are
// illustrative — coaches set their own, inside the range the footer states
// (MIN/MAX_PRICE_CENTS, src/domains/marketplace/policy.ts:69).
const SELLS: ReadonlyArray<{ kind: string; shape: string; price: string }> = [
  { kind: "Replay review", shape: "Async · your match ids", price: "$25" },
  { kind: "Live 1:1 session", shape: "Scheduled · 60 min", price: "$40" },
  { kind: "Live game coaching", shape: "They watch you queue", price: "$45" },
];

export function CoachMarketVisual(): React.ReactElement {
  return (
    <Frame label="// Coach card">
      {/* The crest is Riot's own, the same asset `RankedCard` and the leaderboard draw. This
          card's entire claim is that the rank was read rather than typed, and the emblem the
          game itself uses is a stronger way to say that than the words "Diamond I". */}
      <div className="notch-sm flex items-start gap-3 border border-accent/40 bg-background p-3">
        <Image
          src={rankEmblemUrl("DIAMOND")}
          alt=""
          aria-hidden
          width={40}
          height={40}
          unoptimized
          className="mt-0.5 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-display text-[13px] font-bold uppercase tracking-[0.05em] text-text">
              Diamond I · Mid
            </span>
            <span className="shrink-0 font-mono text-[11px] text-accent">4.9 ★</span>
          </div>
          <p className="mt-1.5 font-mono text-[11px] uppercase tracking-label text-accent">
            Rank checked by LaneIQ &middot; 6h ago
          </p>
          <p className="mt-0.5 text-[12.5px] text-text-muted">
            Read from their own linked Riot account
          </p>
        </div>
      </div>

      <p className="hud-label mt-4">{"// What they sell"}</p>
      <div className="mt-2 grid gap-2">
        {SELLS.map((s) => (
          <Row key={s.kind}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13px] font-semibold text-text">{s.kind}</span>
              <span className="shrink-0 font-mono text-[11px] text-accent">{s.price}</span>
            </div>
            <p className="mt-0.5 text-[12.5px] text-text-muted">{s.shape}</p>
          </Row>
        ))}
      </div>
      <p className="mt-3 font-mono text-[10.5px] uppercase tracking-label text-text-faint">
        Coaches set their own price &middot; $5 to $1,000
      </p>
    </Frame>
  );
}

// ── Creator kit ───────────────────────────────────────────────────────────
// The five widgets and five commands are the real sets (src/domains/creator/types.ts:9,17).
const COMMANDS = ["!rank", "!session", "!lastgame", "!champs", "!laneiq"];

export function CreatorVisual(): React.ReactElement {
  return (
    <Frame label="// OBS browser source">
      {/* The widget as a viewer sees it on stream, crest included — a rank overlay that was
          only two words is not one anybody would put on a broadcast.

          Diamond rather than the Emerald this used to read, because `rankEmblemUrl` cannot
          currently draw Emerald: the mini-crest set publishes `emerald.svg` where every other
          tier is a `.png`, so that one url 404s. It is a real bug with twelve call sites and it
          is not this section's to fix — LA-113 has it. Shipping a broken image here to make the
          point was the one option not worth taking. */}
      <div className="notch-sm flex items-center gap-3 border border-accent/40 bg-background p-3">
        <Image
          src={rankEmblemUrl("DIAMOND")}
          alt=""
          aria-hidden
          width={38}
          height={38}
          unoptimized
          className="shrink-0"
        />
        <div className="min-w-0">
          <p className="hud-label">Rank widget</p>
          <p className="mt-1 font-display text-lg font-extrabold uppercase text-text">Diamond IV</p>
          <p className="font-mono text-[11.5px] text-accent">+42 LP today · 6W 3L</p>
        </div>
      </div>
      <p className="hud-label mt-4">{"// Chat commands"}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {COMMANDS.map((c) => (
          <span
            key={c}
            className="tag-cut border border-border bg-surface px-2 py-1 font-mono text-[11px] text-text-body"
          >
            {c}
          </span>
        ))}
      </div>
      <p className="mt-3 font-mono text-[10.5px] uppercase tracking-label text-text-faint">
        Twitch · Kick · YouTube
      </p>
    </Frame>
  );
}
