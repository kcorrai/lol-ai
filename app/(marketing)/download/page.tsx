import type { Metadata } from "next";
import Link from "next/link";
import { DownloadPanel } from "./DownloadPanel";
import { DesktopStory } from "./DesktopStory";

export const metadata: Metadata = {
  title: { absolute: "Desktop App — LoL AI Coach Companion for Windows, macOS and Linux" },
  description:
    "The companion reads your live League game from your own machine — the matchup, the game plan and what has already happened, in an overlay you can dismiss. Pair it in two clicks; your password never enters it.",
  alternates: { canonical: "/download" },
  openGraph: {
    title: "LoL AI Coach — the desktop companion",
    description:
      "Live matchup reading and a game plan over your running game. Riot's Live Client API only listens on your own machine, so a website cannot do this.",
    type: "website",
  },
};

/**
 * The page for the half of the product a browser cannot be.
 *
 * It leads with the download control rather than the argument, because a visitor who
 * arrived from the top bar's "Desktop" already knows what they want — and when there is
 * nothing to download, saying so at the top is more honest than making them read eight
 * feature cards before they find out.
 */
export default function DownloadPage(): React.ReactElement {
  return (
    <>
      <section className="border-b border-border px-5 pt-14 md:px-8 md:pt-[72px]">
        <div className="mx-auto max-w-[1240px] pb-14 md:pb-[72px]">
          <span className="hud-label">{"// The desktop companion"}</span>
          <h1 className="mt-3 max-w-[18ch] font-display text-[34px] font-black uppercase leading-[1.06] text-text md:text-[46px]">
            The part a website cannot do
          </h1>
          <p className="mt-4 max-w-[58ch] text-[15.5px] leading-relaxed text-text-body md:text-[16.5px]">
            Your live game is readable from exactly one place: the machine it is running on. The
            companion sits there and reads it — the lane you are in, the plan for it, and what
            has already happened — then puts that over the game in an overlay you can dismiss.
          </p>

          <div className="mt-8 max-w-[640px]">
            <DownloadPanel />
          </div>

          <p className="mt-5 text-[13px] text-text-muted">
            Windows, macOS and Linux ·{" "}
            <Link href="/pricing" className="text-accent hover:underline">
              works on the free plan
            </Link>
          </p>
        </div>
      </section>

      <DesktopStory />

      <section className="px-5 py-16 md:px-8 md:py-[72px]">
        <div className="mx-auto max-w-[1240px]">
          <div className="notch border border-border bg-surface p-6 md:p-8">
            <h2 className="max-w-[24ch] font-display text-[22px] font-extrabold uppercase leading-[1.14] text-text md:text-[26px]">
              You do not need it to start
            </h2>
            <p className="mt-3 max-w-[58ch] text-[14.5px] leading-relaxed text-text-body">
              The coaching, the Academy, the draft room and every free tool run in this browser.
              The companion adds the one thing they cannot: the game while it is still happening.
            </p>
            <Link
              href="/register"
              className="tag-cut mt-6 inline-flex h-10 items-center bg-accent px-6 font-display text-[12px] font-bold uppercase tracking-[0.1em] text-background transition-colors hover:bg-acid-400"
            >
              Start free
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
