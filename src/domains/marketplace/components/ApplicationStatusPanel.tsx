"use client";

import Link from "next/link";
import { ArrowUpRight, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OwnCoachProfile } from "@/domains/marketplace";
import { HudPanel, type PanelTone } from "@/domains/marketplace/components/hud/HudPanel";
import { StatusChip, type ChipTone } from "@/domains/marketplace/components/hud/StatusChip";

interface Props {
  profile: OwnCoachProfile;
  submitting: boolean;
  withdrawing: boolean;
  onSubmit: () => void;
  onWithdraw: () => void;
  error: string | null;
  /**
   * Each requirement and whether it is met, so the button explains itself.
   * `blocking` marks the ones the submit endpoint actually enforces — a rank is
   * advice here, because the server accepts an application without one and a
   * button that refuses what the server allows is its own kind of lie.
   */
  checklist: { text: string; ok: boolean; blocking: boolean }[];
}

/**
 * Where an application stands, and the one action available from here.
 *
 * Every state says what happens next, including the ones that are bad news. A
 * rejected applicant is shown the reviewer's note, because being told nothing
 * is the complaint every rejected coach on every competing platform has — and
 * because a second application is only worth reading if the first was answered.
 */
export function ApplicationStatusPanel({
  profile,
  submitting,
  withdrawing,
  onSubmit,
  onWithdraw,
  error,
  checklist,
}: Props): React.ReactElement {
  const ready = checklist.every((item) => item.ok || !item.blocking);
  const canSend = profile.status === "DRAFT" || profile.status === "REJECTED";
  const blocker = checklist.find((item) => !item.ok && item.blocking);
  const advice = checklist.find((item) => !item.ok && !item.blocking);

  return (
    <HudPanel
      label={canSend ? "Step 3 · Send it" : "Application"}
      tone={statusTone(profile.status)}
      action={
        <StatusChip tone={statusChip(profile.status)}>{statusLabel(profile.status)}</StatusChip>
      }
    >
      <p className="text-[14.5px] text-text-body">{describe(profile)}</p>

      {profile.status === "REJECTED" && profile.reviewNote && (
        <div className="mt-3.5 border-l-2 border-danger bg-danger/10 px-4 py-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-danger">
            Why it was declined
          </p>
          <p className="mt-1.5 text-sm text-text-body">{profile.reviewNote}</p>
        </div>
      )}

      {profile.status === "SUSPENDED" && profile.reviewNote && (
        <div className="mt-3.5 border-l-2 border-warning bg-warning/10 px-4 py-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-warning">
            Why it was suspended
          </p>
          <p className="mt-1.5 text-sm text-text-body">{profile.reviewNote}</p>
        </div>
      )}

      {canSend && (
        <ul className="mt-4 grid gap-2.5">
          {checklist.map((item) => (
            <li key={item.text} className="grid grid-cols-[18px_1fr] items-start gap-3">
              <span
                aria-hidden
                className={
                  item.ok
                    ? "mt-1.5 block h-[7px] w-[7px] bg-accent"
                    : "mt-1.5 block h-[7px] w-[7px] border border-warning"
                }
              />
              <span
                className={item.ok ? "text-[13.5px] text-text" : "text-[13.5px] text-text-muted"}
              >
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="mt-3 border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3.5">
        {canSend && (
          <>
            <Button size="lg" onClick={onSubmit} disabled={submitting || !ready}>
              {submitting ? "Sending…" : "Send application"}
              <Send className="h-4 w-4" aria-hidden />
            </Button>
            <span
              className={`font-mono text-[9.5px] uppercase tracking-[0.14em] ${
                !ready ? "text-text-faint" : advice ? "text-warning" : "text-accent"
              }`}
            >
              {!ready
                ? blocker?.text
                : advice
                  ? "You can send it, but it will almost certainly be declined"
                  : "Ready · a human reads it next"}
            </span>
          </>
        )}

        {profile.status === "PENDING" && (
          <Button variant="outline" onClick={onWithdraw} disabled={withdrawing}>
            {withdrawing ? "Withdrawing…" : "Withdraw and keep editing"}
          </Button>
        )}

        {profile.status === "APPROVED" && profile.slug && (
          <Button asChild variant="secondary">
            <Link href={`/coaches/${profile.slug}`}>
              View your public profile
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        )}
      </div>
    </HudPanel>
  );
}

function statusTone(status: OwnCoachProfile["status"]): PanelTone {
  if (status === "APPROVED") return "accent";
  if (status === "REJECTED" || status === "SUSPENDED") return "warn";
  return "default";
}

function statusChip(status: OwnCoachProfile["status"]): ChipTone {
  switch (status) {
    case "APPROVED":
      return "good";
    case "PENDING":
      return "warn";
    case "REJECTED":
    case "SUSPENDED":
      return "bad";
    default:
      return "neutral";
  }
}

function statusLabel(status: OwnCoachProfile["status"]): string {
  switch (status) {
    case "APPROVED":
      return "Live";
    case "PENDING":
      return "In review";
    case "REJECTED":
      return "Declined";
    case "SUSPENDED":
      return "Suspended";
    default:
      return "Draft";
  }
}

function describe(profile: OwnCoachProfile): string {
  switch (profile.status) {
    case "APPROVED":
      return "You are listed. Students can find and book you.";
    case "PENDING":
      return "Sent. A human reads it against your checked rank. Your profile is locked while somebody has it — withdraw to keep editing.";
    case "REJECTED":
      return "Not accepted this time. You have the reason in writing below; change what it says and send it again.";
    case "SUSPENDED":
      return "Your profile has been taken down. Bookings already made still run their course.";
    default:
      return "Nothing here is public until it has been reviewed.";
  }
}
