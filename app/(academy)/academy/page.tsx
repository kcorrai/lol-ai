import type { Metadata } from "next";
import { BookOpen, ScanLine, Target } from "lucide-react";
import {
  allLessons,
  coreTracks,
  getAcademyOverview,
  lessonId,
  trackCompletion,
} from "@/domains/academy";
import { ActiveAssignments } from "@/domains/academy/components/ActiveAssignments";
import { AcademyHeader } from "@/domains/academy/components/AcademyHeader";
import { NextUpPanel } from "@/domains/academy/components/NextUpPanel";
import { ProgressRing } from "@/domains/academy/components/ProgressRing";
import { RolePathsSection } from "@/domains/academy/components/RolePathsSection";
import { SectionHeading } from "@/domains/academy/components/SectionHeading";
import { TrackCard } from "@/domains/academy/components/TrackCard";
import { getSession } from "@/lib/auth/session";
import type { LessonStatus } from "@/domains/academy/types";

export const metadata: Metadata = {
  // Absolute because the section template is "%s | LoL Academy", which on the Academy's own
  // landing page read "LoL Academy — … | LoL Academy" — the section named twice and the
  // product not at all. The lessons underneath still take the section suffix.
  title: { absolute: "LoL Academy — Learn League of Legends Properly | LoL AI Coach" },
  description:
    "A structured League of Legends course: wave management, trading, vision, objectives and tempo. Free lessons, interactive drills, and a curriculum that reads your own ranked games to pick what to teach you next.",
  alternates: { canonical: "/academy" },
};

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: ScanLine,
    title: "We read your games",
    text: "The Academy looks at your last 20 ranked games and finds the habit that is actually costing you the most — not the one that feels worst.",
  },
  {
    step: "02",
    icon: BookOpen,
    title: "You learn the fix",
    text: "A short lesson on the concept, then interactive drills where you make the call yourself and find out why the other answers lose.",
  },
  {
    step: "03",
    icon: Target,
    title: "You prove it in game",
    text: "Every lesson ends with a field assignment measured against your own baseline. You do not finish a lesson by reading it — you finish it by doing it.",
  },
];

const DONE: readonly LessonStatus[] = ["completed", "mastered"];

export default async function AcademyHubPage(): Promise<React.ReactElement> {
  const session = await getSession();
  const overview = await getAcademyOverview(session?.user?.id ?? null);

  const lessons = allLessons();
  const read = lessons.filter((l) =>
    DONE.includes(overview.statuses.get(lessonId(l)) ?? "available")
  ).length;
  const mastered = lessons.filter((l) => overview.statuses.get(lessonId(l)) === "mastered").length;

  return (
    <div className="pb-12">
      <AcademyHeader
        champion="Viego"
        eyebrow={
          <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-accent">
            {"// The LoL curriculum"}
          </p>
        }
        title={
          <>
            Learn the game,
            <br />
            not the patch notes
          </>
        }
        lede="Every other course teaches concepts to nobody in particular. This one reads your ranked games first, teaches the thing that is actually losing you games, and then checks whether you did it."
        aside={
          <>
            <ProgressRing value={read / lessons.length} label="lessons read">
              {read}
              <span className="text-[19px] text-text-faint">/{lessons.length}</span>
            </ProgressRing>
            <div className="mt-4 flex gap-6">
              <div>
                <p className="hud-label text-text-faint">Mastered</p>
                <p className="mt-1 font-mono text-xl font-bold tabular-nums leading-none text-text">
                  {mastered}
                </p>
              </div>
              <div>
                <p className="hud-label text-text-faint">Academy XP</p>
                <p className="mt-1 font-mono text-xl font-bold tabular-nums leading-none text-accent">
                  {overview.xp}
                </p>
              </div>
            </div>
          </>
        }
      />

      <div className="mx-auto max-w-[1240px] px-5 pt-6 md:px-8">
        <NextUpPanel
          recommendation={overview.recommendation}
          placement={overview.placement}
          personalised={overview.personalised}
        />

        <ActiveAssignments assignments={overview.assignments} />

        <section className="mt-8">
          {/* The transcript is only offered to someone who has a record to look at. */}
          <SectionHeading
            label="Tracks"
            action={
              session?.user ? { href: "/academy/transcript", label: "Transcript" } : undefined
            }
          />
          <div className="mt-3.5 grid gap-3.5 lg:grid-cols-2">
            {coreTracks().map((track, i) => (
              <TrackCard
                key={track.id}
                track={track}
                statuses={overview.statuses}
                completion={trackCompletion(track, overview.statuses)}
                index={i}
              />
            ))}
          </div>
        </section>

        <RolePathsSection
          role={overview.role}
          statuses={overview.statuses}
          champions={overview.champions}
        />

        <section className="mt-8">
          <SectionHeading label="How it works" />
          <div className="mt-3.5 grid gap-px border border-border bg-line-1 md:grid-cols-3">
            {HOW_IT_WORKS.map((item, i) => (
              <div
                key={item.step}
                style={{ animationDelay: `${i * 60}ms` }}
                className="animate-hud-enter bg-background px-[22px] py-5"
              >
                <span className="flex items-center gap-2.5">
                  <span className="font-mono text-[12px] font-bold text-accent">{item.step}</span>
                  <item.icon className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
                </span>
                <h3 className="mt-3 font-display text-base font-extrabold uppercase tracking-[0.04em] text-text">
                  {item.title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-text-body">{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
