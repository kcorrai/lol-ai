import type { Metadata } from "next";
import Link from "next/link";
import { listCoaches } from "@/domains/marketplace";
import { EmptyState } from "@/components/ui/empty-state";
import { CoachCardTile } from "@/domains/marketplace/components/CoachCardTile";

export const metadata: Metadata = {
  title: "Find a League of Legends Coach",
  description:
    "Book a human coach whose rank we check ourselves against a linked Riot account, and show you the date we last read it.",
};

// Public and indexable — this is the acquisition surface for the whole section,
// so it must render for someone who has never signed in.
//
// Filters, sorting and pagination are M5. This is the list.
export const revalidate = 300;

export default async function CoachesPage() {
  const coaches = await listCoaches();

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-text">Find a coach</h1>
        <p className="mt-2 text-sm text-text-body">
          Every rank on this page was read from the coach&apos;s own linked Riot account and is
          shown with the date we last checked it. Nobody here typed their rank into a box.
        </p>
      </div>

      {coaches.length === 0 ? (
        <EmptyState
          title="No coaches yet"
          description="The first coaches are being reviewed. If you coach, this is a good moment to apply."
          action={
            <Link
              href="/coach/apply"
              className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background"
            >
              Become a coach
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {coaches.map((coach) => (
            <CoachCardTile key={coach.slug} coach={coach} />
          ))}
        </div>
      )}
    </div>
  );
}
