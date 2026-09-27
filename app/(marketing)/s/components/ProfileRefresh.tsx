"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useRefreshPublicProfile, type ProfileTarget } from "@/hooks/useRefreshPublicProfile";
import { FetchError } from "@/lib/api/fetcher";
import { timeAgo } from "./matchRowFormat";

interface Props {
  target: ProfileTarget;
  /** When this copy was read from Riot; absent on profiles cached before it was recorded. */
  fetchedAt?: string;
}

function failureMessage(err: Error): string {
  if (err instanceof FetchError && err.statusCode === 429) {
    return "Too many lookups — try again in a few minutes.";
  }
  if (err instanceof FetchError && err.statusCode === 503) {
    return "Riot is busy — try again shortly.";
  }
  return "Could not update right now.";
}

/**
 * "Updated 3h ago · Update", the control every stats site puts on a profile.
 *
 * The profile is a cached copy on purpose — that is what keeps a popular one from costing a Riot
 * read per visitor — so the visitor is told how old it is and given the one way to make it newer.
 * The server decides whether a refresh actually happens; a copy read in the last two minutes is
 * kept, and the button says so rather than pretending it refreshed.
 */
export function ProfileRefresh({ target, fetchedAt }: Props): React.ReactElement {
  const router = useRouter();
  const refresh = useRefreshPublicProfile();
  const [note, setNote] = useState<string | null>(null);

  function onClick(): void {
    setNote(null);
    refresh.mutate(target, {
      onSuccess: (result) => {
        if (result.refreshed) {
          router.refresh();
        } else {
          setNote(`Just updated — next update in ${Math.ceil(result.retryAfterMs / 1000)}s.`);
        }
      },
      onError: (err) => setNote(failureMessage(err)),
    });
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-text-muted">
        {note ?? (fetchedAt ? `Updated ${timeAgo(fetchedAt)}` : null)}
      </span>
      <button
        type="button"
        onClick={onClick}
        disabled={refresh.isPending}
        className="tag-cut inline-flex h-9 items-center gap-2 border border-accent/40 px-4 font-display text-xs font-bold uppercase tracking-[0.1em] text-accent transition-colors hover:bg-accent/10 disabled:text-text-faint"
      >
        <RefreshCw
          className={`h-3.5 w-3.5 ${refresh.isPending ? "animate-spin" : ""}`}
          aria-hidden
        />
        {refresh.isPending ? "Updating" : "Update"}
      </button>
    </div>
  );
}
