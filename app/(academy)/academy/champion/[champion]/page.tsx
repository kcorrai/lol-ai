import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ROLE_LABEL,
  getAssignmentForLesson,
  getChampionLesson,
  championLessonId,
  isGated,
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
  params: { champion: string };
}

// Built per player from their own champions, so it is never the same page twice and never
// worth indexing (ADR-030).
export const metadata: Metadata = {
  title: "Champion Mastery",
  robots: { index: false, follow: false },
};

export default async function ChampionLessonPage({
  params,
}: PageProps): Promise<React.ReactElement> {
  const session = await getSession();
  const userId = session?.user?.id;
  // A lesson only exists for a champion this player has been playing, which is what keeps a
  // generation off a URL a stranger can type.
  if (!userId) notFound();

  const view = await getChampionLesson(userId, params.champion);
  if (!view) notFound();

  const { lesson, champion, role, games, winRate } = view;
  const subscription = await getCurrentSubscription(userId);
  const hasPro = subscription !== null && subscription.plan !== "free";
  const gated = isGated(lesson, hasPro);
  const id = championLessonId(champion, role);

  const [stored, assignment] = await Promise.all([
    gated ? Promise.resolve(null) : getAssignmentForLesson(userId, id),
    gated ? Promise.resolve(null) : previewAssignmentTarget(userId, id),
  ]);

  return (
    <article className="mx-auto max-w-[760px] px-5 py-10 md:px-8 md:py-14">
      <Breadcrumb
        items={[
          { name: "Academy", href: "/academy" },
          { name: "Champion Mastery", href: "/academy/champion" },
          { name: champion, href: `/academy/champion/${params.champion}` },
        ]}
      />

      <header className="mt-4">
        <p className="hud-label text-accent">
          {ROLE_LABEL[role]} · {games} ranked games · {Math.round(winRate)}% win rate
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
          next={null}
          isAuthenticated
          liveAssignment={stored !== null}
        />
      </div>

      {stored && (
        <AssignmentStatus assignment={stored} instruction={lesson.assignment.instruction} />
      )}

      {gated && <ProGate lessonTitle={lesson.title} />}

      <nav className="mt-10 border-t border-line-1 pt-5">
        <Link
          href="/academy/champion"
          className="font-mono text-[11px] uppercase tracking-label text-text-muted hover:text-accent"
        >
          ← Your champions
        </Link>
      </nav>
    </article>
  );
}
