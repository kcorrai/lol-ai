"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/domains/marketplace/components/hud/panelCard";
import { tierColorClass, tierLabel } from "@/lib/riot/rankDisplay";
import type { SessionPrep } from "@/domains/marketplace";

interface Props {
  bookingId: string;
}

/**
 * What the coach reads before the session.
 *
 * The gap this closes is the one the competitor research kept turning up: on
 * every other platform coach prep still runs on "send me your OP.GG". None of
 * this is generated — it is the student's own match data, shown to the one
 * person they asked to look at it.
 */
export function SessionPrepPanel({ bookingId }: Props): React.ReactElement {
  const { data, isLoading } = useQuery<{ prep: SessionPrep }>({
    queryKey: ["marketplace", "prep", bookingId],
    queryFn: () => apiFetch(`/api/bookings/${bookingId}/prep`),
    staleTime: 60_000,
  });

  const prep = data?.prep;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Before you start</CardTitle>
        <CardDescription>
          Your student&apos;s own data, because they attached the account to this booking.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading && <Skeleton className="h-32 w-full" />}

        {prep && !prep.shared && (
          <p className="text-sm text-text-muted">
            No account attached to this booking, so there is nothing to read. Ask them for their
            Riot ID in the session.
          </p>
        )}

        {prep?.shared && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-sm text-text">{prep.riotId}</span>

              {prep.rank && (
                <span
                  className={`font-mono text-sm font-semibold ${tierColorClass(prep.rank.tier)}`}
                >
                  {tierLabel(prep.rank.tier)} {prep.rank.division}
                  <span className="ml-1 text-text-faint">{prep.rank.lp} LP</span>
                </span>
              )}

              {prep.rank && (
                <span className="text-xs text-text-muted">
                  {prep.rank.wins}W {prep.rank.losses}L
                </span>
              )}
            </div>

            {prep.profile ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-3 text-sm">
                  <Stat label="Games read" value={String(prep.profile.gamesAnalyzed)} />
                  <Stat label="Win rate" value={`${Math.round(prep.profile.winRate)}%`} />
                  <Stat label="Strongest" value={prep.profile.strongestArea} />
                  <Stat label="Weakest" value={prep.profile.weakestArea} />
                </div>

                {prep.profile.mostPlayedChampions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {prep.profile.mostPlayedChampions.slice(0, 6).map((champion) => (
                      <Badge key={champion} variant="secondary">
                        {champion}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-text-muted">
                No synced games on that account yet — there is nothing to read from it.
              </p>
            )}
          </>
        )}

        {prep && prep.flaggedMatchIds.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Matches they pointed at
            </p>
            <p className="mt-1 font-mono text-xs text-text-body">
              {prep.flaggedMatchIds.join(", ")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="rounded-md border border-border bg-surface-2 px-3 py-2">
      <p className="font-mono text-sm text-text">{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  );
}
