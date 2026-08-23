import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  allLessons,
  getAssignmentForLesson,
  getLesson,
  isGated,
  lessonId as toLessonId,
  lessonNeighbours,
  previewAssignmentTarget,
  visibleBlocks,
  visibleDrills,
} from "@/domains/academy";
import { AssignmentStatus } from "@/domains/academy/components/AssignmentStatus";
import { LessonBody } from "@/domains/academy/components/LessonBody";
import { ProGate } from "@/domains/academy/components/ProGate";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
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

  const session = await getSession();
  const userId = session?.user?.id;
  const subscription = userId ? await getCurrentSubscription(userId) : null;
  const hasPro = subscription !== null && subscription.plan !== "free";

  const gated = isGated(lesson, hasPro);
  const id = toLessonId(lesson);
  const { previous, next, index, total } = lessonNeighbours(lesson);

  // The stored assignment is the live one, judged against real matches. The computed target is
  // only the preview a player without one sees — anonymous, unsynced, or behind the pro gate.
  const [stored, assignment] = await Promise.all([
    userId && !gated ? getAssignmentForLesson(userId, id) : Promise.resolve(null),
    userId && !gated ? previewAssignmentTarget(userId, id) : Promise.resolve(null),
  ]);

  return (
    <article className="mx-auto max-w-[760px] px-5 py-10 md:px-8 md:py-14">
      <Breadcrumb
        items={[
          { name: "Academy", href: "/academy" },
          { name: params.track, href: `/academy/${lesson.trackId}` },
          { name: lesson.title, href: `/academy/${lesson.trackId}/${lesson.slug}` },
        ]}
      />

      <header className="mt-4">
        <p className="hud-label text-accent">
          Lesson {index} of {total} · {lesson.minutes} min
        </p>
        <h1 className="mt-2 font-display text-3xl font-black uppercase leading-[1.1] tracking-[0.01em] text-text md:text-4xl">
          {lesson.title}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-text-body">{lesson.summary}</p>

        <div className="notch mt-6 border border-line-1 bg-surface-2 p-5">
          <p className="hud-label">What you will be able to do</p>
          <ul className="mt-2.5 flex flex-col gap-1.5">
            {lesson.objectives.map((objective) => (
              <li key={objective} className="text-[13.5px] leading-relaxed text-text-body">
                — {objective}
              </li>
            ))}
          </ul>
        </div>
      </header>

      <div className="mt-8">
        <LessonBody
          lessonId={id}
          blocks={visibleBlocks(lesson, hasPro)}
          drills={visibleDrills(lesson, hasPro)}
          assignment={assignment}
          next={next ? { href: `/academy/${next.trackId}/${next.slug}`, title: next.title } : null}
          isAuthenticated={Boolean(userId)}
          liveAssignment={stored !== null}
        />
      </div>

      {stored && (
        <AssignmentStatus assignment={stored} instruction={lesson.assignment.instruction} />
      )}

      {gated && <ProGate lessonTitle={lesson.title} />}

      <nav className="mt-10 flex items-center justify-between gap-4 border-t border-line-1 pt-5">
        {previous ? (
          <Link
            href={`/academy/${previous.trackId}/${previous.slug}`}
            className="font-mono text-[11px] uppercase tracking-label text-text-muted hover:text-accent"
          >
            ← {previous.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={`/academy/${next.trackId}/${next.slug}`}
            className="text-right font-mono text-[11px] uppercase tracking-label text-text-muted hover:text-accent"
          >
            {next.title} →
          </Link>
        )}
      </nav>
    </article>
  );
}
