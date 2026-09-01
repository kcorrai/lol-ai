import Link from "next/link";
import { AnalyzeForm } from "../components/laneiq/AnalyzeForm";
import { HeroIntro, HeroSweep } from "../components/laneiq/HeroMotion";

/**
 * The top of the page a visitor reaches by clicking "AI coach" — which, until now, was a
 * login form.
 *
 * It leads with the form rather than the argument, and the form is the real one: `AnalyzeForm`
 * posts to `/api/public/preview`, which takes no session (`app/api/public/preview/route.ts`).
 * So the first thing this page does for somebody deciding whether to sign up is read their
 * actual account, which is a stronger claim than any sentence underneath it.
 *
 * The three lines under the form are what the preview genuinely returns — ten matches, the
 * top three champions, one rule-based reading. Naming the paid pipeline's output here would
 * be selling the preview as something it is not; that argument belongs further down the page,
 * where `SampleReport` shows the real thing and says it is an example.
 */
export function CoachHero(): React.ReactElement {
  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* The instrument grid and one scan pass, the same opening the landing page uses. No
          splash art: the form is the subject here and a champion behind it competes with it. */}
      <div aria-hidden className="bg-scanline absolute inset-0 opacity-70" />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ backgroundImage: "var(--bg-hero-fade)" }}
      />
      <HeroSweep />

      <div className="relative mx-auto w-full max-w-[1240px] px-5 pb-14 pt-16 md:px-8 md:pb-[72px] md:pt-20">
        <HeroIntro step={0}>
          <span className="hud-label">{"// The AI coach"}</span>
          <h1 className="mt-3 max-w-[16ch] font-display text-[38px] font-black uppercase leading-[0.96] text-text md:text-[58px]">
            It reads your games and names <span className="text-accent">one</span> habit
          </h1>
        </HeroIntro>

        <HeroIntro step={1}>
          <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-text-body md:text-[17px]">
            Not a tier list and not a build page. It opens your own matches, grades them against the
            rank you are in, and comes back with the thing you keep doing — with the timings and the
            numbers it read that from.
          </p>
        </HeroIntro>

        <HeroIntro step={2}>
          <div className="mt-7 max-w-[720px]">
            <AnalyzeForm />
          </div>
        </HeroIntro>

        <HeroIntro step={3}>
          <p className="mt-5 text-[13px] leading-relaxed text-text-muted">
            No account, no card: the free read takes your last 10 games, your three most-played
            champions and one verdict.{" "}
            <Link href="#report" className="text-accent hover:underline">
              The full report
            </Link>{" "}
            is what an account adds.
          </p>
        </HeroIntro>
      </div>
    </section>
  );
}
