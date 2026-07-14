"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type State = "idle" | "loading" | "success" | "error" | "no-token";

function TeamJoinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [state, setState] = useState<State>(token ? "idle" : "no-token");
  const [teamName, setTeamName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (state !== "idle" || !token) return;

    setState("loading");
    fetch(`/api/teams/invites/${token}/accept`, { method: "POST" })
      .then(async (res) => {
        const body = await res.json() as {
          data?: { teamId: string; teamName: string };
          error?: { message?: string };
        };
        if (!res.ok) throw new Error(body.error?.message ?? "Failed to accept invite");
        setTeamName(body.data?.teamName ?? null);
        setState("success");
        setTimeout(() => router.push(`/teams/${body.data?.teamId ?? ""}`), 2500);
      })
      .catch((err: unknown) => {
        setErrorMsg(err instanceof Error ? err.message : "An error occurred");
        setState("error");
      });
  }, [state, token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 text-center">
        <p className="mb-2 text-2xl font-bold text-accent">⚡ LoL AI Coach</p>

        {state === "no-token" && (
          <>
            <p className="mt-4 text-text">Invalid invite link.</p>
            <Link href="/dashboard">
              <Button className="mt-6">Go to Home</Button>
            </Link>
          </>
        )}

        {state === "idle" || state === "loading" ? (
          <>
            <p className="mt-4 text-text">Accepting invite…</p>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-accent" />
            </div>
          </>
        ) : null}

        {state === "success" && (
          <>
            <p className="mt-4 text-lg font-semibold text-success">You&apos;ve joined the team!</p>
            {teamName && (
              <p className="mt-1 text-sm text-text-muted">
                You&apos;re now a member of the <strong className="text-text">{teamName}</strong> team.
              </p>
            )}
            <p className="mt-3 text-xs text-text-muted">Redirecting to team dashboard…</p>
          </>
        )}

        {state === "error" && (
          <>
            <p className="mt-4 text-sm text-danger">{errorMsg}</p>
            <div className="mt-6 flex gap-3">
              <Link href="/dashboard" className="flex-1">
                <Button variant="outline" className="w-full">Home</Button>
              </Link>
              <Link href="/teams" className="flex-1">
                <Button className="w-full">My Teams</Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function TeamJoinPage() {
  return (
    <Suspense>
      <TeamJoinContent />
    </Suspense>
  );
}
