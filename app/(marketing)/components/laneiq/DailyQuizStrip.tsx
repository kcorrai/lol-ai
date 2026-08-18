import Image from "next/image";
import Link from "next/link";
import { championSplashUrl } from "@/lib/ddragon";
import { DailyStatus } from "./DailyStatus";
import { SectionHead } from "./SectionHead";

interface ModeTile {
  name: string;
  hint: string;
  splash: string;
}

// Marketing's own copy for the eight modes, not the quiz's internal tile list:
// the landing page says what a mode *is* to someone who has never played it,
// and it should not change shape because the game's strip did. The art is a
// fixed champion per mode, the same one the quiz uses, and never an answer.
const MODES: readonly ModeTile[] = [
  { name: "Classic", hint: "Column by column", splash: "Jarvan IV" },
  { name: "Ability", hint: "One icon", splash: "Nautilus" },
  { name: "Splash", hint: "The crop widens", splash: "Ashe" },
  { name: "Lore", hint: "Names redacted", splash: "Swain" },
  { name: "Quote", hint: "One voice line", splash: "Karthus" },
  { name: "Emoji", hint: "Five clues", splash: "Kennen" },
  { name: "Build", hint: "Read the items", splash: "Jax" },
  { name: "Impostor", hint: "Odd one out", splash: "Neeko" },
];

/**
 * The one thing on this page that is worth coming back to tomorrow. Everything
 * else here is read once; the quiz is the daily habit, so it gets a band of its
 * own rather than a seventh tile in the tools grid.
 */
export function DailyQuizStrip(): React.ReactElement {
  return (
    <section id="daily" className="px-5 pt-16 md:px-8 md:pt-[72px]">
      <div className="mx-auto max-w-[1240px]">
        <SectionHead
          title="LaneIQ Daily · new every day"
          aside={
            <Link href="/quiz" className="text-accent">
              Play today&apos;s set &rarr;
            </Link>
          }
        />

        <div className="notch relative overflow-hidden border border-border bg-surface">
          <Image
            src={championSplashUrl("Thresh")}
            alt=""
            aria-hidden
            fill
            sizes="100vw"
            className="object-cover object-[60%_20%] opacity-30 grayscale-[0.35]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--ink-1000)_22%,rgba(6,10,9,.72)_66%,rgba(6,10,9,.4)_100%)]" />
          <div className="bg-scanline absolute inset-0" />

          <div className="relative grid gap-8 p-6 md:p-8 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
            <div>
              <DailyStatus />
              <h3 className="mt-3 max-w-[18ch] font-display text-[28px] font-black uppercase leading-[0.98] text-text md:text-[36px]">
                Eight champion puzzles. One a day.
              </h3>
              <p className="mt-3.5 max-w-[52ch] text-[15px] leading-relaxed text-text-body">
                Guess the champion from an ability icon, a cropped splash, a redacted lore entry, a
                voice line, a string of emoji or the item path they build. Or find the impostor:
                eight champions, seven of whom share something. Unlimited guesses — every miss hands
                you a little more. Solve any one mode to keep your streak.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Link
                  href="/quiz"
                  className="tag-cut btn-glow inline-flex items-center gap-2 border border-accent bg-accent px-5 py-2.5 font-mono text-[12px] font-bold uppercase tracking-label text-ink-1000 transition-colors hover:bg-acid-400"
                >
                  Play today&apos;s set &rarr;
                </Link>
                <span className="font-mono text-[11px] uppercase tracking-label text-text-muted">
                  Free · no account needed
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {MODES.map((mode) => (
                <Link
                  key={mode.name}
                  href="/quiz"
                  className="notch group relative block h-[104px] overflow-hidden border border-border transition-colors duration-[160ms] ease-out hover:border-accent motion-reduce:transition-none"
                >
                  <Image
                    src={championSplashUrl(mode.splash)}
                    alt=""
                    aria-hidden
                    fill
                    sizes="200px"
                    className="object-cover object-[52%_14%] opacity-40 grayscale-[0.5] transition-[opacity,filter] duration-[260ms] ease-out group-hover:opacity-80 group-hover:grayscale-0 motion-reduce:transition-none"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(0deg,var(--ink-1000)_18%,rgba(6,10,9,.3)_74%)]" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="font-display text-[13.5px] font-extrabold uppercase tracking-[0.06em] text-text">
                      {mode.name}
                    </p>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-label text-text-muted">
                      {mode.hint}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
