"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Laptop, TriangleAlert } from "lucide-react";
import type { PendingPairingRequest } from "@/domains/desktop/contract";
import { formatTime } from "@/lib/uiLocale";
import {
  useApproveDesktopPairing,
  useDesktopPairingRequest,
} from "@/hooks/useDesktopPairingRequest";

const PLATFORM_NAMES: Record<PendingPairingRequest["platform"], string> = {
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
};

function Shell({ children }: { children: React.ReactNode }): React.ReactElement {
  return <div className="mx-auto max-w-lg space-y-6 p-6">{children}</div>;
}

function Notice({
  tone,
  heading,
  body,
}: {
  tone: "warning" | "success";
  heading: string;
  body: string;
}): React.ReactElement {
  const success = tone === "success";
  return (
    <div
      className={`flex items-start gap-4 rounded-xl border p-5 ${
        success ? "border-success/40 bg-success/5" : "border-warning/40 bg-warning/5"
      }`}
    >
      {success ? (
        <Check className="mt-0.5 h-5 w-5 shrink-0 text-success" strokeWidth={2} />
      ) : (
        <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" strokeWidth={1.75} />
      )}
      <div>
        <p className="text-sm font-semibold text-text">{heading}</p>
        <p className="mt-1 text-sm text-text-body">{body}</p>
      </div>
    </div>
  );
}

/**
 * Approving a machine that asked to be paired (ADR-048).
 *
 * The page the desktop app sends the browser to. It is a decision, so it is written
 * as one: what asked, when it asked, what saying yes grants, and one button. There
 * is no automatic approval on arrival — a link that pairs a machine by being opened
 * is a link that can be sent to someone.
 *
 * What it shows about the machine comes from the machine, and the page says so. A
 * hostname is not an identity, and the player is the one being asked to judge whether
 * this is the computer in front of them.
 */
export default function ApproveDesktopPairingPage(): React.ReactElement {
  const params = useSearchParams();
  const requestId = params.get("request");

  const request = useDesktopPairingRequest(requestId);
  const approve = useApproveDesktopPairing();

  if (!requestId) {
    return (
      <Shell>
        <Notice
          tone="warning"
          heading="Nothing to approve"
          body="This page opens from the desktop app. Press “Pair this machine” there and it will bring you back here."
        />
      </Shell>
    );
  }

  if (request.isPending) {
    return (
      <Shell>
        <div className="h-32 animate-pulse rounded-xl border border-border bg-surface" />
      </Shell>
    );
  }

  if (request.isError || !request.data) {
    return (
      <Shell>
        <Notice
          tone="warning"
          heading="That request could not be found"
          body="It may have expired — they last ten minutes. Press the button in the app again and it will open a fresh one."
        />
        <BackLink />
      </Shell>
    );
  }

  const asked = request.data;
  const approved = approve.isSuccess || asked.status === "approved";

  if (approved) {
    return (
      <Shell>
        <Notice
          tone="success"
          heading="Approved"
          body="The app is picking up its token now — it should show your account within a few seconds. You can close this tab."
        />
        <BackLink />
      </Shell>
    );
  }

  if (asked.status === "expired") {
    return (
      <Shell>
        <Notice
          tone="warning"
          heading="This request has expired"
          body="Requests last ten minutes. Press “Pair this machine” in the app again."
        />
        <BackLink />
      </Shell>
    );
  }

  return (
    <Shell>
      <div>
        <h1 className="font-display text-2xl font-bold text-text">Approve this machine?</h1>
        <p className="mt-1 text-sm text-text-muted">
          A copy of the desktop app has asked to read your account.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 ring-1 ring-accent/30">
            <Laptop className="h-5 w-5 text-accent" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text">{asked.label}</p>
            <p className="text-xs text-text-muted">
              {PLATFORM_NAMES[asked.platform]}
              {asked.appVersion ? ` · v${asked.appVersion}` : ""} ·{" "}
              {formatTime(asked.requestedAt)}
            </p>
          </div>
        </div>

        {/* Said out loud because it is the whole basis of the decision: this is the
            machine's account of itself, and the only thing that can check it is the
            player looking at the computer in front of them. */}
        <p className="text-xs text-text-muted">
          That name is what the machine calls itself. Approve it only if it is the computer you
          just pressed the button on.
        </p>

        <div className="rounded-lg border border-border bg-surface-2 p-4">
          <p className="text-xs font-semibold uppercase tracking-label text-text-muted">
            Approving lets it
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-text-body">
            <li>· Read your matches, reports and champion history</li>
            <li>· Tell this site when a game of yours has ended</li>
          </ul>
          <p className="mt-3 text-xs text-text-muted">
            It never receives your password, and revoking the device on this page cuts it off
            straight away.
          </p>
        </div>

        {approve.isError && (
          <p className="text-sm text-danger">{(approve.error as Error).message}</p>
        )}

        <button
          type="button"
          onClick={() => approve.mutate(asked.requestId)}
          disabled={approve.isPending}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent font-display text-sm font-bold uppercase tracking-[0.08em] text-background transition-colors hover:bg-acid-400 disabled:opacity-60"
        >
          {approve.isPending ? "Approving…" : "Approve this machine"}
        </button>
      </div>

      <p className="text-[11px] text-text-muted">
        Did not press anything? Close this tab. Nothing is granted until you approve, and the
        request expires on its own.
      </p>
    </Shell>
  );
}

function BackLink(): React.ReactElement {
  return (
    <Link href="/settings/desktop" className="inline-block text-sm text-accent hover:underline">
      Back to desktop settings
    </Link>
  );
}
