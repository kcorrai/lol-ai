import Image from "next/image";
import Link from "next/link";
import { championSplashUrl } from "@/lib/ddragon";
import { SectionHead } from "./SectionHead";
import { HudReveal, HudStagger, HudStaggerItem } from "./motion";

/**
 * The Academy, which shipped months ago and has never appeared on this page.
 *
 * The tracks and their lesson counts are transcribed from
 * `src/domains/academy/content/tracks.ts` (six core tracks of six lessons, five
 * role paths of five — 61 in total) rather than imported: this band is marketing
 * copy about a curriculum, not a rendering of it, and it should not silently
 * restructure itself when a lesson is added.
 */

interface Track {
  name: string;
  lessons: number;
  role?: boolean;
}

const TRACKS: readonly Track[] = [
  { name: "Foundations", lessons: 6 },
  { name: "Laning", lessons: 6 },
  { name: "Vision & Map", lessons: 6 },
  { name: "Macro", lessons: 6 },
  { name: "Teamfighting", lessons: 6 },
  { name: "Mental & Consistency", lessons: 6 },
  { name: "Top path", lessons: 5, role: true },
  { name: "Jungle path", lessons: 5, role: true },
  { name: "Mid path", lessons: 5, role: true },
  { name: "ADC path", lessons: 5, role: true },
  { name: "Support path", lessons: 5, role: true },
];

const LOOP: ReadonlyArray<{ n: string; title: string; detail: string }> = [
  {
    n: "01",
    title: "Learn",
    detail: "A lesson with no jargon and nothing you need to be good at yet.",
  },
  {
    n: "02",
    title: "Drill",
    detail: "Decisions, map reads, build orders and wave sims — get it right to pass.",
  },
  {
    n: "03",
    title: "Prove",
    detail: "A field assignment graded against your own ranked baseline, not a fixed target.",
  },
];

export function AcademyBand(): React.ReactElement {
  return (
    <section id="academy" className="px-5 pt-16 md:px-8 md:pt-[72px]">
      <div className="mx-auto max-w-[1240px]">
        <SectionHead
          title="Academy · 61 lessons"
          aside={
            <Link href="/academy" className="text-accent">
              Start with Foundations &rarr;
            </Link>
          }
        />

        <div className="notch relative overflow-hidden border border-border bg-surface">
          <Image
            src={championSplashUrl("Ryze")}
            alt=""
            aria-hidden
            fill
            sizes="100vw"
            className="object-cover object-[54%_18%] opacity-[0.22] grayscale-[0.4]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--ink-1000)_24%,rgba(6,10,9,.74)_70%,rgba(6,10,9,.44)_100%)]" />
          <div className="bg-scanline absolute inset-0" />

          <div className="relative grid gap-9 p-6 md:p-8 lg:grid-cols-[1fr_1fr] lg:gap-11">
            <div>
              <HudReveal>
                <h3 className="max-w-[19ch] font-display text-[28px] font-black uppercase leading-[0.98] text-text md:text-[34px]">
                  The part a tier list cannot teach you
                </h3>
                <p className="mt-3.5 max-w-[50ch] text-[15px] leading-relaxed text-text-body">
                  Six core tracks on the skills every role shares, and a five-lesson path for the
                  parts that are only true in yours. Reading it is not the point — the Academy only
                  counts a lesson learned once it can see the habit in your ranked games.
                </p>
              </HudReveal>

              <HudStagger className="mt-7 grid gap-px border border-border bg-line-1" delay={0.1}>
                {LOOP.map((s) => (
                  <HudStaggerItem key={s.n}>
                    <div className="flex items-baseline gap-3 bg-background px-4 py-3.5">
                      <span className="font-mono text-xs text-accent">{s.n}</span>
                      <div>
                        <p className="font-display text-sm font-bold uppercase tracking-[0.05em] text-text">
                          {s.title}
                        </p>
                        <p className="mt-1 text-[13px] leading-relaxed text-text-muted">
                          {s.detail}
                        </p>
                      </div>
                    </div>
                  </HudStaggerItem>
                ))}
              </HudStagger>

              <p className="mt-4 font-mono text-[10.5px] uppercase tracking-label text-text-faint">
                Mastery is re-checked every 21 days · it can decay
              </p>
            </div>

            <div>
              <p className="hud-label mb-3">{"// The curriculum"}</p>
              <HudStagger className="grid gap-1.5">
                {TRACKS.map((t) => (
                  <HudStaggerItem key={t.name}>
                    <Link
                      href="/academy"
                      className="group grid grid-cols-[1fr_auto] items-center gap-3 border border-border bg-surface-dark px-3.5 py-2.5 transition-colors duration-[160ms] ease-out hover:border-accent motion-reduce:transition-none"
                    >
                      <span className="flex items-center gap-2.5">
                        {/* Role paths are supplements to the core six, so they are
                            marked rather than mixed in silently. */}
                        <span
                          aria-hidden
                          className={`h-1.5 w-1.5 ${t.role ? "bg-line-3" : "bg-accent"}`}
                        />
                        <span className="text-[13.5px] text-text">{t.name}</span>
                      </span>
                      <span className="font-mono text-[11px] text-text-muted transition-colors group-hover:text-accent motion-reduce:transition-none">
                        {t.lessons}
                      </span>
                    </Link>
                  </HudStaggerItem>
                ))}
              </HudStagger>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
