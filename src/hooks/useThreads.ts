"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api/fetcher";
import type { ThreadSummary, ThreadView, MessageView } from "@/domains/marketplace";

const KEY = ["marketplace", "threads"];

export function useThreads() {
  const { status } = useSession();
  return useQuery<{ threads: ThreadSummary[] }>({
    queryKey: KEY,
    queryFn: () => apiFetch("/api/threads"),
    enabled: status === "authenticated",
    staleTime: 15_000,
  });
}

/**
 * One thread, polled while it is open.
 *
 * Five seconds, not a socket: the draft room settled this for the codebase
 * (ADR-016), and it is a fine answer to "has my coach replied".
 */
export function useThread(conversationId: string | null) {
  return useQuery<{ thread: ThreadView }>({
    queryKey: [...KEY, conversationId],
    queryFn: () => apiFetch(`/api/threads/${conversationId as string}`),
    enabled: Boolean(conversationId),
    refetchInterval: 5_000,
    staleTime: 2_000,
  });
}

export function useOpenThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (coachProfileId: string) =>
      apiFetch<{ conversationId: string }>("/api/threads", {
        method: "POST",
        body: JSON.stringify({ coachProfileId }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      apiFetch<{ message: MessageView; notice: string | null }>(`/api/threads/${conversationId}`, {
        method: "POST",
        body: JSON.stringify({ body }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
