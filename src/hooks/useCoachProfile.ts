"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api/fetcher";
import type { CoachProfileInput, OwnCoachProfile } from "@/domains/marketplace";

const KEY = ["marketplace", "coach-profile"];

interface OwnProfileData {
  /** Null when the user has never opened the application form. Not an error. */
  profile: OwnCoachProfile | null;
}

export function useOwnCoachProfile() {
  const { status } = useSession();
  return useQuery<OwnProfileData>({
    queryKey: KEY,
    queryFn: () => apiFetch<OwnProfileData>("/api/coaches/me"),
    enabled: status === "authenticated",
    staleTime: 60_000,
  });
}

export function useSaveCoachProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CoachProfileInput) =>
      apiFetch<OwnProfileData>("/api/coaches/me", {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useSubmitApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<{ submitted: boolean }>("/api/coaches/me/apply", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useWithdrawApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<{ withdrawn: boolean }>("/api/coaches/me/apply", { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/**
 * The console's "taking students" switch.
 *
 * Its own mutation rather than a PUT of the whole profile: sending every field
 * back to flip one boolean would be refused outright while an application is
 * under review, which is not what pausing your books should mean.
 */
export function useSetAcceptingStudents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (acceptingStudents: boolean) =>
      apiFetch<OwnProfileData>("/api/coaches/me", {
        method: "PATCH",
        body: JSON.stringify({ acceptingStudents }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
