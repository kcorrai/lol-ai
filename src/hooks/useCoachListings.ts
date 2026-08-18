"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api/fetcher";
import type { Listing, ListingPerformance } from "@/domains/marketplace";
import type { ListingBodyInput } from "@/domains/marketplace/listingSchema";

const KEY = ["marketplace", "coach-listings"];

export type OwnListing = Listing & {
  isActive: boolean;
  /** Null until the listing has been requested at least once. */
  performance: ListingPerformance | null;
};

export function useCoachListings() {
  const { status } = useSession();
  return useQuery<{ listings: OwnListing[] }>({
    queryKey: KEY,
    queryFn: () => apiFetch<{ listings: OwnListing[] }>("/api/coaches/me/listings"),
    enabled: status === "authenticated",
    staleTime: 30_000,
  });
}

export function useCreateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ListingBodyInput) =>
      apiFetch<{ listing: Listing }>("/api/coaches/me/listings", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: ListingBodyInput & { id: string }) =>
      apiFetch<{ listing: Listing }>(`/api/coaches/me/listings/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useSetListingActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiFetch<{ isActive: boolean }>(`/api/coaches/me/listings/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/api/coaches/me/listings/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
