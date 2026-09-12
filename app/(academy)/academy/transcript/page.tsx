import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranscript, type TranscriptLesson } from "@/domains/academy";
import { CertificateShare } from "@/domains/academy/components/CertificateShare";
import { TranscriptPanel } from "@/domains/academy/components/TranscriptPanel";
import { getSession } from "@/lib/auth/session";
import { formatDate } from "@/lib/uiLocale";

export const metadata: Metadata = {
  title: "Your transcript",
  description: "Every Academy lesson you have read, passed and proved in your own ranked games.",
  robots: { index: false },
};

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

  const totals: [string, string, string][] = [
    ["Lessons read", `${transcript.totalCompleted}/${transcript.totalLessons}`, "text-text"],
    ["Mastered", `${transcript.totalMastered}`, "text-accent"],
    ["Academy XP", `${transcript.xp}`, "text-accent"],
  ];

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-7 md:px-8 md:pb-12">
      <p className="hud-label text-text-faint">
        <Link href="/academy" className="text-text-muted transition-colors hover:text-accent">
          Academy
        </Link>{" "}
        / Transcript
      </p>

      <div className="mt-4 grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <header className="animate-hud-enter">
          <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-accent">
            {"// Your record"}
          </p>
          <h1 className="mt-3.5 font-display text-[32px] font-black uppercase leading-none tracking-[0.02em] text-text md:text-[42px]">
            Transcript
          </h1>
          <p className="mt-3.5 max-w-[58ch] text-[15.5px] leading-relaxed text-text-body">
            Completed means you passed the drills. Mastered means your own ranked games moved and
            stayed moved — it is the only line here that is not self-reported.
          </p>
        </header>

        <dl className="flex animate-hud-enter flex-wrap gap-x-8 gap-y-4 [animation-delay:80ms]">
          {totals.map(([label, value, tone]) => (
            <div key={label}>
              <dt className="hud-label text-text-faint">{label}</dt>
              <dd className={`mt-1.5 font-mono text-2xl font-bold tabular-nums ${tone}`}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-6 grid gap-3.5">
        {transcript.tracks.map((track, i) => (
          <TranscriptPanel
            key={track.trackId}
            title={track.title}
            href={`/academy/${track.trackId}`}
            count={`${track.completed}/${track.total}`}
            note={`${track.mastered} mastered`}
            completion={track.completed / track.total}
            // Only a finished track has a certificate — the API refuses the rest.
            action={
              track.finished ? (
                <CertificateShare trackId={track.trackId} trackTitle={track.title} />
              ) : undefined
            }
            lessons={track.lessons}
            lessonHref={(lesson) => `/academy/${track.trackId}/${lesson.slug}`}
            when={when}
            index={i}
          />
        ))}

        {/* Generated per champion, so deliberately outside the track list and outside the
            totals — there is no defined set to finish here (ADR-030). */}
        {transcript.champions.length > 0 && (
          <TranscriptPanel
            title="Champion Mastery"
            href="/academy/champion"
            note={`${transcript.champions.filter((l) => l.status === "mastered").length} proved in ranked`}
            lessons={transcript.champions}
            when={when}
            index={transcript.tracks.length}
          />
        )}
      </div>
    </div>
  );
}
