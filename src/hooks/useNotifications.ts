"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api/fetcher";
import type { NotificationView } from "@/domains/marketplace";

const KEY = ["notifications"];

interface Data {
  notifications: NotificationView[];
  unread: number;
}

export function useNotifications() {
  const { status } = useSession();
  return useQuery<Data>({
    queryKey: KEY,
    queryFn: () => apiFetch<Data>("/api/notifications"),
    enabled: status === "authenticated",
    // A minute is fine. These are things somebody wants to find, not things
    // they need the instant they happen — the urgent ones are emails.
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ read: number }>("/api/notifications", { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
