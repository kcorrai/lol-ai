"use client";

import { useQuery } from "@tanstack/react-query";

interface FlagResult {
  enabled: boolean;
  variant: "control" | "treatment";
}

async function fetchFlags(keys: string[]): Promise<Record<string, FlagResult>> {
  const res = await fetch(`/api/feature-flags?keys=${keys.join(",")}`);
  if (!res.ok)
    return Object.fromEntries(
      keys.map((k) => [k, { enabled: false, variant: "control" as const }])
    );
  const json = (await res.json()) as { data: Record<string, FlagResult> };
  return json.data;
}

export function useFeatureFlag(key: string): FlagResult {
  const { data } = useQuery({
    queryKey: ["feature-flag", key],
    queryFn: () => fetchFlags([key]),
    staleTime: 5 * 60 * 1000, // flags rarely change mid-session
    gcTime: 10 * 60 * 1000,
  });

  return data?.[key] ?? { enabled: false, variant: "control" };
}

export function useFeatureFlags(keys: string[]): Record<string, FlagResult> {
  const stableKey = keys.slice().sort().join(",");
  const { data } = useQuery({
    queryKey: ["feature-flags", stableKey],
    queryFn: () => fetchFlags(keys),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return (
    data ??
    Object.fromEntries(keys.map((k) => [k, { enabled: false, variant: "control" as const }]))
  );
}
