import { Suspense, useEffect, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppFrame } from "@/components/layout/AppFrame";
import { SetupFrame } from "@/components/layout/SetupFrame";
import type { ConnectionState } from "@/components/layout/StatusChip";
import { ChampionsScreen } from "@/screens/ChampionsScreen";
import { GameScreen } from "@/screens/GameScreen";
import { PairingScreen } from "@/screens/PairingScreen";
import { PregameScreen } from "@/screens/PregameScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";
import { installApiBridge } from "@/lib/apiBridge";
import { navigate, useRoute } from "@/lib/router";
import { needsSetup, usePairing } from "@/lib/usePairing";
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

  // A window reopened on an address this build no longer draws. Nothing can navigate to one
  // any more — `goTo` hands those to the browser — but the fragment outlives the build that
  // wrote it, and a player who last closed the app on `/builds` would come up to nothing.
  useEffect(() => {
    if (!rendersHere(path)) navigate("/game", { replace: true });
  }, [path]);

  const setup = needsSetup(pairing.state.status);

  // Pairing succeeded: the rail has just appeared, and what it opens on should be this
  // window's own home rather than whichever address the fragment was carrying from the last
  // session. The first screen after setup is the game — that is what the app is for.
  const wasSetup = useRef(setup);
  useEffect(() => {
    if (wasSetup.current && !setup) navigate("/game", { replace: true });
    wasSetup.current = setup;
  }, [setup]);

  // Neither frame yet. `usePairing` resolves over a round trip to the website, and drawing
  // either answer before it lands means drawing the wrong one for a moment: a paired
  // machine flashing a pairing form, or an unpaired one flashing fourteen rows it cannot
  // open. One quiet screen costs less than either.
  if (pairing.state.status === "loading") {
    return <SetupFrame title="LoL AI Coach" lede="Checking whether this machine is paired…" />;
  }

  if (setup) {
    return (
      <SetupFrame
        title="Set up this machine"
        lede="This window reads the game on this computer. Everything it says about your
          account — the lane read, the game plan, your own history — comes from your LoL AI
          Coach account, so it needs to know which one is yours."
      >
        <PairingScreen pairing={pairing} />
      </SetupFrame>
    );
  }

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
        {path === "/pregame" ? <PregameScreen /> : null}
        {path === "/champions" ? <ChampionsScreen /> : null}
        {path === "/pairing" ? <PairingScreen pairing={pairing} /> : null}
        {path === "/settings" ? <SettingsScreen /> : null}

        {Lifted ? (
          <Suspense fallback={<ScreenLoading />}>
            <Lifted />
          </Suspense>
        ) : null}
      </AppFrame>
    </QueryClientProvider>
  );
}
