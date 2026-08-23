"use client";

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";

export function useCreateTeamCheckout() {
  return useMutation<{ url: string }, Error>({
    mutationFn: () => apiFetch("/api/lemonsqueezy/checkout/team", { method: "POST" }),
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
  });
}
