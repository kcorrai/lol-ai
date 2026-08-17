"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api/fetcher";
import type { AvailabilityView, RuleInput, ExceptionInput } from "@/domains/marketplace";

const KEY = ["marketplace", "coach-availability"];

export function useCoachAvailability() {
  const { status } = useSession();
  return useQuery<AvailabilityView>({
    queryKey: KEY,
    queryFn: () => apiFetch<AvailabilityView>("/api/coaches/me/availability"),
    enabled: status === "authenticated",
    staleTime: 30_000,
  });
}

export function useSaveAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rules: RuleInput[]) =>
      apiFetch<AvailabilityView>("/api/coaches/me/availability", {
        method: "PUT",
        body: JSON.stringify({ rules }),
      }),
    // The response is the new state, so it seeds the cache directly rather than
    // provoking a second round trip for what we already have.
    onSuccess: (data) => qc.setQueryData(KEY, data),
  });
}

export function useSaveException() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ExceptionInput) =>
      apiFetch<AvailabilityView>("/api/coaches/me/availability/exceptions", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => qc.setQueryData(KEY, data),
  });
}

export function useDeleteException() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (date: string) =>
      apiFetch<AvailabilityView>(
        `/api/coaches/me/availability/exceptions?date=${encodeURIComponent(date)}`,
        { method: "DELETE" }
      ),
    onSuccess: (data) => qc.setQueryData(KEY, data),
  });
}
