import Image from "next/image";
import { championSplashUrl } from "@/lib/ddragon";
import { AnalyzeForm } from "./AnalyzeForm";
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
    <section className="relative flex min-h-[560px] items-end overflow-hidden border-b border-border md:min-h-[640px]">
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

      <div className="relative mx-auto w-full max-w-[1240px] px-5 pb-11 pt-24 md:px-8">
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
      </div>
    </section>
  );
}
