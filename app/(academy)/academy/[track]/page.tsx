import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Lock, RotateCcw, Star } from "lucide-react";
import {
  coreTracks,
  getLessonStatuses,
  getTrack,
  isRolePath,
  lessonId,
  roleTracks,
  trackIds,
  trackMinutes,
  type LessonStatus,
} from "@/domains/academy";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
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
  const statuses = session?.user?.id ? await getLessonStatuses(session.user.id) : new Map();

  return (
    <div className="mx-auto max-w-[900px] px-5 py-10 md:px-8 md:py-14">
      <Breadcrumb
        items={[
          { name: "Academy", href: "/academy" },
          { name: track.title, href: `/academy/${track.id}` },
        ]}
      />

      <header className="mt-4">
        <p className="hud-label text-accent">{track.tagline}</p>
        <h1 className="mt-2 font-display text-3xl font-black uppercase tracking-[0.01em] text-text md:text-4xl">
          {track.title}
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-text-body">
          {track.description}
        </p>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-label text-text-muted">
          {track.lessons.length} lessons · {trackMinutes(track)} min
        </p>
      </header>

      <ol className="mt-8 flex flex-col gap-px bg-line-1">
        {track.lessons.map((lesson, i) => {
          const status = statuses.get(lessonId(lesson)) ?? "available";
          const done = DONE.includes(status);
          // Mastered is a different claim from completed: you read it versus you did it in game.
          const mastered = status === "mastered";
          // And `review` is a mastery the nightly check took back (ADR-027) — a lesson to redo,
          // so it reads as unfinished here rather than as a lesser kind of done.
          const review = status === "review";

          return (
            <li key={lesson.slug}>
              <Link
                href={`/academy/${track.id}/${lesson.slug}`}
                className="group flex items-start gap-4 bg-surface p-4 transition-colors hover:bg-surface-2 md:p-5"
              >
                <span
                  className={`notch-sm mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center font-mono text-[12px] font-bold ${
                    mastered
                      ? "bg-accent text-background glow-accent-soft"
                      : review
                        ? "border border-warning text-warning"
                        : done
                          ? "bg-accent text-background"
                          : "border border-line-2 text-text-muted"
                  }`}
                >
                  {mastered ? (
                    <Star className="h-4 w-4 fill-current" strokeWidth={2} />
                  ) : review ? (
                    <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
                  ) : done ? (
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    i + 1
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-[15px] font-bold uppercase tracking-[0.02em] text-text transition-colors group-hover:text-accent">
                      {lesson.title}
                    </span>
                    {lesson.access === "pro" && (
                      <span className="tag-cut flex items-center gap-1 bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-label text-text-faint">
                        <Lock className="h-2.5 w-2.5" strokeWidth={2.5} />
                        Pro
                      </span>
                    )}
                    {mastered && (
                      <span className="font-mono text-[10px] uppercase tracking-label text-accent">
                        Mastered
                      </span>
                    )}
                    {status === "in_progress" && (
                      <span className="font-mono text-[10px] uppercase tracking-label text-warning">
                        In progress
                      </span>
                    )}
                    {/* Says the measurement moved, never that the player failed. */}
                    {review && (
                      <span className="font-mono text-[10px] uppercase tracking-label text-warning">
                        Numbers slipped — redo
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-[13.5px] leading-relaxed text-text-body">
                    {lesson.summary}
                  </span>
                </span>

                <span className="shrink-0 font-mono text-[11px] text-text-muted">
                  {lesson.minutes} min
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      {/* Siblings, not every track: a role path's neighbours are the other four roles, and
          the core curriculum's are each other. Eleven links here would read as a site map. */}
      <nav className="mt-10 flex flex-wrap gap-4 border-t border-line-1 pt-5">
        {(isRolePath(track) ? roleTracks() : coreTracks())
          .filter((t) => t.id !== track.id)
          .map((other) => (
            <Link
              key={other.id}
              href={`/academy/${other.id}`}
              className="font-mono text-[11px] uppercase tracking-label text-text-muted hover:text-accent"
            >
              {other.title} →
            </Link>
          ))}
      </nav>
    </div>
  );
}
