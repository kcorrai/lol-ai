"use client";

import type { OverlayPayload, OverlayWidget as WidgetName } from "@/domains/creator/types";
import { ChampionsWidget } from "@/domains/creator/components/widgets/ChampionsWidget";
import { GoalWidget } from "@/domains/creator/components/widgets/GoalWidget";
import { LastGameWidget } from "@/domains/creator/components/widgets/LastGameWidget";
import { RankWidget } from "@/domains/creator/components/widgets/RankWidget";
import { SessionWidget } from "@/domains/creator/components/widgets/SessionWidget";

// One switch, so the OBS route and the dashboard preview render the same
// component from the same payload. The preview is not an iframe — the app sets
// `frame-ancestors 'none'`, which blocks even same-origin framing (ADR-026).

export function OverlayWidget({
  widget,
  payload,
}: {
  widget: WidgetName;
  payload: OverlayPayload;
}): JSX.Element {
  switch (widget) {
    case "rank":
      return <RankWidget payload={payload} />;
    case "session":
      return <SessionWidget payload={payload} />;
    case "lastgame":
      return <LastGameWidget payload={payload} />;
    case "champions":
      return <ChampionsWidget payload={payload} />;
    case "goal":
      return <GoalWidget payload={payload} />;
  }
}
