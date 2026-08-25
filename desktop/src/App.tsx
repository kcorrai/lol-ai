import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppFrame } from "@/components/layout/AppFrame";
import { OnTheWebsite } from "@/components/layout/OnTheWebsite";
import type { ConnectionState } from "@/components/layout/StatusChip";
import { ChampionsScreen } from "@/screens/ChampionsScreen";
import { GameScreen } from "@/screens/GameScreen";
import { PairingScreen } from "@/screens/PairingScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";
import { installApiBridge } from "@/lib/apiBridge";
import { navigate, useRoute } from "@/lib/router";
import { usePairing } from "@/lib/usePairing";
import { matchRoute, rendersHere } from "@/routes";
import { useLiveGame } from "@/lib/useLiveGame";

const CONNECTION: Record<string, ConnectionState> = {
  ok: "live",
  "no-game": "idle",
  unreadable: "unreadable",
};

// Installed before the first render, because a website hook that fires on mount would
// otherwise reach the real `fetch` and be refused by the content policy (ADR-043).
installApiBridge();

/**
 * The lifted screens are the website's own components and expect React Query to be there —
 * every data hook on the website is one. Retries are turned down from the default three:
 * these requests cross the IPC boundary to a core that already reports "not paired" and
 * "cannot reach the website" as answers rather than faults, and retrying those three times
 * only makes the window take longer to say so.
 */
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

/** What a lifted screen shows while its chunk is still arriving. */
function ScreenLoading(): React.ReactElement {
  return (
    <div className="grid gap-3" aria-busy>
      <div className="h-3 w-28 animate-pulse rounded bg-line-2" />
      <div className="h-40 w-full animate-pulse rounded bg-line-1" />
    </div>
  );
}

export function App(): React.ReactElement {
  const { path } = useRoute();
  const read = useLiveGame();
  // One handle, two readers: the chip in the top bar and the Pairing screen. Held here so
  // forgetting a device on that screen is the same event the chip sees.
  const pairing = usePairing();
  const route = matchRoute(path);
  const Lifted = route?.Component;

  return (
    <QueryClientProvider client={queryClient}>
      <AppFrame
        active={route?.path ?? "/game"}
        onSelect={navigate}
        connection={CONNECTION[read.status] ?? "idle"}
        pairing={pairing.state}
      >
        {/* The native screens: the ones that exist because only a local process can read
            the game or hold the keychain. Everything else is the website's own. */}
        {path === "/game" ? <GameScreen read={read} /> : null}
        {path === "/champions" ? <ChampionsScreen /> : null}
        {path === "/pairing" ? <PairingScreen pairing={pairing} /> : null}
        {path === "/settings" ? <SettingsScreen /> : null}

        {Lifted ? (
          <Suspense fallback={<ScreenLoading />}>
            <Lifted />
          </Suspense>
        ) : null}

        {/* Everything this window does not draw itself — most of the site, and it stays
            that way under ADR-044. Asked of `rendersHere` rather than of `route`, because a
            native screen answers for one address while its section covers a whole subtree:
            `/settings/accounts` belongs to Settings and is not Settings, and asking the
            weaker question left it blank. */}
        {!rendersHere(path) ? <OnTheWebsite path={path} /> : null}
      </AppFrame>
    </QueryClientProvider>
  );
}
