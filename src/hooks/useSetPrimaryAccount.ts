"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";

export function useSetPrimaryAccount() {
  const queryClient = useQueryClient();

  return useMutation<{ primary: boolean }, Error, string>({
    mutationFn: (riotAccountId) =>
      apiFetch(`/api/riot/${riotAccountId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "set_primary" }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["riot-accounts"] });
    },
  });
}
