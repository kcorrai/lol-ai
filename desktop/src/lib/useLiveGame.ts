import { useEffect, useRef, useState } from "react";
import { nextDelayMs, readAllGameData, type LiveRead } from "./liveClient/client";
import { createLiveClientTransport } from "./liveClient/transport";
import type { AllGameData } from "./liveClient/schema";

/**
 * Polls the local game client, and stops when nobody is looking.
 *
 * The visibility check is not a micro-optimisation. This app's whole promise is that it
 * costs the player nothing while they are playing, and a minimised companion polling a
 * loopback port every second for a forty-minute game is exactly the kind of background
 * cost that gets a companion uninstalled.
 */
export function useLiveGame(): LiveRead<AllGameData> {
  const [read, setRead] = useState<LiveRead<AllGameData>>({ status: "no-game" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const transport = createLiveClientTransport();
    let cancelled = false;

    async function tick(): Promise<void> {
      if (cancelled) return;

      if (document.visibilityState === "hidden") {
        // Say nothing and look again later; the last reading stays on screen for whenever
        // the window comes back.
        timer.current = setTimeout(tick, nextDelayMs({ status: "no-game" }));
        return;
      }

      const next = await readAllGameData(transport);
      if (cancelled) return;
      setRead(next);
      timer.current = setTimeout(tick, nextDelayMs(next));
    }

    void tick();

    // Coming back to the window should refresh immediately rather than waiting out the
    // idle backoff the player never saw.
    function onVisible(): void {
      if (document.visibilityState !== "visible") return;
      if (timer.current) clearTimeout(timer.current);
      void tick();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return read;
}
