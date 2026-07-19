"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { OtpRecommendation } from "@/domains/otp/services/otpRecommendationService";

interface OtpRecommendationsResponse {
  recommendations: OtpRecommendation[];
}

// Data-driven OTP champion recommendations from the user's own ranked stats (TASK-235).
export function useOtpRecommendations(riotAccountId: string | null | undefined) {
  return useQuery<OtpRecommendationsResponse>({
    queryKey: ["otp-recommendations", riotAccountId],
    queryFn: () => apiFetch<OtpRecommendationsResponse>(`/api/otp/recommendations?riotAccountId=${riotAccountId}`),
    enabled: !!riotAccountId,
    staleTime: 5 * 60_000,
  });
}
