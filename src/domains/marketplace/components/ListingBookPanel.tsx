import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Listing } from "@/domains/marketplace/types";

interface Props {
  coachSlug: string;
  listing: Listing;
  acceptingStudents: boolean;
}

/**
 * The way from a listing to asking for it.
 *
 * A link to the request page rather than a form unfolding in the card: the
 * request needs a time, the student's games and a summary of what is being
 * agreed, and that is a page's worth — and a link works for a signed-out
 * reader, which the inline form did not.
 */
export function ListingBookPanel({
  coachSlug,
  listing,
  acceptingStudents,
}: Props): React.ReactElement {
  if (!acceptingStudents) {
    return (
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-warning">
        This coach is not taking new students right now.
      </p>
    );
  }

  return (
    <Button asChild size="sm">
      <Link href={`/coaches/${coachSlug}/book/${listing.id}`}>
        Request this session
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </Button>
  );
}
