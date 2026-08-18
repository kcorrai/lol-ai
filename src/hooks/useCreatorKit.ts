"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api/fetcher";
import type { CreatorKit, CreatorSettings, OverlayPayload } from "@/domains/creator/types";

const KEY = ["creator", "kit"];

export function useCreatorKit() {
  const { status } = useSession();
  return useQuery<{ kit: CreatorKit | null }>({
    queryKey: KEY,
    queryFn: () => apiFetch<{ kit: CreatorKit | null }>("/api/creator/me"),
    enabled: status === "authenticated",
    staleTime: 15_000,
  });
}

export function useEnableCreatorKit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ kit: CreatorKit }>("/api/creator/me", { method: "POST" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useSaveCreatorSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: CreatorSettings) =>
      apiFetch<{ kit: CreatorKit }>("/api/creator/me", {
        method: "PUT",
        body: JSON.stringify(settings),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      // The preview reads the live payload, so a saved delay or a flipped
      // stream-safe toggle has to re-fetch it or the preview would contradict
      // the setting that was just saved.
      void qc.invalidateQueries({ queryKey: ["creator", "preview"] });
    },
  });
}

export function useRotateOverlayKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ kit: CreatorKit }>("/api/creator/me/key", { method: "POST" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["creator"] }),
  });
}

export function useResetCreatorSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (action: "start" | "clear") =>
      apiFetch<{ kit: CreatorKit }>("/api/creator/me/session", {
        method: "POST",
        body: JSON.stringify({ action }),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["creator"] }),
  });
}

/**
 * The payload the overlay itself would receive.
 *
 * The preview renders from this rather than from a fixture, so what the creator
 * sees in the dashboard is literally what OBS will draw — including the delay
 * and the redaction, which are applied server-side and cannot be simulated
 * client-side without duplicating them.
 */
export function useOverlayPreview(overlayKey: string | null) {
  return useQuery<OverlayPayload>({
    queryKey: ["creator", "preview", overlayKey],
    queryFn: () => apiFetch<OverlayPayload>(`/api/overlay/${overlayKey}`),
    enabled: Boolean(overlayKey),
    staleTime: 15_000,
  });
}
