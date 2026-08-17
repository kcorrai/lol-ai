"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import {
  useOwnCoachProfile,
  useSaveCoachProfile,
  useSubmitApplication,
  useWithdrawApplication,
} from "@/hooks/useCoachProfile";
import type { CoachProfileInput } from "@/domains/marketplace";
import { CoachApplicationForm } from "@/domains/marketplace/components/CoachApplicationForm";
import { ApplicationStatusPanel } from "@/domains/marketplace/components/ApplicationStatusPanel";
import { RankProofPanel } from "@/domains/marketplace/components/RankProofPanel";

export default function CoachApplyPage(): React.ReactElement {
  const { data, isLoading, isError, refetch } = useOwnCoachProfile();
  const save = useSaveCoachProfile();
  const submit = useSubmitApplication();
  const withdraw = useWithdrawApplication();
  const [statusError, setStatusError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <ErrorState message="Could not load your coach profile." onRetry={() => void refetch()} />
      </div>
    );
  }

  const profile = data?.profile ?? null;
  // The form is read-only under a reviewer, and while suspended there is
  // nothing an edit could achieve — the way back is a decision, not a rewrite.
  const locked = profile?.status === "PENDING" || profile?.status === "SUSPENDED";

  async function handleSave(input: CoachProfileInput): Promise<void> {
    await save.mutateAsync(input);
  }

  function handleSubmit(): void {
    setStatusError(null);
    submit.mutate(undefined, {
      onError: (err) =>
        setStatusError(err instanceof Error ? err.message : "Could not submit your application."),
    });
  }

  function handleWithdraw(): void {
    setStatusError(null);
    withdraw.mutate(undefined, {
      onError: (err) =>
        setStatusError(err instanceof Error ? err.message : "Could not withdraw your application."),
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text">Coach on LaneIQ</h1>
        <p className="mt-1 text-sm text-text-muted">
          Set your own prices and hours. Your rank is read from your linked Riot account and shown
          with the date we last checked it — so students see a number you did not have to be
          trusted on.
        </p>
      </div>

      {profile && (
        <ApplicationStatusPanel
          profile={profile}
          submitting={submit.isPending}
          withdrawing={withdraw.isPending}
          onSubmit={handleSubmit}
          onWithdraw={handleWithdraw}
          error={statusError}
        />
      )}

      {/*
        Shown even while the profile is locked. A rank is read, not written, so
        refreshing it under a reviewer changes nothing the reviewer is judging —
        and it is the thing they are judging *on*.
      */}
      {profile && <RankProofPanel />}

      {!locked && (
        <CoachApplicationForm profile={profile} saving={save.isPending} onSave={handleSave} />
      )}
    </div>
  );
}
