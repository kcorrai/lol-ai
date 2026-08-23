"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Radio, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { apiFetch } from "@/lib/api/fetcher";
import { ALL_POSITIONS, POSITION_LABELS } from "@/domains/meta/positions";
import type { CanonicalPosition } from "@/domains/meta/types";

type Mode = "draft" | "matchup";

interface LiveGameResponse {
  inGame: boolean;
  yourSide?: "blue" | "red";
  draft?: {
    blue: Partial<Record<CanonicalPosition, string>>;
    red: Partial<Record<CanonicalPosition, string>>;
  };
  yourMatchup?: { champion: string; opponent: string; position: CanonicalPosition } | null;
}

const COPY: Record<Mode, { title: string; blurb: string; cta: string }> = {
  draft: {
    title: "In a game right now?",
    blurb: "Pull both teams from your live match instead of picking ten champions by hand.",
    cta: "Analyze my live game",
  },
  matchup: {
    title: "In a game right now?",
    blurb: "Load your own lane matchup straight from your live match.",
    cta: "Load my lane matchup",
  },
};

const encode = (team: Partial<Record<CanonicalPosition, string>>): string =>
  ALL_POSITIONS.map((pos) => team[pos] ?? "").join(",");

/**
 * Signed-in gate.
 *
 * The inner component uses React Query, and the tools layout only mounts QueryProvider for
 * signed-in visitors (TASK-237) — so the hook must not run for anonymous ones. Gating on
 * `useSession` rather than a server session also keeps these pages prerenderable (TASK-238).
 */
export function LiveGameButton({ mode }: { mode: Mode }) {
  const { status } = useSession();
  if (status !== "authenticated") return null;
  return <LiveGameButtonInner mode={mode} />;
}

function LiveGameButtonInner({ mode }: { mode: Mode }) {
  const router = useRouter();
  const { data: accounts } = useRiotAccounts();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const accountId = accounts?.find((a) => a.isPrimary)?.id ?? accounts?.[0]?.id ?? null;
  if (!accountId) return null;

  async function load() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await apiFetch<LiveGameResponse>(
        `/api/riot/live-game?riotAccountId=${accountId}`
      );
      if (!res.inGame) {
        setMessage("You're not in a game right now. Start one and try again.");
        return;
      }

      if (mode === "matchup") {
        if (!res.yourMatchup) {
          setMessage(
            "Found your game, but couldn't work out your lane opponent. Pick the two champions below."
          );
          return;
        }
        const { champion, opponent, position } = res.yourMatchup;
        router.push(`/tools/matchup?a=${champion}&b=${opponent}&role=${position}`);
        setMessage(
          `Loaded ${champion} vs ${opponent} in ${POSITION_LABELS[position]} — we guessed the lane, change it if that's not your matchup.`
        );
        return;
      }

      if (!res.draft) {
        setMessage("Found your game, but couldn't read the teams. Try again in a moment.");
        return;
      }
      const params = new URLSearchParams({
        blue: encode(res.draft.blue),
        red: encode(res.draft.red),
      });
      router.push(`/tools/draft-analyzer?${params}`);
      setMessage(
        `Loaded your live game — you're on ${res.yourSide === "red" ? "red" : "blue"}. Lanes are a best guess, correct any that are wrong.`
      );
    } catch {
      setMessage("Couldn't reach the live game right now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  const copy = COPY[mode];

  return (
    <div className="mb-6 rounded-xl border border-border bg-surface/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-text">
            <Radio className="h-4 w-4 text-accent" />
            {copy.title}
          </p>
          <p className="mt-1 text-xs text-text-muted">{copy.blurb}</p>
        </div>
        <Button size="sm" onClick={load} disabled={loading} className="shrink-0 gap-1.5">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Checking…" : copy.cta}
        </Button>
      </div>
      {message && <p className="mt-3 text-xs text-text-muted">{message}</p>}
    </div>
  );
}
