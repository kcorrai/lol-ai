import Image from "next/image";
import Link from "next/link";
import { championSplashUrl } from "@/lib/ddragon";
import { AnalyzeForm } from "./AnalyzeForm";
import { HeroDemo } from "./HeroDemo";
import { HeroIntro, HeroSweep } from "./HeroMotion";

// Base Thresh (skin 0). Champion splashes are 1215×717 and painted for exactly this
// job. This one lands on the palette by itself — spectral teal-green with the
// lantern glow — and its left third is chain and mist, which is where the headline
// sits. Swap the pair below to change the hero; the number is `skins[].num` from
// Data Dragon's champion JSON.
const HERO_CHAMPION = "Thresh";
const HERO_SKIN = 0;

export function LandingHero(): React.ReactElement {
  return (
    <section className="relative flex min-h-[560px] items-end border-b border-border md:min-h-[640px]">
      {/* The clip lives on the decoration layer, not on the section: the splash is
          full-bleed and the sweep travels past the bottom edge, but `overflow-hidden`
          on the section itself also cut off the search box's suggestions panel. */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Full-bleed, which is what the system asks of a marketing hero and what a
          splash is painted for. The crop favours Ivern's face and the lime glow to
          his right; the ink wash below keeps the headline legible over it. */}
        <Image
          src={championSplashUrl(HERO_CHAMPION, HERO_SKIN)}
          alt=""
          aria-hidden
          fill
          priority
          sizes="100vw"
          className="object-cover object-[58%_22%] opacity-[0.78] brightness-110 saturate-100"
        />

        {/* Ink wash for text protection — the system forbids a capsule behind
          headline text (ADR-015). */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--ink-1000)_6%,rgba(6,10,9,.72)_46%,rgba(6,10,9,.18)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,var(--bg-page)_2%,rgba(6,10,9,0)_46%)]" />
        <div className="bg-scanline absolute inset-0 opacity-70" />

        {/* One pass of a scan line on arrival — the page's first statement that this
          is an instrument reading something, not a poster. */}
        <HeroSweep />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1240px] items-end justify-between gap-10 px-5 pb-11 pt-24 md:px-8">
        <div className="min-w-0 flex-1">
          {/* One accent word, not a gradient: the system rations lime to the single
            thing that matters on a screen, and here that is the promise itself. */}
          <HeroIntro step={0}>
            <h1 className="max-w-[14ch] font-display text-[38px] font-black uppercase leading-[0.94] text-text md:text-[64px]">
              Your next rank is a <span className="text-accent">habit</span> away
            </h1>
          </HeroIntro>
          <HeroIntro step={1}>
            {/* Ten, not twenty: the public preview slices ten matches
              (src/domains/riot/services/previewService.ts:18). */}
            <p className="mb-6 mt-4 max-w-[44ch] text-base text-text-body md:text-[17px]">
              Paste your Riot ID. We read your last 10 games and name the one to fix.
            </p>
          </HeroIntro>
          <HeroIntro step={2}>
            <AnalyzeForm />
          </HeroIntro>
          {/* Text, not a second button: the hero rations its one filled control to the form.
            It is here at all because the other half of what this site sells is a person,
            and a visitor who wants that should not have to scroll to learn it exists. */}
          <HeroIntro step={3}>
            <p className="mt-3.5 text-[13px] text-text-muted">
              Or{" "}
              <Link href="/coaches" className="text-accent underline-offset-4 hover:underline">
                book a human coach
              </Link>{" "}
              whose rank we read from their own Riot account.
            </p>
          </HeroIntro>
        </div>

        {/* Last in the entrance queue, so the headline and the form land first. */}
        <HeroIntro step={4}>
          <HeroDemo />
        </HeroIntro>
      </div>
    </section>
  );
}
