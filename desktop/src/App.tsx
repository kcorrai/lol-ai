import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppFrame } from "@/components/layout/AppFrame";
import type { ConnectionState } from "@/components/layout/StatusChip";
import { ChampionsScreen } from "@/screens/ChampionsScreen";
import { GameScreen } from "@/screens/GameScreen";
import { PairingScreen } from "@/screens/PairingScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";
import { installApiBridge } from "@/lib/apiBridge";
import { navigate, useRoute } from "@/lib/router";
import { matchRoute } from "@/routes";
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
  const route = matchRoute(path);
  const Lifted = route?.Component;

  return (
    <QueryClientProvider client={queryClient}>
      <AppFrame
        active={route?.path ?? "/game"}
        onSelect={navigate}
        connection={CONNECTION[read.status] ?? "idle"}
      >
        {/* The native screens: the ones that exist because only a local process can read
            the game or hold the keychain. Everything else is the website's own. */}
        {path === "/game" ? <GameScreen read={read} /> : null}
        {path === "/champions" ? <ChampionsScreen /> : null}
        {path === "/pairing" ? <PairingScreen /> : null}
        {path === "/settings" ? <SettingsScreen /> : null}

        {Lifted ? (
          <Suspense fallback={<ScreenLoading />}>
            <Lifted />
          </Suspense>
        ) : null}

        {/* A fragment nothing answers. Reachable by hand-editing the address, and by a
            lifted component linking somewhere this app has not covered yet — which will be
            most of the website until the rest of ADR-043's phases land. */}
        {!route ? (
          <p className="text-sm text-text-muted">
            That screen is not in the desktop app yet. Open it on the website.
          </p>
        ) : null}
      </AppFrame>
    </QueryClientProvider>
  );
}
