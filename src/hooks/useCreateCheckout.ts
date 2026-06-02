"use client";

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";

export function useCreateCheckout() {
  return useMutation<{ url: string }, Error>({
    mutationFn: () =>
      apiFetch("/api/stripe/create-checkout", { method: "POST" }),
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
  });
}
