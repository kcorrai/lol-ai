import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  coreTracks,
  getActiveAssignments,
  getLessonStatuses,
  getTrack,
  isRolePath,
  lessonId,
  roleTracks,
  trackIds,
  trackMinutes,
  type AssignmentView,
  type LessonStatus,
} from "@/domains/academy";
import { AcademyHeader } from "@/domains/academy/components/AcademyHeader";
import { ProgressRing } from "@/domains/academy/components/ProgressRing";
import { TrackLessonRow } from "@/domains/academy/components/TrackLessonRow";
import { getSession } from "@/lib/auth/session";

interface PageProps {
  params: { track: string };
}

export function generateStaticParams(): { track: string }[] {
  return trackIds().map((track) => ({ track }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const track = getTrack(params.track);
  if (!track) return { title: "Track not found" };

  return {
    title: `${track.title} — ${track.tagline}`,
    description: track.description,
    alternates: { canonical: `/academy/${track.id}` },
  };
}

const DONE: readonly LessonStatus[] = ["completed", "mastered"];

export default async function TrackPage({ params }: PageProps): Promise<React.ReactElement> {
  const track = getTrack(params.track);
  if (!track) notFound();

  const session = await getSession();
  const userId = session?.user?.id;
  const [statuses, assignments] = await Promise.all([
    userId ? getLessonStatuses(userId) : Promise.resolve(new Map<string, LessonStatus>()),
    userId ? getActiveAssignments(userId) : Promise.resolve([] as AssignmentView[]),
  ]);

  const byLesson = new Map(assignments.map((a) => [a.lessonId, a]));
  const done = track.lessons.filter((l) =>
    DONE.includes(statuses.get(lessonId(l)) ?? "available")
  ).length;

  return (
    <div className="pb-12">
      <AcademyHeader
        champion={track.art}
        eyebrow={
          <>
            <p className="hud-label text-text-faint">
              <Link href="/academy" className="text-text-muted transition-colors hover:text-accent">
                Academy
              </Link>{" "}
              / {track.title}
            </p>
            <p className="mt-3.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-accent">
              {track.tagline}
            </p>
          </>
        }
        title={track.title}
        lede={track.description}
        aside={
          <>
            <ProgressRing value={done / track.lessons.length} label="done" size={150}>
              {done}
              <span className="text-[17px] text-text-faint">/{track.lessons.length}</span>
            </ProgressRing>
            <p className="hud-label mt-3.5 text-text-faint">
              {track.lessons.length} lessons · {trackMinutes(track)} min
            </p>
          </>
        }
      />

      <div className="mx-auto max-w-[1240px] px-5 pt-6 md:px-8">
        <div className="notch overflow-hidden border border-border bg-surface">
          {track.lessons.map((lesson, i) => (
            <TrackLessonRow
              key={lesson.slug}
              lesson={lesson}
              trackId={track.id}
              status={statuses.get(lessonId(lesson)) ?? "available"}
              index={i}
              assignment={byLesson.get(lessonId(lesson))}
            />
          ))}
        </div>

        {/* Siblings, not every track: a role path's neighbours are the other four roles, and
            the core curriculum's are each other. Eleven links here would read as a site map. */}
        <nav className="mt-5 flex flex-wrap items-center gap-x-[18px] gap-y-3">
          {(isRolePath(track) ? roleTracks() : coreTracks())
            .filter((t) => t.id !== track.id)
            .map((other) => (
              <Link
                key={other.id}
                href={`/academy/${other.id}`}
                className="hud-label text-accent transition-colors hover:text-acid-400"
              >
                {other.title} →
              </Link>
            ))}
        </nav>
      </div>
    </div>
  );
}
