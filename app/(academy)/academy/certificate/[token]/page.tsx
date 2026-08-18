import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Award } from "lucide-react";
import { getCardByToken, type AcademyCardData } from "@/domains/coaching/services/cardService";

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
    return { title: "Certificate not found", alternates: { canonical: url }, robots: { index: false } };
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

  const finished = new Date(certificate.finishedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-[720px] px-5 py-14 md:px-8">
      <section className="notch border border-acid-500 bg-surface glow-accent-soft">
        <div className="flex items-center gap-2.5 border-b border-line-1 px-6 py-3.5">
          <Award className="h-4 w-4 text-accent" strokeWidth={2} />
          <span className="hud-label text-accent">Academy certificate</span>
        </div>

        <div className="px-6 py-8">
          <p className="text-[15px] text-text-muted">{certificate.displayName} finished</p>
          <h1 className="mt-1.5 font-display text-3xl font-black uppercase tracking-[0.01em] text-text md:text-[40px]">
            {certificate.trackTitle}
          </h1>

          <dl className="mt-8 flex flex-wrap gap-10 border-t border-line-1 pt-6">
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-label text-text-muted">
                Lessons
              </dt>
              <dd className="mt-1 font-display text-3xl font-bold text-accent">
                {certificate.lessonsTotal}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-label text-text-muted">
                Proved in ranked
              </dt>
              <dd className="mt-1 font-display text-3xl font-bold text-warning">
                {certificate.lessonsMastered}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-label text-text-muted">
                Finished
              </dt>
              <dd className="mt-1 font-mono text-[15px] text-text-body">{finished}</dd>
            </div>
          </dl>

          {/* The distinction is the whole claim, so it is said in words as well as numbers. */}
          <p className="mt-8 text-[14px] leading-relaxed text-text-body">
            Every lesson in this track was read and its drills answered. The ones counted as
            proved were measured afterwards in this player&apos;s own ranked games — the Academy
            watched the metric each lesson set, in the role it was set in, and only then called
            it mastered.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-1 px-6 py-4">
          <span className="font-mono text-[11px] uppercase tracking-label text-text-muted">
            LaneIQ Academy
          </span>
          <Link
            href="/academy"
            className="tag-cut bg-accent px-4 py-2 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-background transition-colors hover:bg-acid-400"
          >
            Start the curriculum
          </Link>
        </div>
      </section>
    </div>
  );
}
