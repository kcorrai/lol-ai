"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api/fetcher";
import type { CheckableAccount, RankBadge } from "@/domains/marketplace";

const KEY = ["marketplace", "coach-rank"];

interface RankData {
  badge: RankBadge | null;
  accounts: CheckableAccount[];
}

export function useCoachRank() {
  const { status } = useSession();
  return useQuery<RankData>({
    queryKey: KEY,
    queryFn: () => apiFetch<RankData>("/api/coaches/me/rank"),
    enabled: status === "authenticated",
    staleTime: 60_000,
  });
}

export function useCheckRank() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (riotAccountId: string) =>
      apiFetch<{ badge: RankBadge }>("/api/coaches/me/rank", {
        method: "POST",
        body: JSON.stringify({ riotAccountId }),
      }),
    // The badge shows on the profile panel too, so both queries move together.
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      void qc.invalidateQueries({ queryKey: ["marketplace", "coach-profile"] });
    },
  });
}
