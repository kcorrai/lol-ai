"use client";

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";

export function useCreateCheckout(period: "monthly" | "annual" = "monthly") {
  return useMutation<{ url: string }, Error>({
    mutationFn: () =>
      apiFetch("/api/lemonsqueezy/checkout", { method: "POST", body: JSON.stringify({ period }) }),
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
  });
}
