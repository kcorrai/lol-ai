"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Shield, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

async function joinTeam(token: string): Promise<{ teamId: string }> {
  const res = await fetch(`/api/join/${token}`, { method: "POST" });
  if (!res.ok) {
    const body = (await res.json()) as { error?: { message?: string } };
    throw new Error(body.error?.message ?? "Katılma başarısız");
  }
  const body = (await res.json()) as { data: { teamId: string } };
  return body.data;
}

export default function JoinPage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();
  const { status } = useSession();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "unauthenticated") {
    router.push(`/login?callbackUrl=/join/${token}`);
    return null;
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    );
  }

  async function handleJoin() {
    setIsPending(true);
    setError(null);
    try {
      const { teamId } = await joinTeam(token);
      router.push(`/teams/${teamId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Katılma başarısız");
      setIsPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 ring-1 ring-blue-500/30">
            <Shield className="h-7 w-7 text-blue-400" />
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-xl font-bold text-text">Takıma Katıl</h1>
          <p className="text-sm text-text-muted">Davet linki ile takıma katılıyorsunuz.</p>
        </div>

        <div className="flex items-center justify-center gap-2 rounded-lg bg-surface-2 px-4 py-3 text-xs text-text-muted">
          <Users className="h-3.5 w-3.5" />
          Üye rolü ile katılacaksınız
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button onClick={handleJoin} disabled={isPending} className="w-full gap-2">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Takıma Katıl
        </Button>
      </div>
    </div>
  );
}
