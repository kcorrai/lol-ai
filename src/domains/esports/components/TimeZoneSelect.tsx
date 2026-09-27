"use client";

import { Clock } from "lucide-react";
import { useEsportsPrefsStore } from "@/lib/stores/esportsPrefsStore";
import { TIME_ZONE_CHOICES } from "@/domains/esports/timeZones";

/**
 * Which zone kickoff times are shown in. Auto follows the browser, which is
 * right for nearly everyone; a named zone is for reading a schedule in the
 * time it is played or broadcast in.
 */
export function TimeZoneSelect(): React.ReactElement {
  const timeZone = useEsportsPrefsStore((state) => state.timeZone);
  const setTimeZone = useEsportsPrefsStore((state) => state.setTimeZone);

  return (
    <label className="inline-flex items-center gap-1.5 border border-border px-2 py-1 text-text-muted transition-colors focus-within:border-accent hover:text-text">
      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="sr-only">Show kickoff times in</span>
      <select
        value={timeZone ?? ""}
        onChange={(event) => setTimeZone(event.target.value || null)}
        className="cursor-pointer bg-transparent font-mono text-[11px] uppercase tracking-label text-current outline-none"
      >
        <option value="">Auto</option>
        {TIME_ZONE_CHOICES.map((choice) => (
          <option key={choice.zone} value={choice.zone}>
            {choice.label}
          </option>
        ))}
      </select>
    </label>
  );
}
