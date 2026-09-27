import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCoachProfilePage } from "@/domains/marketplace";
import { BookingRequest } from "@/domains/marketplace/components/booking/BookingRequest";

interface Props {
  params: { slug: string; listingId: string };
  searchParams: { start?: string; goal?: string };
}

// A form, not a page to be found: nothing here is worth an index entry, and a
// crawler following every listing's request link would only find duplicates.
export const metadata: Metadata = {
  title: "Request a session",
  robots: { index: false, follow: false },
};

export default async function BookRequestPage({ params, searchParams }: Props) {
  const coach = await getCoachProfilePage(params.slug);
  const listing = coach?.listings.find((l) => l.id === params.listingId);
  if (!coach || !listing) notFound();

  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-16 pt-7 md:px-8">
      <nav className="text-[12px] text-text-faint" aria-label="Breadcrumb">
        <Link href="/coaches" className="text-text-muted hover:text-accent">
          Coaches
        </Link>{" "}
        /{" "}
        <Link href={`/coaches/${coach.slug}`} className="text-text-muted hover:text-accent">
          {coach.displayName}
        </Link>{" "}
        / <span className="text-text-body">Request</span>
      </nav>
      <h1 className="mb-7 mt-4 font-display text-[28px] font-black uppercase leading-none tracking-[0.02em] text-text md:text-[36px]">
        Request a session
      </h1>

      {coach.acceptingStudents ? (
        <BookingRequest
          coach={{ slug: coach.slug, displayName: coach.displayName, timezone: coach.timezone }}
          listing={listing}
          initialStart={validIso(searchParams.start)}
          initialGoal={(searchParams.goal ?? "").slice(0, 500)}
        />
      ) : (
        <p className="notch border border-warning/40 bg-warning/10 px-5 py-4 text-[14px] text-warning">
          {coach.displayName} is not taking new students right now.
        </p>
      )}
    </div>
  );
}

/** A `start` prefill is only a hint; anything that is not a real instant is dropped. */
function validIso(value: string | undefined): string | null {
  if (!value) return null;
  const t = Date.parse(value);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}
