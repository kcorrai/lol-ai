"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FetchError } from "@/lib/api/fetcher";

interface GenerateReportParams {
  riotAccountId: string;
  reportType: "session_review" | "champion_focus" | "climb_roadmap";
  matchIds: string[];
  focusArea?: string;
}

interface GenerateReportResult {
  reportId: string;
  status: string;
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: number;
}

interface UseGenerateReportOptions {
  onError?: (err: Error) => void;
}

interface MutateOptions {
  onSuccess?: (data: GenerateReportResult) => void;
  onError?: (err: Error) => void;
}

interface UseGenerateReportReturn {
  mutate: (params: GenerateReportParams, options?: MutateOptions) => void;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  rateLimit: RateLimitInfo | null;
  retryAfterSeconds: number | null;
}

export function useGenerateReport(options?: UseGenerateReportOptions): UseGenerateReportReturn {
  const queryClient = useQueryClient();
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null);

  const mutation = useMutation<GenerateReportResult, Error, GenerateReportParams>({
    mutationFn: async (params) => {
      const res = await fetch("/api/coaching/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      // Read rate limit headers from every response
      const limit = res.headers.get("X-RateLimit-Limit");
      const remaining = res.headers.get("X-RateLimit-Remaining");
      const reset = res.headers.get("X-RateLimit-Reset");
      if (limit && remaining && reset) {
        setRateLimit({ limit: Number(limit), remaining: Number(remaining), resetAt: Number(reset) });
      }

      if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After");
        setRetryAfterSeconds(retryAfter ? Number(retryAfter) : 60);
        const json = await res.json().catch(() => null) as { error?: { message?: string; code?: string } } | null;
        const message = json?.error?.message ?? "Too many requests. Please try again later.";
        throw new FetchError(message, 429, json?.error?.code);
      }

      if (!res.ok) {
        const json = await res.json().catch(() => null) as { error?: { message?: string; code?: string } } | null;
        const message = json?.error?.message ?? "Request failed";
        throw new FetchError(message, res.status, json?.error?.code);
      }

      setRetryAfterSeconds(null);
      const json = await res.json() as { data: GenerateReportResult };
      return json.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["coaching-reports", variables.riotAccountId],
      });
    },
    onError: options?.onError,
  });

  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    rateLimit,
    retryAfterSeconds,
  };
}
