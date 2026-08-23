import type { Metadata } from "next";
import Link from "next/link";
import {
  ROLE_LABEL,
  championLessonId,
  getLessonStatuses,
  listChampionOptions,
  type LessonStatus,
} from "@/domains/academy";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { getSession } from "@/lib/auth/session";

// Generated per player from their own ranked champions, so there is nothing here for a crawler
// and nothing stable to index (ADR-030).
export const metadata: Metadata = {
  title: "Champion Mastery",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Partial<Record<LessonStatus, string>> = {
  in_progress: "In progress",
  completed: "Read",
  mastered: "Proved in ranked",
  review: "Numbers slipped — redo",
};

export default async function ChampionMasteryPage(): Promise<React.ReactElement> {
  const session = await getSession();
  const userId = session?.user?.id ?? null;

  const [options, statuses] = await Promise.all([
    listChampionOptions(userId),
    userId ? getLessonStatuses(userId) : Promise.resolve(new Map<string, LessonStatus>()),
  ]);

  return (
    <div className="mx-auto max-w-[900px] px-5 py-10 md:px-8 md:py-14">
      <Breadcrumb
        items={[
          { name: "Academy", href: "/academy" },
          { name: "Champion Mastery", href: "/academy/champion" },
        ]}
      />

      <header className="mt-4 max-w-2xl">
        <p className="hud-label text-accent">Your champions</p>
        <h1 className="mt-2 font-display text-3xl font-black uppercase leading-[1.05] tracking-[0.01em] text-text md:text-4xl">
          The twenty games a week
          <br />
          you spend on one champion
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-text-body">
          The curriculum teaches the game. This teaches the champion you actually play — which lanes
          go your way, which do not, and the plan for each of them. Written fresh from a current
          analysis rather than from a page somebody wrote three patches ago.
        </p>
      </header>

      {options.length === 0 ? (
        <p className="notch mt-9 border border-line-1 bg-surface-2 p-5 text-[13.5px] leading-relaxed text-text-body">
          {userId
            ? "Nothing here yet. Champion lessons are built from your own ranked games, so this fills in once you have at least three on a champion."
            : "Sign in and link a Riot account — champion lessons are built from the champions you actually queue."}
        </p>
      ) : (
        <ul className="mt-9 flex flex-col gap-px bg-line-1">
          {options.map((option) => {
            const status = statuses.get(championLessonId(option.champion, option.role));
            return (
              <li key={option.slug}>
                <Link
                  href={`/academy/champion/${option.slug}`}
                  className="group flex items-center gap-4 bg-surface p-4 transition-colors hover:bg-surface-2 md:p-5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-[15px] font-bold uppercase tracking-[0.02em] text-text transition-colors group-hover:text-accent">
                        {option.champion}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-label text-text-muted">
                        {ROLE_LABEL[option.role]}
                      </span>
                      {status && STATUS_LABEL[status] && (
                        <span className="font-mono text-[10px] uppercase tracking-label text-accent">
                          {STATUS_LABEL[status]}
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block font-mono text-[11px] text-text-muted">
                      {option.games} ranked games · {Math.round(option.winRate)}% win rate
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-text-muted">→</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
