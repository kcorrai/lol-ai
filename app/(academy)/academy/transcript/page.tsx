import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, RotateCcw, Star } from "lucide-react";
import { getTranscript, type TranscriptLesson } from "@/domains/academy";
import { CertificateShare } from "@/domains/academy/components/CertificateShare";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { getSession } from "@/lib/auth/session";
import { formatDate } from "@/lib/uiLocale";

export const metadata: Metadata = {
  title: "Your transcript",
  description: "Every Academy lesson you have read, passed and proved in your own ranked games.",
  robots: { index: false },
};

function marker(status: TranscriptLesson["status"]): React.ReactElement {
  if (status === "mastered") {
    return <Star className="h-3.5 w-3.5 fill-current text-accent" strokeWidth={2} />;
  }
  if (status === "review") {
    return <RotateCcw className="h-3.5 w-3.5 text-warning" strokeWidth={2.5} />;
  }
  if (status === "completed") {
    return <Check className="h-3.5 w-3.5 text-accent" strokeWidth={2.5} />;
  }
  return <span className="h-3.5 w-3.5 rounded-full border border-line-2" />;
}

function when(lesson: TranscriptLesson): string {
  const stamp = lesson.masteredAt ?? lesson.completedAt;
  if (!stamp) return "";
  return formatDate(stamp, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function TranscriptPage(): Promise<React.ReactElement> {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login?callbackUrl=/academy/transcript");

  const transcript = await getTranscript(session.user.id);

  return (
    <div className="mx-auto max-w-[900px] px-5 py-10 md:px-8 md:py-14">
      <Breadcrumb
        items={[
          { name: "Academy", href: "/academy" },
          { name: "Transcript", href: "/academy/transcript" },
        ]}
      />

      <header className="mt-6">
        <p className="hud-label text-accent">Your record</p>
        <h1 className="mt-2.5 font-display text-3xl font-black uppercase tracking-[0.01em] text-text md:text-[38px]">
          Transcript
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-text-body">
          Completed means you passed the drills. Mastered means your own ranked games moved and
          stayed moved — it is the only line here that is not self-reported.
        </p>

        <dl className="mt-6 flex flex-wrap gap-8 border-t border-line-1 pt-5">
          {[
            ["Lessons read", `${transcript.totalCompleted}/${transcript.totalLessons}`],
            ["Mastered", `${transcript.totalMastered}`],
            ["Academy XP", `${transcript.xp}`],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="font-mono text-[11px] uppercase tracking-label text-text-muted">
                {label}
              </dt>
              <dd className="mt-1 font-display text-2xl font-bold text-text">{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="mt-10 flex flex-col gap-8">
        {transcript.tracks.map((track) => (
          <section key={track.trackId} className="notch border border-line-1 bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-1 px-5 py-3.5">
              <div className="flex items-baseline gap-3">
                <Link
                  href={`/academy/${track.trackId}`}
                  className="font-display text-[15px] font-bold uppercase tracking-[0.02em] text-text transition-colors hover:text-accent"
                >
                  {track.title}
                </Link>
                <span className="font-mono text-[11px] text-text-muted">
                  {track.completed}/{track.total} · {track.mastered} mastered
                </span>
              </div>

              {/* Only a finished track has a certificate — the API refuses the rest. */}
              {track.finished && (
                <CertificateShare trackId={track.trackId} trackTitle={track.title} />
              )}
            </div>

            <ul className="flex flex-col">
              {track.lessons.map((lesson) => (
                <li
                  key={lesson.lessonId}
                  className="flex items-center gap-3 border-b border-line-1 px-5 py-2.5 last:border-b-0"
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {marker(lesson.status)}
                  </span>
                  <Link
                    href={`/academy/${track.trackId}/${lesson.slug}`}
                    className="min-w-0 flex-1 truncate text-[13.5px] text-text-body transition-colors hover:text-accent"
                  >
                    {lesson.title}
                  </Link>
                  {lesson.status === "review" && (
                    <span className="font-mono text-[10px] uppercase tracking-label text-warning">
                      Redo
                    </span>
                  )}
                  <span className="shrink-0 font-mono text-[11px] text-text-muted">
                    {when(lesson)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {/* Generated per champion, so deliberately outside the track list and outside the
            totals — there is no defined set to finish here (ADR-030). */}
        {transcript.champions.length > 0 && (
          <section className="notch border border-line-1 bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-1 px-5 py-3.5">
              <div className="flex items-baseline gap-3">
                <Link
                  href="/academy/champion"
                  className="font-display text-[15px] font-bold uppercase tracking-[0.02em] text-text transition-colors hover:text-accent"
                >
                  Champion Mastery
                </Link>
                <span className="font-mono text-[11px] text-text-muted">
                  {transcript.champions.filter((l) => l.status === "mastered").length} proved in
                  ranked
                </span>
              </div>
            </div>

            <ul className="flex flex-col">
              {transcript.champions.map((lesson) => (
                <li
                  key={lesson.lessonId}
                  className="flex items-center gap-3 border-b border-line-1 px-5 py-2.5 last:border-b-0"
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {marker(lesson.status)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13.5px] text-text-body">
                    {lesson.title}
                  </span>
                  {lesson.status === "review" && (
                    <span className="font-mono text-[10px] uppercase tracking-label text-warning">
                      Redo
                    </span>
                  )}
                  <span className="shrink-0 font-mono text-[11px] text-text-muted">
                    {when(lesson)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
