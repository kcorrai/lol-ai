import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Award, Check, ImageIcon } from "lucide-react";
import { getCardByToken, type AcademyCardData } from "@/domains/coaching/services/cardService";
import { TRACKS } from "@/domains/academy";
import { ArtBackdrop } from "@/domains/academy/components/ArtBackdrop";
import { formatDate } from "@/lib/uiLocale";

interface Props {
  params: { token: string };
}

/** The card, or null for anything that is not a live academy certificate. */
async function loadCertificate(token: string): Promise<AcademyCardData | null> {
  try {
    const { data, expired } = await getCardByToken(token);
    if (expired || data.cardType !== "academy") return null;
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";
  const url = `${appUrl}/academy/certificate/${params.token}`;
  const certificate = await loadCertificate(params.token);

  if (!certificate) {
    return {
      title: "Certificate not found",
      alternates: { canonical: url },
      robots: { index: false },
    };
  }

  const title = `${certificate.displayName} finished ${certificate.trackTitle}`;
  const description = `${certificate.lessonsTotal} lessons, ${certificate.lessonsMastered} proved in ranked games. LaneIQ Academy.`;
  const image = `${appUrl}/api/cards/${params.token}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, images: [image], type: "website", url },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function CertificatePage({ params }: Props): Promise<React.ReactElement> {
  const certificate = await loadCertificate(params.token);
  if (!certificate) notFound();

  const finished = formatDate(certificate.finishedAt, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // The stored card carries the track's title but not its id, so the lesson list is looked up
  // by title. A rename would drop the list rather than print the wrong one.
  const track = TRACKS.find((t) => t.title === certificate.trackTitle) ?? null;

  return (
    <div className="grid place-items-center px-5 py-12 md:px-8">
      <section className="notch-lg glow-accent-soft relative w-full max-w-[760px] animate-hud-enter overflow-hidden border border-acid-500 bg-surface">
        <ArtBackdrop
          champion={track?.art ?? "Viego"}
          focus="56% 18%"
          opacity={0.22}
          sizes="(max-width: 800px) 100vw, 760px"
        />

        <div className="relative flex items-center gap-2.5 border-b border-line-1 px-6 py-4">
          <Award className="h-[17px] w-[17px] text-accent" strokeWidth={2} />
          <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-accent">
            Academy certificate
          </span>
        </div>

        <div className="relative px-6 pb-7 pt-8 md:px-[30px]">
          <p className="text-[15px] text-text-body">{certificate.displayName} finished</p>
          <h1 className="mt-3 font-display text-[34px] font-black uppercase leading-[0.96] tracking-[0.02em] text-text md:text-[52px]">
            {certificate.trackTitle}
          </h1>

          <dl className="mt-7 grid grid-cols-3 gap-px border border-border bg-line-1">
            <div className="bg-surface-dark/70 px-[18px] py-4">
              <dt className="hud-label text-text-faint">Lessons</dt>
              <dd className="mt-2 font-mono text-[30px] font-bold tabular-nums leading-none text-accent">
                {certificate.lessonsTotal}
              </dd>
            </div>
            <div className="bg-surface-dark/70 px-[18px] py-4">
              <dt className="hud-label text-text-faint">Proved in ranked</dt>
              <dd className="mt-2 flex items-baseline gap-2">
                <span
                  className={`font-mono text-[30px] font-bold tabular-nums leading-none ${
                    certificate.lessonsMastered > 0 ? "text-accent" : "text-warning"
                  }`}
                >
                  {certificate.lessonsMastered}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-faint">
                  of {certificate.lessonsTotal}
                </span>
              </dd>
            </div>
            <div className="bg-surface-dark/70 px-[18px] py-4">
              <dt className="hud-label text-text-faint">Finished</dt>
              <dd className="mt-3 font-mono text-[13px] text-text md:text-[15px]">{finished}</dd>
            </div>
          </dl>

          {track && (
            <div className="mt-6">
              <p className="hud-label text-text-faint">The {track.lessons.length} lessons</p>
              <ul className="mt-3 grid gap-[7px]">
                {track.lessons.map((lesson) => (
                  <li key={lesson.slug} className="grid grid-cols-[15px_1fr] items-center gap-2.5">
                    <Check className="h-3.5 w-3.5 text-accent" strokeWidth={2.5} />
                    <span className="truncate text-[13.5px] text-text-body">{lesson.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* The distinction is the whole claim, so it is said in words as well as numbers. */}
          <p className="mt-6 max-w-[70ch] text-[13.5px] leading-relaxed text-text-muted">
            Every lesson in this track was read and its drills answered. The ones counted as proved
            were measured afterwards in this player&apos;s own ranked games — the Academy watched
            the metric each lesson set, in the role it was set in, and only then called it mastered.
          </p>
        </div>

        <div className="relative flex flex-wrap items-center justify-between gap-3 border-t border-line-1 px-6 py-4">
          <span className="hud-label text-text-faint">LaneIQ Academy</span>
          <span className="flex flex-wrap gap-2.5">
            <a
              href={`/api/cards/${params.token}`}
              target="_blank"
              rel="noreferrer"
              className="tag-cut flex h-[34px] items-center gap-2 border border-line-2 px-4 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-text transition-colors hover:border-acid-500 hover:text-accent"
            >
              <ImageIcon className="h-3.5 w-3.5" strokeWidth={2} />
              Card image
            </a>
            <Link
              href="/academy"
              className="tag-cut flex h-[34px] items-center bg-accent px-4 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-background transition-colors hover:bg-acid-400"
            >
              Start the curriculum →
            </Link>
          </span>
        </div>
      </section>
    </div>
  );
}
