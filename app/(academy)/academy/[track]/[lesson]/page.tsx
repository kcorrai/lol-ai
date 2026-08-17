import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  allLessons,
  buildAssignmentTarget,
  getLesson,
  isGated,
  lessonNeighbours,
  visibleBlocks,
  visibleDrills,
  type AssignmentTarget,
} from "@/domains/academy";
import { LessonBody } from "@/domains/academy/components/LessonBody";
import { ProGate } from "@/domains/academy/components/ProGate";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { getSession } from "@/lib/auth/session";
import { getCurrentSubscription } from "@/lib/subscription/subscriptionService";
import { getPlayerPerformanceProfile } from "@/domains/analysis";
import { listAccounts } from "@/domains/riot";

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

/** The player's own baseline for this lesson's assignment, when we have games to read. */
async function assignmentFor(
  userId: string | undefined,
  lesson: NonNullable<ReturnType<typeof getLesson>>
): Promise<AssignmentTarget | null> {
  if (!userId) return null;

  const accounts = await listAccounts(userId).catch(() => []);
  const account = accounts.find((a) => a.isPrimary) ?? accounts[0];
  if (!account) return null;

  // A linked account with nothing synced yet throws; that is a normal day-one state.
  const profile = await getPlayerPerformanceProfile(account.id, 20).catch(() => null);
  return profile ? buildAssignmentTarget(lesson, profile) : null;
}

export default async function LessonPage({ params }: PageProps): Promise<React.ReactElement> {
  const lesson = getLesson(params.track, params.lesson);
  if (!lesson) notFound();

  const session = await getSession();
  const userId = session?.user?.id;
  const subscription = userId ? await getCurrentSubscription(userId) : null;
  const hasPro = subscription !== null && subscription.plan !== "free";

  const gated = isGated(lesson, hasPro);
  const [assignment, { previous, next, index, total }] = await Promise.all([
    gated ? Promise.resolve(null) : assignmentFor(userId, lesson),
    Promise.resolve(lessonNeighbours(lesson)),
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
          lessonId={`${lesson.trackId}/${lesson.slug}`}
          blocks={visibleBlocks(lesson, hasPro)}
          drills={visibleDrills(lesson, hasPro)}
          assignment={assignment}
          next={next ? { href: `/academy/${next.trackId}/${next.slug}`, title: next.title } : null}
          isAuthenticated={Boolean(userId)}
        />
      </div>

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
