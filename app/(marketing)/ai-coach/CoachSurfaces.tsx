import Link from "next/link";
import { MessagesSquare, MonitorDown, Star, TrendingUp } from "lucide-react";
import { SectionHead } from "../components/laneiq/SectionHead";
import { EdgeSweep, HudStagger, HudStaggerItem } from "../components/laneiq/motion";

/**
 * The report is not the only place the coaching shows up.
 *
 * Every screen named here is a shipped one — `navConfig.ts`'s Coaching section plus the
 * champion pool and the desktop companion — and none of them is linked directly. They are all
 * behind the login wall, and sending a visitor from a marketing page into a redirect is the
 * defect this page was written to fix; the one call to action goes to `/register`, which is
 * where the answer to "can I have this" actually is.
 */

interface Surface {
  icon: React.ElementType;
  title: string;
  body: string;
}

const SURFACES: readonly Surface[] = [
  {
    icon: MessagesSquare,
    title: "Coach Chat",
    body: 'Ask it about a game instead of reading a report about one. It answers with your account in front of it, so "why did I lose that lane" is a question it can actually check.',
  },
  {
    icon: TrendingUp,
    title: "Improvement",
    body: "The habit turned into a plan with a window on it, and the LP you moved inside that window put next to it. It is how you find out whether the last report was worth anything.",
  },
  {
    icon: Star,
    title: "OTP Assistant",
    body: "For the one champion you play. What that pick asks for in your role, and where your games on it come apart.",
  },
  {
    icon: MonitorDown,
    title: "The desktop companion",
    body: "The same reading over the running game, from a window on your own machine. Your report also starts building the second you leave the match instead of the next time you open a browser tab.",
  },
];

export function CoachSurfaces(): React.ReactElement {
  return (
    <section className="px-5 pt-16 md:px-8 md:pt-[72px]">
      <div className="mx-auto max-w-[1240px]">
        <SectionHead title="Where else it shows up" aside="All shipped" />

        <div className="notch-lg relative overflow-hidden border border-border bg-surface p-6 md:p-8">
          <EdgeSweep />

          <HudStagger className="grid gap-3.5 sm:grid-cols-2">
            {SURFACES.map((surface) => (
              <HudStaggerItem key={surface.title}>
                <div className="notch h-full border border-border bg-background p-5">
                  <surface.icon
                    aria-hidden
                    className="h-[18px] w-[18px] text-accent"
                    strokeWidth={1.75}
                  />
                  <p className="mt-3 font-display text-[14px] font-bold uppercase tracking-[0.05em] text-text">
                    {surface.title}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-text-muted">
                    {surface.body}
                  </p>
                </div>
              </HudStaggerItem>
            ))}
          </HudStagger>

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="/register"
              className="tag-cut inline-flex h-10 items-center bg-accent px-6 font-display text-[12px] font-bold uppercase tracking-[0.1em] text-background transition-colors hover:bg-acid-400 active:bg-acid-600"
            >
              Start free
            </Link>
            <Link
              href="/download"
              className="font-mono text-[11px] uppercase tracking-label text-accent"
            >
              The desktop companion &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
