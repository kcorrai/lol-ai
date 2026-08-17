import type { Metadata } from "next";
import { TRACKS, getAcademyOverview, trackCompletion } from "@/domains/academy";
import { NextUpPanel } from "@/domains/academy/components/NextUpPanel";
import { TrackCard } from "@/domains/academy/components/TrackCard";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "LoL Academy — Learn League of Legends Properly",
  description:
    "A structured League of Legends course: wave management, trading, vision, objectives and tempo. Free lessons, interactive drills, and a curriculum that reads your own ranked games to pick what to teach you next.",
  alternates: { canonical: "/academy" },
};

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "We read your games",
    text: "The Academy looks at your last 20 ranked games and finds the habit that is actually costing you the most — not the one that feels worst.",
  },
  {
    step: "02",
    title: "You learn the fix",
    text: "A short lesson on the concept, then interactive drills where you make the call yourself and find out why the other answers lose.",
  },
  {
    step: "03",
    title: "You prove it in game",
    text: "Every lesson ends with a field assignment measured against your own baseline. You do not finish a lesson by reading it — you finish it by doing it.",
  },
];

export default async function AcademyHubPage(): Promise<React.ReactElement> {
  const session = await getSession();
  const overview = await getAcademyOverview(session?.user?.id ?? null);

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-10 md:px-8 md:py-14">
      <header className="max-w-2xl">
        <p className="hud-label text-accent">The LoL curriculum</p>
        <h1 className="mt-2.5 font-display text-3xl font-black uppercase leading-[1.05] tracking-[0.01em] text-text md:text-[42px]">
          Learn the game,
          <br />
          not the patch notes
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-text-body">
          Every other course teaches concepts to nobody in particular. This one reads your
          ranked games first, teaches the thing that is actually losing you games, and then
          checks whether you did it.
        </p>
      </header>

      <div className="mt-9">
        <NextUpPanel
          recommendation={overview.recommendation}
          placement={overview.placement}
          personalised={overview.personalised}
        />
      </div>

      <section className="mt-12">
        <div className="flex items-center gap-3.5">
          <span className="hud-label">{"// Tracks"}</span>
          <span className="h-px flex-1 bg-line-1" />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {TRACKS.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              statuses={overview.statuses}
              completion={trackCompletion(track, overview.statuses)}
            />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-center gap-3.5">
          <span className="hud-label">{"// How it works"}</span>
          <span className="h-px flex-1 bg-line-1" />
        </div>

        <div className="mt-5 grid gap-px bg-line-1 md:grid-cols-3">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} className="bg-surface p-5">
              <span className="font-mono text-[11px] text-accent">{item.step}</span>
              <h3 className="mt-2 font-display text-base font-bold uppercase tracking-[0.02em] text-text">
                {item.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-text-body">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
