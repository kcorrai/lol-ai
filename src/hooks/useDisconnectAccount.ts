"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";

export function useDisconnectAccount() {
  const queryClient = useQueryClient();

  return useMutation<{ disconnected: boolean }, Error, string>({
    mutationFn: (riotAccountId) => apiFetch(`/api/riot/${riotAccountId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["riot-accounts"] });
    },
  });
}
