"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const storageKey = (code: string): string => `draft:${code}`;

/**
 * The caller's seat in a draft.
 *
 * A drafter link carries its token as `?as=…`. Claiming it moves the token into
 * `sessionStorage` and strips it back out of the URL, for two reasons: a refresh
 * must not drop the seat, and a screenshot or a stream overlay must not put a
 * drafter token on camera.
 */
export function useDraftToken(code: string): {
  token: string | null;
  ready: boolean;
  clear: () => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const claimed = params.get("as");

  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (claimed) {
      window.sessionStorage.setItem(storageKey(code), claimed);
      setToken(claimed);
      setReady(true);

      const next = new URLSearchParams(params.toString());
      next.delete("as");
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      return;
    }

    setToken(window.sessionStorage.getItem(storageKey(code)));
    setReady(true);
  }, [claimed, code, params, pathname, router]);

  const clear = useCallback(() => {
    window.sessionStorage.removeItem(storageKey(code));
    setToken(null);
  }, [code]);

  return { token, ready, clear };
}
