"use client";

import Link from "next/link";
import { Download, MonitorDown } from "lucide-react";
import { getDesktopRelease, pickDownload } from "@/lib/desktop/release";
import { useEffect, useState } from "react";
import { SectionHead } from "./SectionHead";
import { EdgeSweep, HudStagger, HudStaggerItem } from "./motion";

/**
 * The desktop companion, which this page had never once mentioned.
 *
 * Twenty-odd commits of it shipped — pairing, the overlay, the live panels, the tray, the
 * post-game handoff — while the word "desktop" appeared on the marketing site only inside
 * two CSS comments. It is also the product's only unarguable claim: Riot's Live Client API
 * listens on 127.0.0.1 and no competitor's website reaches it either.
 *
 * It sits straight after `ProductShowcase` because that section's argument is "here are the
 * real screens", and this is the screen a browser cannot show you.
 *
 * The call to action degrades rather than lies. With no published build the button is a link
 * to `/download`, which explains why — the landing page never offers a download that 404s.
 */

const POINTS: readonly { title: string; detail: string }[] = [
  {
    title: "The lane you are actually in",
    detail:
      "Read off your own screen while the game runs: the matchup on this patch, and your own record in it with the sample size attached.",
  },
  {
    title: "A plan, before you need it",
    detail:
      "How the matchup is played and the habit you keep bringing to it. Deterministic, so it arrives instantly instead of waiting on a model.",
  },
  {
    title: "An overlay that lets go",
    detail:
      "Ctrl+Alt+L or your own combination. It never steals focus from a running game, and the screen, corner and panels are yours to set.",
  },
  {
    title: "Your report is ready when you alt-tab",
    detail:
      "Nothing on a server knows a match ended. This window does, to the second, so the pull starts the moment you leave the game.",
  },
];

const RELEASE = getDesktopRelease();

export function DesktopBand(): React.ReactElement {
  const [href, setHref] = useState<string>(RELEASE?.downloads[0]?.url ?? "/download");

  useEffect(() => {
    if (RELEASE === null) return;
    const pick = pickDownload(RELEASE, navigator.userAgent);
    if (pick) setHref(pick.url);
  }, []);

  const published = RELEASE !== null;

  return (
    <section id="desktop" className="px-5 pt-16 md:px-8 md:pt-[72px]">
      <div className="mx-auto max-w-[1240px]">
        <SectionHead title="And one that runs on your PC" aside="Windows · macOS · Linux" />

        <div className="notch-lg relative overflow-hidden border border-border bg-surface p-6 md:p-8">
          <EdgeSweep />

          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-label text-accent">
                {"// The companion"}
              </span>
              <h3 className="mt-2.5 max-w-[20ch] font-display text-[22px] font-extrabold uppercase leading-[1.14] text-text md:text-[26px]">
                It watches the game you are playing
              </h3>
              <p className="mt-3.5 max-w-[48ch] text-[15px] leading-relaxed text-text-body">
                Riot publishes your live game to one address — <code>127.0.0.1:2999</code> — and
                nothing running on a server can reach it. So we wrote something that runs where
                you do, and put the reading over the top of the match.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                {published ? (
                  <a
                    href={href}
                    className="tag-cut inline-flex h-10 items-center gap-2 bg-accent px-5 font-display text-[12px] font-bold uppercase tracking-[0.1em] text-background transition-colors hover:bg-acid-400 active:bg-acid-600"
                  >
                    <Download className="h-4 w-4" strokeWidth={2} />
                    Download the app
                  </a>
                ) : (
                  <Link
                    href="/download"
                    className="tag-cut inline-flex h-10 items-center gap-2 bg-accent px-5 font-display text-[12px] font-bold uppercase tracking-[0.1em] text-background transition-colors hover:bg-acid-400 active:bg-acid-600"
                  >
                    <MonitorDown className="h-4 w-4" strokeWidth={2} />
                    See the desktop app
                  </Link>
                )}
                <Link
                  href="/download"
                  className="font-mono text-[11px] uppercase tracking-label text-accent"
                >
                  {published ? "What it does" : "Why it is not out yet"} &rarr;
                </Link>
              </div>

              <p className="mt-4 text-[12.5px] leading-relaxed text-text-muted">
                Pairing takes two clicks and your password never enters it — the machine holds a
                token of its own, and revoking it cuts the app off mid-game.
              </p>
            </div>

            <HudStagger className="grid gap-3.5 sm:grid-cols-2">
              {POINTS.map((p) => (
                <HudStaggerItem key={p.title}>
                  <div className="notch h-full border border-border bg-background p-4">
                    <p className="font-display text-[13.5px] font-bold uppercase tracking-[0.05em] text-text">
                      {p.title}
                    </p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-text-muted">
                      {p.detail}
                    </p>
                  </div>
                </HudStaggerItem>
              ))}
            </HudStagger>
          </div>
        </div>
      </div>
    </section>
  );
}
