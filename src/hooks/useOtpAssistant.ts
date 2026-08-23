"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { OtpAnalysis } from "@/domains/otp/types/otp.types";
import type { Position } from "@/types/common.types";

export function useOtpAssistant(champion: string | null, role: Position | null) {
  return useQuery<OtpAnalysis>({
    queryKey: ["otp", champion, role],
    queryFn: () => apiFetch<OtpAnalysis>(`/api/otp?champion=${champion}&role=${role}`),
    enabled: !!champion && !!role,
    staleTime: 1000 * 60 * 60 * 24 * 7,
    gcTime: 1000 * 60 * 60 * 24 * 14,
    retry: 1,
  });
}
