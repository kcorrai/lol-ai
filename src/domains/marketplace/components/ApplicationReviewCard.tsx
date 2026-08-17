"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { regionLabel } from "@/lib/riot/regions";
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
 * unverified claim, and the card says so rather than leaving the space blank.
 */
export function ApplicationReviewCard({
  application,
  decisions,
  pending,
  onDecide,
}: Props): React.ReactElement {
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);

  function decide(decision: Decision): void {
    if (decision !== "approve" && note.trim().length < MIN_NOTE) {
      setNoteError(`Write at least ${MIN_NOTE} characters saying why.`);
      return;
    }
    setNoteError(null);
    onDecide(decision, note.trim());
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{application.displayName}</CardTitle>
            <p className="mt-1 text-sm text-text-muted">{application.headline}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs text-text-faint">{application.email ?? "no email"}</p>
            {application.submittedAt && (
              <p className="font-mono text-xs text-text-faint">
                {new Date(application.submittedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {application.roles.map((role) => (
            <Badge key={role} variant="secondary">
              {roleLabel(role)}
            </Badge>
          ))}
          {application.regions.map((region) => (
            <Badge key={region} variant="outline">
              {regionLabel(region)}
            </Badge>
          ))}
          {application.languages.map((lang) => (
            <Badge key={lang} variant="outline">
              {languageLabel(lang)}
            </Badge>
          ))}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Rank</p>
          {application.rankProofs.length === 0 ? (
            <p className="mt-1 text-sm text-warning">
              No rank we have checked. Nothing here is evidence of anything.
            </p>
          ) : (
            <ul className="mt-1 space-y-1">
              {application.rankProofs.map((proof) => (
                <li key={proof.queueType} className="flex items-center gap-2 text-sm text-text-body">
                  <Badge variant={proof.method === "SELF_REPORTED" ? "warning" : "success"}>
                    {proof.method === "SELF_REPORTED" ? "Self-reported" : "Checked"}
                  </Badge>
                  <span className="font-mono">
                    {proof.tier} {proof.division}
                  </span>
                  <span className="text-text-faint">
                    {proof.queueType} · {new Date(proof.checkedAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">How they coach</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-text-body">{application.bio}</p>
        </div>

        {decisions.some((d) => d !== "approve") && (
          <div className="space-y-1">
            <label htmlFor={`note-${application.id}`} className="text-sm text-text-muted">
              Reason (sent to the coach)
            </label>
            <textarea
              id={`note-${application.id}`}
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="What would have to change."
            />
            {noteError && <p className="text-xs text-danger">{noteError}</p>}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {decisions.includes("approve") && (
            <Button disabled={pending} onClick={() => decide("approve")}>
              Approve
            </Button>
          )}
          {decisions.includes("reject") && (
            <Button variant="destructive" disabled={pending} onClick={() => decide("reject")}>
              Decline
            </Button>
          )}
          {decisions.includes("suspend") && (
            <Button variant="destructive" disabled={pending} onClick={() => decide("suspend")}>
              Suspend
            </Button>
          )}
          {decisions.includes("reinstate") && (
            <Button variant="secondary" disabled={pending} onClick={() => decide("reinstate")}>
              Reinstate
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
