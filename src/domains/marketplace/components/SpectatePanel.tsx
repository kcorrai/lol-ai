"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/domains/marketplace/components/hud/panelCard";
import { regionLabel } from "@/lib/riot/regions";
import type { SpectateStatus } from "@/domains/marketplace";

interface Props {
  bookingId: string;
}

/**
 * Whether the student is playing right now.
 *
 * The coach spectates in their own client — there is no video here and no need
 * for any. What the platform is actually good for is the bit that is otherwise
 * a scramble in a DM: is the game on, and how far in.
 *
 * Polled rather than pushed, on the same reasoning as the draft room's live
 * sync (ADR-016): there is no long-lived process to hold a socket on, and a
 * ten-second answer is a fine answer to this question.
 */
export function SpectatePanel({ bookingId }: Props): React.ReactElement {
  const { data, isLoading } = useQuery<{ status: SpectateStatus }>({
    queryKey: ["marketplace", "spectate", bookingId],
    queryFn: () => apiFetch(`/api/bookings/${bookingId}/spectate`),
    refetchInterval: 20_000,
    staleTime: 10_000,
  });

  const status = data?.status;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your student right now</CardTitle>
        <CardDescription>Spectate from your own client — nothing streams through us.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoading && <Skeleton className="h-16 w-full" />}

        {status && !status.shared && (
          <p className="text-sm text-text-muted">
            No account attached to this booking, so there is nothing to watch. Ask them for their
            Riot ID.
          </p>
        )}

        {status?.shared && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-sm text-text">{status.riotId}</span>
            {status.region && <Badge variant="outline">{regionLabel(status.region)}</Badge>}

            {status.inGame ? (
              <>
                <Badge variant="success">In a game</Badge>
                {status.championName && <Badge variant="secondary">{status.championName}</Badge>}
                {status.gameLength !== null && (
                  <span className="font-mono text-xs text-text-muted">
                    {Math.floor(status.gameLength / 60)} min in
                  </span>
                )}
              </>
            ) : (
              <Badge variant="outline">Not in a game</Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
