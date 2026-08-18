"use client";

import { useState } from "react";
import { Check, ShieldAlert, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { regionLabel } from "@/lib/riot/regions";
import { tierColorClass } from "@/lib/riot/rankDisplay";
import { MIN_BIO_LENGTH } from "@/domains/marketplace/policy";
import type { ApplicationRow } from "@/domains/marketplace";
import { languageLabel, roleLabel } from "@/domains/marketplace/components/options";

type Decision = "approve" | "reject" | "suspend" | "reinstate";

interface Props {
  application: ApplicationRow;
  /** Which decisions this queue offers. Driven by the tab, not by the card. */
  decisions: Decision[];
  pending: boolean;
  onDecide: (decision: Decision, note: string) => void;
}

const MIN_NOTE = 10;

/**
 * One application, with everything a reviewer decides on and nothing else.
 *
 * The rank proofs are the substance: a `PLATFORM_CHECKED` row is a rank we read
 * from Riot ourselves, so it is evidence. A profile with no proof at all is an
 * unverified claim, and the card is bordered amber and says so rather than
 * leaving the space blank — the whole marketplace rests on that distinction.
 */
export function ApplicationReviewCard({
  application,
  decisions,
  pending,
  onDecide,
}: Props): React.ReactElement {
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);

  const checked = application.rankProofs.find((p) => p.method !== "SELF_REPORTED") ?? null;
  const needsNote = decisions.some((d) => d !== "approve");

  const checks = [
    {
      text: checked
        ? `Linked account checked — ${checked.tier} ${checked.division}`
        : "No linked account — nothing here is evidence of anything",
      ok: Boolean(checked),
    },
    {
      text:
        application.bio.trim().length >= MIN_BIO_LENGTH
          ? "Bio describes what happens in a session"
          : "Bio is too short to judge",
      ok: application.bio.trim().length >= MIN_BIO_LENGTH,
    },
    {
      text:
        application.roles.length > 0 && application.regions.length > 0
          ? "Roles and regions picked"
          : "Roles or regions missing",
      ok: application.roles.length > 0 && application.regions.length > 0,
    },
  ];

  function decide(decision: Decision): void {
    if (decision !== "approve" && note.trim().length < MIN_NOTE) {
      setNoteError(`Write at least ${MIN_NOTE} characters saying why.`);
      return;
    }
    setNoteError(null);
    onDecide(decision, note.trim());
  }

  return (
    <section
      className={cn(
        "notch overflow-hidden border bg-surface",
        checked ? "border-border" : "border-warning"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line-1 p-5">
        <div className="min-w-0">
          <h3 className="font-display text-[19px] font-extrabold uppercase tracking-[0.03em] text-text">
            {application.displayName}
          </h3>
          <p className="mt-1.5 text-sm text-text-muted">{application.headline}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {application.roles.map((role) => (
              <Tag key={role} accent>
                {roleLabel(role)}
              </Tag>
            ))}
            {application.regions.map((region) => (
              <Tag key={region}>{regionLabel(region)}</Tag>
            ))}
            {application.languages.map((lang) => (
              <Tag key={lang}>{languageLabel(lang)}</Tag>
            ))}
          </div>
        </div>

        <div className="shrink-0 text-right font-mono text-[10px] uppercase tracking-[0.12em] text-text-faint">
          <p>{application.email ?? "no email"}</p>
          {application.submittedAt && (
            <p className="mt-1.5">{new Date(application.submittedAt).toLocaleDateString()}</p>
          )}
        </div>
      </div>

      {/* The deciding fact, given its own band. */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-3.5 border-b border-line-1 px-5 py-3",
          checked ? "bg-accent/10" : "bg-warning/10"
        )}
      >
        <span className={cn("flex items-center gap-2.5", checked ? "text-accent" : "text-warning")}>
          {checked ? (
            <ShieldCheck className="h-[17px] w-[17px]" aria-hidden />
          ) : (
            <ShieldAlert className="h-[17px] w-[17px]" aria-hidden />
          )}
          <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.18em]">
            {checked ? "Checked by LaneIQ" : "Unverified"}
          </span>
        </span>

        {checked ? (
          <>
            <span
              className={cn(
                "font-mono text-base font-bold tracking-[0.05em]",
                tierColorClass(checked.tier)
              )}
            >
              {checked.tier} {checked.division}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-faint">
              {checked.queueType} &middot; checked{" "}
              {new Date(checked.checkedAt).toLocaleDateString()}
            </span>
          </>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-warning">
            No rank we have checked &middot; nothing here is evidence of anything
          </span>
        )}
      </div>

      <div className="p-5">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-text-muted">
          {"// How they say they coach"}
        </p>
        <p className="mt-3 max-w-[70ch] whitespace-pre-wrap text-[14.5px] text-text-body">
          {application.bio}
        </p>

        <ul
          className={cn(
            "mt-4 grid gap-2.5 border-l-2 bg-surface-dark px-4 py-3.5",
            checked ? "border-accent" : "border-warning"
          )}
        >
          {checks.map((check) => (
            <li key={check.text} className="grid grid-cols-[16px_1fr] items-start gap-2.5">
              <span
                aria-hidden
                className={cn(
                  "mt-1.5 block h-[7px] w-[7px]",
                  check.ok ? "bg-accent" : "border border-warning"
                )}
              />
              <span className={cn("text-[13px]", check.ok ? "text-text" : "text-warning")}>
                {check.text}
              </span>
            </li>
          ))}
        </ul>

        {needsNote && (
          <label className="mt-4 grid gap-2">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-text-muted">
              Reason &middot; sent to the coach
            </span>
            <textarea
              id={`note-${application.id}`}
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="well w-full resize-y border border-line-2 bg-background px-3 py-2.5 text-sm text-text placeholder:text-text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="What would have to change."
            />
            {noteError && <p className="text-xs text-danger">{noteError}</p>}
          </label>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {decisions.includes("approve") && (
            <Button size="sm" disabled={pending} onClick={() => decide("approve")}>
              <Check className="h-4 w-4" aria-hidden />
              Approve
            </Button>
          )}
          {decisions.includes("reject") && (
            <Button
              size="sm"
              variant="destructive"
              disabled={pending}
              onClick={() => decide("reject")}
            >
              Decline
            </Button>
          )}
          {decisions.includes("suspend") && (
            <Button
              size="sm"
              variant="destructive"
              disabled={pending}
              onClick={() => decide("suspend")}
            >
              Suspend
            </Button>
          )}
          {decisions.includes("reinstate") && (
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => decide("reinstate")}
            >
              Reinstate
            </Button>
          )}
          {needsNote && (
            <span
              className={cn(
                "ml-auto font-mono text-[9.5px] uppercase tracking-[0.14em]",
                note.trim().length >= MIN_NOTE ? "text-accent" : "text-text-faint"
              )}
            >
              {note.trim().length >= MIN_NOTE
                ? "Ready · they get this in writing"
                : "A decline needs a reason they can act on"}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function Tag({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={cn(
        "tag-cut border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em]",
        accent
          ? "border-accent bg-accent/10 text-accent"
          : "border-line-2 bg-surface-dark text-text-muted"
      )}
    >
      {children}
    </span>
  );
}
