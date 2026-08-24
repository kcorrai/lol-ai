import { useQuery } from "@tanstack/react-query";
import { clearPairing, readPairing } from "@/lib/pairing";

/**
 * `next-auth/react`, for the handful of website components that ask who is signed in
 * (ADR-043).
 *
 * There is no session here and there never will be — ADR-038 is explicit that this app
 * holds a device token and not a web session cookie. What it does have is a pairing, and a
 * pairing names the account it belongs to, which is all `useSession` is ever asked for.
 *
 * Read through React Query so a screen with three components asking makes one IPC call,
 * and shares it with anything else already holding the answer.
 */

export const PAIRED_ACCOUNT_KEY = ["desktop", "paired-account"] as const;

export interface Session {
  user: {
    id: string;
    email: string | null;
    name: string | null;
    /** ISO 8601, or null. Carried on the pairing since ADR-043 so the banner can read it. */
    emailVerified: string | null;
  };
}

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

/**
 * A discriminated union, as next-auth's own is.
 *
 * The website leans on that: `if (status !== "authenticated" || session.user.x)` is only
 * type-safe because "authenticated" narrows `data` to non-null. A plain `Session | null`
 * would compile here and fail there, on the components this app is trying not to edit.
 */
export type SessionContextValue =
  | { data: Session; status: "authenticated"; update: () => Promise<Session | null> }
  | { data: null; status: "loading" | "unauthenticated"; update: () => Promise<Session | null> };

export function useSession(): SessionContextValue {
  const query = useQuery({
    queryKey: PAIRED_ACCOUNT_KEY,
    queryFn: async (): Promise<Session | null> => {
      const pairing = await readPairing();
      if (!pairing) return null;
      const { userId, email, name, emailVerified } = pairing.account;
      return {
        user: {
          id: userId,
          email: email ?? null,
          name: name ?? null,
          emailVerified: emailVerified ?? null,
        },
      };
    },
    staleTime: 60_000,
  });

  const update = async (): Promise<Session | null> => (await query.refetch()).data ?? null;

  if (query.data) return { data: query.data, status: "authenticated", update };
  return { data: null, status: query.isPending ? "loading" : "unauthenticated", update };
}

/**
 * Forgets the pairing on this machine.
 *
 * Not the same act as signing out of a browser, and deliberately so: there is no session
 * to end, so the nearest true thing is to drop the token. Revoking it for real is still
 * done on the website, which is what `PairingScreen` says.
 */
export async function signOut(_options?: { callbackUrl?: string }): Promise<void> {
  // `callbackUrl` is taken and ignored. On the website it is where the browser lands after
  // the session ends; here there is nowhere to land — the window stays open on the pairing
  // screen, which is the only thing an unpaired app can show.
  await clearPairing();
}

/** Signing in happens by pairing, on the Pairing screen. There is no form here to post to. */
export async function signIn(): Promise<never> {
  throw new Error("Pair this machine from the Pairing screen to sign in.");
}
