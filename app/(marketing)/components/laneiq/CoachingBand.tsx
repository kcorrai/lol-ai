import Image from "next/image";
import Link from "next/link";
import { championSplashUrl, rankEmblemUrl } from "@/lib/ddragon";
import { SectionHead } from "./SectionHead";
import { EdgeSweep, HudStagger, HudStaggerItem } from "./motion";

/**
 * The half of the product that is a person.
 *
 * This band used to be two columns — the marketplace on the left, the Team plan on the
 * right — sitting fourteenth on a page whose other sixteen sections argue the AI report.
 * That is the wrong weight for a section built end to end (LA-19, `docs/MARKETPLACE_PLAN.md`)
 * and it is the reason a visitor read "coaching" here as meaning only the generated report.
 * The Team plan is a pricing tier and is argued where pricing is, at `/pricing#teams`.
 *
 * The copy leads on the badge rather than on the coaches, because the badge is the only
 * claim in this category nobody else makes: every competitor lets a coach type their rank
 * into a bio. Every fact below is read from the section — the refresh cadence is
 * `refreshCoachRanks.ts`, the session kinds are `KIND_OPTIONS`, the 48-hour expiry and the
 * blind-review window are `policy.ts`, and the recorded transitions are `bookingEventService.ts`.
 */

interface Sell {
  kind: string;
  detail: string;
}

/** The three things a coach can sell, under the names the storefront gives them. */
const SELLS: readonly Sell[] = [
  {
    kind: "Replay review",
    detail:
      "Async. You hand over match ids or a link and what you want looked at; it comes back written, with the timestamps marked.",
  },
  {
    kind: "Live 1:1 session",
    detail:
      "A scheduled call on a slot you picked out of their real availability, in their own timezone and yours.",
  },
  {
    kind: "Live game coaching",
    detail: "They watch the games you are playing as you play them, then tell you what they saw.",
  },
];

interface Point {
  title: string;
  detail: string;
}

const TRUST: readonly Point[] = [
  {
    title: "The rank is ours, not theirs",
    detail:
      "Read from the coach's own linked Riot account and re-read every six hours. The date we last checked it is on the badge.",
  },
  {
    title: "Priced and scheduled before you talk",
    detail:
      "Rate, session length, languages and free slots are all on the profile. Nothing is quoted in a DM.",
  },
  {
    title: "A request cannot sit open",
    detail:
      "A coach has 48 hours to accept one, or it expires itself. Nobody is left waiting on a session nobody agreed to run.",
  },
  {
    title: "Every change is on the record",
    detail:
      "Each move a booking makes is written down with who made it and why — so a refusal is something you can read, not a policy nobody can reconstruct.",
  },
];

export function CoachingBand(): React.ReactElement {
  return (
    <section id="coaches" className="px-5 pt-16 md:px-8 md:pt-[72px]">
      <div className="mx-auto max-w-[1240px]">
        <SectionHead title="When you want a person" aside="Coach marketplace" />

        <div className="notch-lg relative overflow-hidden border border-border bg-surface">
          {/* Ground art, on `AcademyBand`'s pattern — a champion at a fifth of full strength
              under a gradient and the scanlines. Not a coach: there are no photographs of these
              people and inventing some would be the one dishonest thing this section could do,
              given that its whole argument is that what it shows you was checked. */}
          <Image
            src={championSplashUrl("Braum")}
            alt=""
            aria-hidden
            fill
            sizes="(max-width: 1240px) 100vw, 1240px"
            className="object-cover object-[46%_14%] opacity-[0.5] grayscale-[0.25]"
          />
          {/* Tuned by looking, twice. `AcademyBand`'s weights put the art in the DOM and left it
              invisible on screen — the bytes without the picture. Two things were eating it: the
              gradient was densest across the left column, which is the only half that is
              transparent, and the right column paints its own opaque `bg-surface-dark` over
              everything behind it. So the dark end is pulled back to the first eighth, where the
              headline actually needs contrast, and clears from there. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(90deg,var(--ink-1000)_10%,rgba(6,10,9,.70)_38%,rgba(6,10,9,.34)_100%)]"
          />
          <div aria-hidden className="bg-scanline absolute inset-0" />

          <EdgeSweep />

          <div className="relative grid lg:grid-cols-[1.05fr_1fr]">
            <div className="border-b border-border p-6 md:p-8 lg:border-b-0 lg:border-r">
              <span className="font-mono text-[11px] uppercase tracking-label text-accent">
                {"// Marketplace"}
              </span>
              <h3 className="mt-2.5 max-w-[19ch] font-display text-[26px] font-extrabold uppercase leading-[1.1] text-text md:text-[32px]">
                Book a coach whose rank we checked
              </h3>
              <p className="mt-3.5 max-w-[48ch] text-[15px] leading-relaxed text-text-body">
                Filter by rank, role, language and price. Every badge on the storefront was read
                from that coach&apos;s own linked Riot account, and carries the date we read it.
                Nobody here types their rank into a box.
              </p>

              <HudStagger className="mt-6 grid gap-3.5">
                {TRUST.map((p) => (
                  <HudStaggerItem key={p.title}>
                    <div className="grid grid-cols-[14px_1fr] items-start gap-3">
                      <span aria-hidden className="mt-[7px] h-1.5 w-1.5 bg-accent" />
                      <div>
                        <p className="text-[13.5px] font-semibold text-text">{p.title}</p>
                        <p className="mt-0.5 max-w-[52ch] text-[13px] leading-relaxed text-text-muted">
                          {p.detail}
                        </p>
                      </div>
                    </div>
                  </HudStaggerItem>
                ))}
              </HudStagger>

              <Link
                href="/coaches"
                className="tag-cut mt-7 inline-flex h-9 items-center bg-accent px-5 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-background transition-colors hover:bg-acid-400"
              >
                Browse coaches
              </Link>
            </div>

            {/* Not `bg-surface-dark`: opaque, it painted over the ground art behind the whole
                right half. At 82% the column still reads as the darker of the two and the
                picture survives underneath it. */}
            <div className="flex flex-col bg-surface-dark/[0.82] p-6 md:p-8">
              <span className="hud-label">{"// Three ways to be coached"}</span>
              <HudStagger className="mt-3.5 grid gap-2.5">
                {SELLS.map((s, i) => (
                  <HudStaggerItem key={s.kind}>
                    <div className="notch-sm border border-border bg-surface p-4">
                      <div className="flex items-baseline gap-2.5">
                        <span className="font-mono text-[10.5px] text-accent">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="font-display text-[13.5px] font-bold uppercase tracking-[0.05em] text-text">
                          {s.kind}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-text-muted">
                        {s.detail}
                      </p>
                    </div>
                  </HudStaggerItem>
                ))}
              </HudStagger>

              {/* The badge itself, which the column below spent four bullets describing and
                  never showed. The crest is Riot's own — the same asset the leaderboard and
                  `RankedCard` draw — because a rank we say we read should look like the rank
                  the game gives, not like a word we typed. No portrait and no name: the coach
                  is a real person we do not have, and a made-up one would undercut the only
                  claim this section makes. */}
              <div className="notch-sm mt-6 flex items-center gap-3.5 border border-accent/40 bg-background p-4">
                <Image
                  src={rankEmblemUrl("DIAMOND")}
                  alt=""
                  aria-hidden
                  width={46}
                  height={46}
                  unoptimized
                  className="shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-display text-[14px] font-bold uppercase tracking-[0.05em] text-text">
                    Diamond I · Mid
                  </p>
                  <p className="mt-1 font-mono text-[10.5px] uppercase tracking-label text-accent">
                    Rank checked by LaneIQ &middot; 6h ago
                  </p>
                </div>
                <span className="ml-auto shrink-0 font-mono text-[11px] text-accent">4.9 ★</span>
              </div>

              <p className="mt-auto max-w-[46ch] pt-6 font-mono text-[10.5px] uppercase leading-relaxed tracking-label text-text-faint">
                One booking is one session &middot; no packages &middot; reviews stay blind for 14
                days or until both sides are in
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
