import type { Metadata } from "next";
import Link from "next/link";
import {
  championLessonId,
  getLessonStatuses,
  listChampionOptions,
  type LessonStatus,
} from "@/domains/academy";
import { AcademyHeader } from "@/domains/academy/components/AcademyHeader";
import { ChampionMasteryCard } from "@/domains/academy/components/ChampionMasteryCard";
import { getSession } from "@/lib/auth/session";

// Generated per player from their own ranked champions, so there is nothing here for a crawler
// and nothing stable to index (ADR-030).
export const metadata: Metadata = {
  title: "Champion Mastery",
  robots: { index: false, follow: false },
};

export default async function ChampionMasteryPage(): Promise<React.ReactElement> {
  const session = await getSession();
  const userId = session?.user?.id ?? null;

  const [options, statuses] = await Promise.all([
    listChampionOptions(userId),
    userId ? getLessonStatuses(userId) : Promise.resolve(new Map<string, LessonStatus>()),
  ]);

  return (
    <div className="pb-12">
      <AcademyHeader
        // The player's best champion fronts their own page; nobody's mastery list starts
        // with a champion they do not play.
        champion={options[0]?.champion ?? "Ahri"}
        eyebrow={
          <>
            <p className="hud-label text-text-faint">
              <Link href="/academy" className="text-text-muted transition-colors hover:text-accent">
                Academy
              </Link>{" "}
              / Champion Mastery
            </p>
            <p className="mt-3.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-accent">
              {"// Your champions"}
            </p>
          </>
        }
        title={
          <>
            The twenty games a week
            <br />
            you spend on one champion
          </>
        }
        lede="The curriculum teaches the game. This teaches the champion you actually play — which lanes go your way, which do not, and the plan for each of them. Written fresh from a current analysis rather than from a page somebody wrote three patches ago."
      />

      <div className="mx-auto max-w-[1240px] px-5 pt-6 md:px-8">
        {options.length === 0 ? (
          <p className="notch border border-border bg-surface p-5 text-[13.5px] leading-relaxed text-text-body">
            {userId
              ? "Nothing here yet. Champion lessons are built from your own ranked games, so this fills in once you have at least three on a champion."
              : "Sign in and link a Riot account — champion lessons are built from the champions you actually queue."}
          </p>
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {options.map((option, i) => (
              <ChampionMasteryCard
                key={option.slug}
                option={option}
                status={statuses.get(championLessonId(option.champion, option.role))}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
