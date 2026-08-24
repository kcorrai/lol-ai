import { useState } from "react";
import { AppFrame } from "@/components/layout/AppFrame";
import type { ScreenId } from "@/components/layout/NavRail";
import type { ConnectionState } from "@/components/layout/StatusChip";
import { ChampionsScreen } from "@/screens/ChampionsScreen";
import { GameScreen } from "@/screens/GameScreen";
import { PairingScreen } from "@/screens/PairingScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";
import { useLiveGame } from "@/lib/useLiveGame";

const CONNECTION: Record<string, ConnectionState> = {
  ok: "live",
  "no-game": "idle",
  unreadable: "unreadable",
};

export function App(): React.ReactElement {
  const [screen, setScreen] = useState<ScreenId>("game");
  const read = useLiveGame();

  return (
    <AppFrame active={screen} onSelect={setScreen} connection={CONNECTION[read.status] ?? "idle"}>
      {screen === "game" ? <GameScreen read={read} /> : null}
      {screen === "champions" ? <ChampionsScreen /> : null}
      {screen === "pairing" ? <PairingScreen /> : null}
      {screen === "settings" ? <SettingsScreen /> : null}
    </AppFrame>
  );
}
