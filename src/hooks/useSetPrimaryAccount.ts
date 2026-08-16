"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import { useUIStore } from "@/lib/stores/uiStore";

export function useSetPrimaryAccount() {
  const queryClient = useQueryClient();
  const setActiveRiotAccountId = useUIStore((s) => s.setActiveRiotAccountId);

  return useMutation<{ primary: boolean }, Error, string>({
    mutationFn: (riotAccountId) =>
      apiFetch(`/api/riot/${riotAccountId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "set_primary" }),
      }),
    onSuccess: (_result, riotAccountId) => {
      queryClient.invalidateQueries({ queryKey: ["riot-accounts"] });
      // The selector seeds the store from the primary account only while nothing is selected, so
      // once a value is persisted the flag alone no longer moves the app. Making an account
      // primary is an explicit statement about which one to show; without this the dashboard keeps
      // rendering the previous account and the button looks inert.
      setActiveRiotAccountId(riotAccountId);
    },
  });
}
