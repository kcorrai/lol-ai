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
import { useCoachRank } from "@/hooks/useCoachRank";
import type { CoachProfileInput, OwnCoachProfile } from "@/domains/marketplace";
import { DEFAULT_COMMISSION_BPS, MIN_BIO_LENGTH } from "@/domains/marketplace/policy";
import { CoachApplicationForm } from "@/domains/marketplace/components/CoachApplicationForm";
import { ApplicationStatusPanel } from "@/domains/marketplace/components/ApplicationStatusPanel";
import { RankProofPanel } from "@/domains/marketplace/components/RankProofPanel";
import { HudPanel } from "@/domains/marketplace/components/hud/HudPanel";
import { MarketStat } from "@/domains/marketplace/components/hud/MarketStat";

const KEEP_PCT = 100 - DEFAULT_COMMISSION_BPS / 100;

// The three things a reviewer sends an application back for. Written from what
// `firstMissingField` and the rank gate actually enforce, not from a guess.
const DECLINES = [
  "No linked account — there is nothing to check the rank against.",
  "A headline that promises a rank the checked account does not hold.",
  "A bio that describes the game rather than what you do in a session.",
];

export default function CoachApplyPage(): React.ReactElement {
  const { data, isLoading, isError, refetch } = useOwnCoachProfile();
  const { data: rank } = useCoachRank();
  const save = useSaveCoachProfile();
  const submit = useSubmitApplication();
  const withdraw = useWithdrawApplication();
  const [statusError, setStatusError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-[1240px] gap-4 px-5 pt-7 md:px-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-[1240px] px-5 pt-7 md:px-8">
        <ErrorState message="Could not load your coach profile." onRetry={() => void refetch()} />
      </div>
    );
  }

  const profile = data?.profile ?? null;
  // The form is read-only under a reviewer, and while suspended there is
  // nothing an edit could achieve — the way back is a decision, not a rewrite.
  const locked = profile?.status === "PENDING" || profile?.status === "SUSPENDED";
  const checklist = buildChecklist(profile, Boolean(rank?.badge));

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
    <>
      <section className="relative overflow-hidden border-b border-line-1">
        <span
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(880px 320px at 16% 0%, rgba(198,255,61,0.10), transparent 70%), var(--bg-hero-fade)",
          }}
          aria-hidden
        />
        <span className="bg-scanline absolute inset-0" aria-hidden />

        <div className="relative mx-auto max-w-[1240px] px-5 pb-7 pt-8 md:px-8">
          <p className="mb-3 flex items-center gap-2.5">
            <span className="h-[7px] w-[7px] animate-pulse bg-accent" aria-hidden />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-accent">
              {"// You never type your rank in"}
            </span>
          </p>
          <h1 className="max-w-[22ch] font-display text-[32px] font-black uppercase leading-[0.98] tracking-[0.02em] text-text md:text-[44px]">
            Coach on LaneIQ
          </h1>
          <p className="mt-4 max-w-[62ch] text-[15.5px] text-text-body">
            Set your own prices and hours. Your rank is read from your linked Riot account and
            shown with the date we last checked it — so students see a number you did not have to
            be trusted on.
          </p>

          <div className="mt-6 grid gap-px border border-border bg-line-1 sm:grid-cols-2 lg:grid-cols-4">
            <HeroStat label="You keep" value={`${KEEP_PCT}%`} note="of the price you set" accent />
            <HeroStat label="Rank" value="Checked" note="read from your account" accent />
            <HeroStat label="Review" value="By a human" note="against your checked rank" />
            <HeroStat label="Hours" value="Yours" note="in your own timezone" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] px-5 pb-16 pt-6 md:px-8">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_306px]">
          <div className="grid min-w-0 gap-4">
            {/*
              Shown even while the profile is locked. A rank is read, not
              written, so refreshing it under a reviewer changes nothing the
              reviewer is judging — and it is the thing they are judging *on*.
            */}
            {profile && <RankProofPanel />}

            {!locked && (
              <CoachApplicationForm profile={profile} saving={save.isPending} onSave={handleSave} />
            )}

            {profile && (
              <ApplicationStatusPanel
                profile={profile}
                submitting={submit.isPending}
                withdrawing={withdraw.isPending}
                onSubmit={handleSubmit}
                onWithdraw={handleWithdraw}
                error={statusError}
                checklist={checklist}
              />
            )}

            {!profile && (
              <CoachApplicationForm profile={null} saving={save.isPending} onSave={handleSave} />
            )}
          </div>

          <div className="grid gap-3.5 lg:sticky lg:top-20">
            <HudPanel label="What you earn">
              <p className="font-mono text-[26px] font-bold leading-none text-accent">
                {KEEP_PCT}%
              </p>
              <p className="mt-3 text-[13px] text-text-body">
                of the price you set. The cut comes out of your price rather than being added to
                it, so booking you here is not more expensive than booking you directly.
              </p>
              <dl className="mt-3.5 grid gap-2.5 border-t border-line-1 pt-3">
                <EarnRow label="A $30 review" value="you keep $24" />
                <EarnRow label="A $50 hour" value="you keep $40" />
                <EarnRow label="Paid out" value="when the session settles" muted />
              </dl>
            </HudPanel>

            <HudPanel label="What we decline for">
              <ul className="grid gap-2.5">
                {DECLINES.map((line) => (
                  <li key={line} className="grid grid-cols-[14px_1fr] items-start gap-2.5">
                    <span className="mt-1.5 h-[5px] w-[5px] bg-danger" aria-hidden />
                    <span className="text-[13px] text-text-body">{line}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3.5 border-t border-line-1 pt-3 text-[12.5px] text-text-muted">
                A linked account is not optional — it is the only reason students trust the number.
              </p>
            </HudPanel>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * What still has to be true before this can be sent.
 *
 * Mirrors `firstMissingField` on the server plus the rank gate, so the button
 * is disabled for exactly the reasons the submit endpoint would refuse for.
 */
function buildChecklist(
  profile: OwnCoachProfile | null,
  hasBadge: boolean
): { text: string; ok: boolean }[] {
  const named = Boolean(profile?.displayName.trim() && profile?.headline.trim());
  const written = (profile?.bio.trim().length ?? 0) >= MIN_BIO_LENGTH;
  const picked =
    (profile?.roles.length ?? 0) > 0 &&
    (profile?.languages.length ?? 0) > 0 &&
    (profile?.regions.length ?? 0) > 0;

  return [
    {
      text: hasBadge
        ? "Riot account linked and rank checked"
        : "Link a Riot account — nothing is reviewed without one",
      ok: hasBadge,
    },
    { text: named ? "Name and headline written" : "Add a display name and a headline", ok: named },
    {
      text: written
        ? "How you coach written"
        : `Say what a session with you is like — at least ${MIN_BIO_LENGTH} characters`,
      ok: written,
    },
    {
      text: picked ? "Roles, languages and regions picked" : "Pick a role, a language and a region",
      ok: picked,
    },
  ];
}

function HeroStat({
  label,
  value,
  note,
  accent,
}: {
  label: string;
  value: string;
  note: string;
  accent?: boolean;
}): React.ReactElement {
  return (
    <div className="bg-background px-4 py-3.5">
      <MarketStat label={label} value={value} note={note} tone={accent ? "accent" : "default"} />
    </div>
  );
}

function EarnRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}): React.ReactElement {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[13px] text-text-muted">{label}</dt>
      <dd className={`font-mono text-[12.5px] ${muted ? "text-text-muted" : "text-accent"}`}>
        {value}
      </dd>
    </div>
  );
}
