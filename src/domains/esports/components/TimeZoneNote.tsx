"use client";

import { useEsportsPrefsStore } from "@/lib/stores/esportsPrefsStore";
import { timeZoneLabel } from "@/domains/esports/timeZones";

/** "Times in your zone", or the zone the reader pinned in the tab row. */
export function TimeZoneNote({ className = "" }: { className?: string }): React.ReactElement {
  const timeZone = useEsportsPrefsStore((state) => state.timeZone);
  return <span className={className}>Times in {timeZoneLabel(timeZone)}</span>;
}
