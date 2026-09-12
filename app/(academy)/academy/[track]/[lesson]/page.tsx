import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  allLessons,
  getAssignmentForLesson,
  getLesson,
  getLessonStatuses,
  getTrack,
  isGated,
  lessonId as toLessonId,
  lessonNeighbours,
  previewAssignmentTarget,
  visibleBlocks,
  visibleDrills,
  type LessonStatus,
} from "@/domains/academy";
import { AssignmentStatus } from "@/domains/academy/components/AssignmentStatus";
import { LessonBody } from "@/domains/academy/components/LessonBody";
import { LessonIntro } from "@/domains/academy/components/LessonIntro";
import { LessonRail } from "@/domains/academy/components/LessonRail";
import { ProGate } from "@/domains/academy/components/ProGate";
import { getSession } from "@/lib/auth/session";
import { getCurrentSubscription } from "@/lib/subscription/subscriptionService";

interface PageProps {
  params: { track: string; lesson: string };
}

export function generateStaticParams(): { track: string; lesson: string }[] {
  return allLessons().map((l) => ({ track: l.trackId, lesson: l.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const lesson = getLesson(params.track, params.lesson);
  if (!lesson) return { title: "Lesson not found" };

  return {
    title: lesson.title,
    description: lesson.summary,
    alternates: { canonical: `/academy/${lesson.trackId}/${lesson.slug}` },
  };
}

export default async function LessonPage({ params }: PageProps): Promise<React.ReactElement> {
  const lesson = getLesson(params.track, params.lesson);
  if (!lesson) notFound();
  const track = getTrack(lesson.trackId);

  const session = await getSession();
  const userId = session?.user?.id;
  const subscription = userId ? await getCurrentSubscription(userId) : null;
  const hasPro = subscription !== null && subscription.plan !== "free";

  const gated = isGated(lesson, hasPro);
  const id = toLessonId(lesson);
  const { previous, next, index, total } = lessonNeighbours(lesson);

  // The stored assignment is the live one, judged against real matches. The computed target is
  // only the preview a player without one sees — anonymous, unsynced, or behind the pro gate.
  const [stored, assignment, statuses] = await Promise.all([
    userId && !gated ? getAssignmentForLesson(userId, id) : Promise.resolve(null),
    userId && !gated ? previewAssignmentTarget(userId, id) : Promise.resolve(null),
    userId ? getLessonStatuses(userId) : Promise.resolve(new Map<string, LessonStatus>()),
  ]);

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-7 md:px-8">
      <p className="hud-label text-text-faint">
        <Link href="/academy" className="text-text-muted transition-colors hover:text-accent">
          Academy
        </Link>{" "}
        /{" "}
        <Link
          href={`/academy/${lesson.trackId}`}
          className="text-text-muted transition-colors hover:text-accent"
        >
          {track?.title ?? params.track}
        </Link>{" "}
        / {lesson.title}
      </p>

      <div className="mt-4 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article className="min-w-0">
          <LessonIntro
            eyebrow={`Lesson ${index} of ${total} · ${lesson.minutes} min`}
            title={lesson.title}
            summary={lesson.summary}
            objectives={lesson.objectives}
          />

          <div className="mt-[18px]">
            <LessonBody
              lessonId={id}
              blocks={visibleBlocks(lesson, hasPro)}
              drills={visibleDrills(lesson, hasPro)}
              assignment={assignment}
              next={
                next ? { href: `/academy/${next.trackId}/${next.slug}`, title: next.title } : null
              }
              isAuthenticated={Boolean(userId)}
              liveAssignment={stored !== null}
            />
          </div>

          {stored && (
            <AssignmentStatus assignment={stored} instruction={lesson.assignment.instruction} />
          )}

          {gated && <ProGate lessonTitle={lesson.title} />}

          <nav className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line-1 pt-5">
            {previous ? (
              <Link
                href={`/academy/${previous.trackId}/${previous.slug}`}
                className="hud-label text-accent transition-colors hover:text-acid-400"
              >
                ← {previous.title}
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link
                href={`/academy/${next.trackId}/${next.slug}`}
                className="hud-label text-right text-accent transition-colors hover:text-acid-400"
              >
                {next.title} →
              </Link>
            )}
          </nav>
        </article>

        {track && (
          <LessonRail
            lessons={track.lessons}
            trackId={track.id}
            trackTitle={track.title}
            current={lesson.slug}
            statuses={statuses}
            target={assignment}
          />
        )}
      </div>
    </div>
  );
}
