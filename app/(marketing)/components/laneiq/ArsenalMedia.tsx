import Image from "next/image";
import { AbilityClip } from "@/components/ui/AbilityClip";
import { abilityVideoUrl, championSplashUrl, spellIconUrl } from "@/lib/ddragon";
import { DDRAGON_VERSION } from "@/lib/ddragonVersion";
import { Frame, Row } from "./ArsenalFrame";

/**
 * The two Arsenal panels that carry footage, kept apart from `ArsenalVisuals` for the same
 * reason `ArsenalBoards` is: those are text-only and static, and these are not.
 *
 * The clips are Riot's own ability previews, the ones `/champions/[name]` already plays, and
 * they are here only where a champion is genuinely the subject — the AI report is a reading of
 * games played on one, and half the Academy's curriculum is the champion path. A clip behind a
 * panel about booking a human coach would be decoration, so there isn't one.
 *
 * `AbilityClip` sets `preload="none"` and starts on hover or focus, so opening this page costs
 * no video at all: what loads is the poster, which is the ability's own icon.
 */

/**
 * A champion clip with the reason it is here written next to it.
 *
 * Unlabelled, a piece of Riot footage on a marketing page reads as stock atmosphere. The label
 * is what makes it evidence — it says which champion, and what the panel beside it is doing
 * with them.
 */
function ChampionClip({
  champion,
  numericKey,
  spellImage,
  slot,
  caption,
}: {
  /** Display name, for the alt text. */
  champion: string;
  /** Data Dragon's numeric key. `abilityVideoUrl` zero-pads it; the unpadded form 403s. */
  numericKey: string;
  /** The spell icon's `image.full`, read off Data Dragon rather than guessed. */
  spellImage: string;
  slot: "Q1" | "W1" | "E1" | "R1";
  caption: string;
}): React.ReactElement {
  return (
    <figure className="mt-3.5">
      <div className="relative">
        {/* Splash for the poster, not the ability icon. The icon is 64px square; stretched
            across a 16:9 frame it arrives as a block of pixels, and the still that stands in
            for a video has to look like a frame of one. Splash is 1215x717, near enough. */}
        <AbilityClip
          videoUrl={abilityVideoUrl(numericKey, slot)}
          posterUrl={championSplashUrl(champion)}
          alt={`${champion}, whose ability plays here`}
          className="notch-sm aspect-[16/9] w-full border border-border bg-surface-dark"
        />
        {/* The icon still earns a place — it says which of the five this clip is. */}
        <Image
          src={spellIconUrl(DDRAGON_VERSION, spellImage)}
          alt=""
          aria-hidden
          width={26}
          height={26}
          unoptimized
          className="pointer-events-none absolute bottom-2 left-2 border border-accent/50"
        />
      </div>
      <figcaption className="mt-1.5 font-mono text-[10.5px] uppercase tracking-label text-text-faint">
        {caption}
      </figcaption>
    </figure>
  );
}

// ── AI Coach ──────────────────────────────────────────────────────────────
// Depths are the real ones: session review slices 5 matches, climb roadmap 10
// (app/(app)/coaching/PageClient.tsx:62,68).
const REPORTS: ReadonlyArray<{ name: string; reads: string; out: string }> = [
  { name: "Session review", reads: "5 games", out: "What went wrong tonight" },
  { name: "Climb roadmap", reads: "10 games", out: "The path to the next rank" },
  { name: "ARAM review", reads: "5 ARAM games", out: "Howling Abyss only" },
];

export function CoachVisual(): React.ReactElement {
  return (
    <Frame label="// Report types">
      {REPORTS.map((r) => (
        <Row key={r.name}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-display text-[13px] font-bold uppercase tracking-[0.05em] text-text">
              {r.name}
            </span>
            <span className="shrink-0 font-mono text-[11px] text-accent">{r.reads}</span>
          </div>
          <p className="mt-1 text-[12.5px] text-text-muted">{r.out}</p>
        </Row>
      ))}
      <ChampionClip
        champion="Ahri"
        numericKey="103"
        spellImage="AhriQ.png"
        slot="Q1"
        caption="Hover · a report reads the games you played on them"
      />
      <p className="mt-3 font-mono text-[10.5px] uppercase tracking-label text-text-faint">
        Free: 3 a month · Pro: unlimited
      </p>
    </Frame>
  );
}

// ── Academy ───────────────────────────────────────────────────────────────
// A decision drill, one of the five kinds (src/domains/academy/types.ts).
const OPTIONS: ReadonlyArray<{ text: string; verdict: "right" | "wrong" }> = [
  { text: "Freeze it outside your tower", verdict: "right" },
  { text: "Shove and recall", verdict: "wrong" },
  { text: "Trade while it crashes", verdict: "wrong" },
];

export function AcademyVisual(): React.ReactElement {
  return (
    <Frame label="// Decision drill">
      <p className="text-sm leading-relaxed text-text">
        The wave is two casters up and drifting to you. Enemy jungler was last seen top 20s ago.
      </p>
      <div className="mt-3.5 grid gap-2">
        {OPTIONS.map((o) => (
          <div
            key={o.text}
            className={`notch-sm border px-3 py-2 text-[13px] ${
              o.verdict === "right"
                ? "border-accent bg-accent/10 text-text"
                : "border-border bg-surface text-text-muted"
            }`}
          >
            {o.text}
          </div>
        ))}
      </div>
      {/* Ryze, because the five-lesson champion path is the half of the curriculum this drill
          does not show — the six core tracks are role-agnostic and the paths are not. */}
      <ChampionClip
        champion="Ryze"
        numericKey="13"
        spellImage="RyzeQWrapper.png"
        slot="Q1"
        caption="Hover · five more lessons on the champion you play"
      />
      <p className="mt-3 font-mono text-[10.5px] uppercase tracking-label text-text-faint">
        Then it is measured in your own ranked games
      </p>
    </Frame>
  );
}
