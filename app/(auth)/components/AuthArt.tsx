import Image from "next/image";
import { championSplashUrl } from "@/lib/ddragon";
import { StatBlock } from "@/components/dashboard/laneiq/HudPanel";
// The one wordmark, borrowed rather than copied — it lives with the marketing
// header and footer that were the first to use it.
import { Wordmark } from "../../(marketing)/components/laneiq/Wordmark";

// Base Viego (skin 0). The splash is desaturated and pushed under the protect
// gradient, so it reads as ground rather than as a picture competing with the
// form beside it (ADR-015). Swap the pair to change the panel.
const ART_CHAMPION = "Viego";
const ART_SKIN = 0;

/** The brand half of the auth split. Static — nothing here reacts to the form. */
export function AuthArt(): React.ReactElement {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border lg:flex">
      <Image
        src={championSplashUrl(ART_CHAMPION, ART_SKIN)}
        alt=""
        aria-hidden
        fill
        priority
        sizes="52vw"
        className="object-cover object-[58%_24%] opacity-[0.42] contrast-[1.1] grayscale-[0.35]"
      />
      <div className="bg-protect-bottom absolute inset-0" />
      <div className="bg-scanline absolute inset-0" />
      <div className="bg-hero-fade absolute inset-0" />

      <div className="relative flex items-center gap-3.5 px-10 pt-9">
        <Wordmark size={19} />
        <span className="h-4 w-px bg-line-2" />
        <span className="font-mono text-[10.5px] uppercase tracking-label text-text-muted">
          Performance review for ranked
        </span>
      </div>

      <div className="relative max-w-[620px] px-10 pb-10">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 animate-glow-pulse bg-accent" />
          <span className="font-mono text-[10.5px] uppercase tracking-label text-accent">
            {"// 8.1M ranked games read this patch"}
          </span>
        </div>

        {/* Not an h1: the form beside it owns the page heading, and this line is the
            same on all four auth routes. */}
        <p className="max-w-[15ch] font-display text-[46px] font-black uppercase leading-[0.98] text-text">
          Your next rank is a <span className="text-accent">habit</span> away
        </p>
        <p className="mt-4 max-w-[52ch] text-[15px] text-text-body">
          We read every game you play — wave state, back timings, vision before fights — and tell
          you the one thing to fix next. Not a stat page. A verdict.
        </p>

        <div className="mt-7 flex gap-9 border-t border-border pt-5">
          <StatBlock label="First report" value="90" unit="s" />
          <StatBlock label="Games parsed" value="20" unit="per pull" />
          <StatBlock label="Patch" value="15.14" />
        </div>

        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.12em] text-text-faint">
          Not endorsed by Riot Games · League of Legends © Riot Games, Inc.
        </p>
      </div>
    </div>
  );
}
