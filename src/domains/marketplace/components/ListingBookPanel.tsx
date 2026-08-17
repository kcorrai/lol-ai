"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Listing } from "@/domains/marketplace/types";
import { BookingForm } from "@/domains/marketplace/components/BookingForm";

interface Props {
  coachSlug: string;
  listing: Listing;
  acceptingStudents: boolean;
}

/**
 * The only client boundary on a coach's public profile.
 *
 * The card itself stays a server component so the page keeps rendering for
 * search engines and for anyone with JavaScript off; this is just the button
 * and the form it opens.
 */
export function ListingBookPanel({
  coachSlug,
  listing,
  acceptingStudents,
}: Props): React.ReactElement {
  const [open, setOpen] = useState(false);

  if (!acceptingStudents) {
    return (
      <p className="mt-3 text-xs text-warning">
        This coach is not taking new students right now.
      </p>
    );
  }

  if (!open) {
    return (
      <Button className="mt-3" onClick={() => setOpen(true)}>
        Request this session
      </Button>
    );
  }

  return (
    <div className="mt-3">
      <BookingForm coachSlug={coachSlug} listing={listing} onCancel={() => setOpen(false)} />
    </div>
  );
}
