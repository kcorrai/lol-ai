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
import { LessonIntro } from "@/domains/academy/components/LessonIntro";
import { ChampionLessonRail } from "@/domains/academy/components/ChampionLessonRail";
import { ProGate } from "@/domains/academy/components/ProGate";
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
    <div className="mx-auto max-w-[1240px] px-5 py-7 md:px-8">
      <p className="hud-label text-text-faint">
        <Link href="/academy" className="text-text-muted transition-colors hover:text-accent">
          Academy
        </Link>{" "}
        /{" "}
        <Link
          href="/academy/champion"
          className="text-text-muted transition-colors hover:text-accent"
        >
          Champion Mastery
        </Link>{" "}
        / {champion}
      </p>

      <div className="mt-4 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article className="min-w-0">
          <LessonIntro
            eyebrow={`${ROLE_LABEL[role]} · ${games} ranked games · ${Math.round(winRate)}% win rate`}
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
              next={null}
              isAuthenticated
              liveAssignment={stored !== null}
            />
          </div>

          {stored && (
            <AssignmentStatus assignment={stored} instruction={lesson.assignment.instruction} />
          )}

          {gated && <ProGate lessonTitle={lesson.title} />}

          <nav className="mt-6 border-t border-line-1 pt-5">
            <Link
              href="/academy/champion"
              className="hud-label text-accent transition-colors hover:text-acid-400"
            >
              ← Your champions
            </Link>
          </nav>
        </article>

        <ChampionLessonRail
          champion={champion}
          role={role}
          games={games}
          winRate={winRate}
          target={assignment}
        />
      </div>
    </div>
  );
}
