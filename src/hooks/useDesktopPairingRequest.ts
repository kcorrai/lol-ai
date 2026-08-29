import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PendingPairingRequest } from "@/domains/desktop/contract";

// The browser's half of pairing without a code (ADR-048). The app's half never
// comes through here: it opens the request and claims the token from the Rust
// core, so the device token has no path into a browser at all.

const requestKey = (requestId: string): readonly unknown[] => ["desktop-pairing-request", requestId];

async function extractError(res: Response, fallback: string): Promise<never> {
  const json = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
  throw new Error(json?.error?.message ?? fallback);
}

async function fetchRequest(requestId: string): Promise<PendingPairingRequest> {
  const res = await fetch(`/api/desktop/pairing-request/${requestId}`);
  if (!res.ok) await extractError(res, "That pairing request could not be found");
  const json = (await res.json()) as { data: PendingPairingRequest };
  return json.data;
}

async function approve(requestId: string): Promise<void> {
  const res = await fetch(`/api/desktop/pairing-request/${requestId}/approve`, { method: "POST" });
  if (!res.ok) await extractError(res, "Could not approve that machine");
}

/**
 * What is being asked for.
 *
 * Not refetched on its own. The page is a decision, and a request that changed
 * under the player between reading it and pressing the button would change what
 * they agreed to; the approve call is the one that finds out whether it is still
 * open, and says so.
 */
export function useDesktopPairingRequest(requestId: string | null) {
  return useQuery({
    queryKey: requestKey(requestId ?? ""),
    queryFn: () => fetchRequest(requestId as string),
    enabled: requestId !== null,
    staleTime: Infinity,
    retry: false,
  });
}

export function useApproveDesktopPairing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: approve,
    onSuccess: (_data, requestId) => {
      void qc.invalidateQueries({ queryKey: requestKey(requestId) });
      // The machine appears in the device list the moment it is approved, and the
      // player may well be looking at that list on the next screen.
      void qc.invalidateQueries({ queryKey: ["desktop-devices"] });
    },
  });
}
