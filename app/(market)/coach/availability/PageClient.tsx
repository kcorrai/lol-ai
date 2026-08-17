"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  useCoachAvailability,
  useSaveAvailability,
  useSaveException,
  useDeleteException,
} from "@/hooks/useCoachAvailability";
import type { RuleInput } from "@/domains/marketplace";
import { WeeklyScheduleEditor } from "@/domains/marketplace/components/WeeklyScheduleEditor";
import { DateExceptionEditor } from "@/domains/marketplace/components/DateExceptionEditor";

export default function CoachAvailabilityPage(): React.ReactElement {
  const { data, isLoading, isError, refetch } = useCoachAvailability();
  const saveRules = useSaveAvailability();
  const saveException = useSaveException();
  const removeException = useDeleteException();
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <ErrorState message="Could not load your availability." onRetry={() => void refetch()} />
      </div>
    );
  }

  async function handleSaveRules(rules: RuleInput[]): Promise<void> {
    await saveRules.mutateAsync(rules);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text">Availability</h1>
        <p className="mt-1 text-sm text-text-muted">
          When you can be booked. Students see these hours converted into their own timezone, and
          a slot disappears the moment somebody takes it.
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Weekly hours</CardTitle>
          <CardDescription>The pattern most weeks follow.</CardDescription>
        </CardHeader>
        <CardContent>
          <WeeklyScheduleEditor
            initial={data.rules.map(({ days, startMinute, endMinute }) => ({
              days,
              startMinute,
              endMinute,
            }))}
            timeZone={data.timeZone}
            saving={saveRules.isPending}
            onSave={handleSaveRules}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exceptions</CardTitle>
          <CardDescription>
            One date that does not follow the pattern. An exception replaces that day&apos;s hours
            rather than adding to them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DateExceptionEditor
            exceptions={data.exceptions}
            saving={saveException.isPending || removeException.isPending}
            onSave={(input) => {
              setError(null);
              saveException.mutate(input, {
                onError: (err) =>
                  setError(err instanceof Error ? err.message : "Could not save that date."),
              });
            }}
            onDelete={(date) => {
              setError(null);
              removeException.mutate(date, {
                onError: (err) =>
                  setError(err instanceof Error ? err.message : "Could not remove that date."),
              });
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
