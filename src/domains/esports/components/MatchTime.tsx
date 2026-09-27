"use client";

import { useEffect, useState } from "react";
import { formatDate, formatTime } from "@/lib/uiLocale";
import { useEsportsPrefsStore } from "@/lib/stores/esportsPrefsStore";

interface MatchTimeProps {
  /** ISO 8601 kickoff, as published (UTC). */
  startTime: string;
  /** Include the weekday and date, not just the clock. */
  withDate?: boolean;
  className?: string;
}

interface Parts {
  day: string | null;
  time: string;
}

function formatUtc(iso: string, withDate: boolean): Parts {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { day: null, time: "" };
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return {
    day: withDate
      ? formatDate(date, {
          weekday: "short",
          day: "numeric",
          month: "short",
          timeZone: "UTC",
        })
      : null,
    time: `${hours}:${minutes} UTC`,
  };
}

/** In the zone the reader picked, or their browser's own when they have not. */
function formatLocal(iso: string, withDate: boolean, timeZone: string | null): Parts {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { day: null, time: "" };
  const zone = timeZone ? { timeZone } : {};
  return {
    day: withDate
      ? formatDate(date, { weekday: "short", day: "numeric", month: "short", ...zone })
      : null,
    time: formatTime(date, { hour: "2-digit", minute: "2-digit", ...zone }),
  };
}

/**
 * Kickoff time, in the reader's own zone.
 *
 * The server has no way to know that zone, so it renders UTC and the client
 * swaps to local after mount. Formatting during render instead would produce
 * markup that differs between server and client — a hydration mismatch on every
 * match row on the page.
 */
export function MatchTime({
  startTime,
  withDate = false,
  className = "",
}: MatchTimeProps): React.ReactElement {
  const timeZone = useEsportsPrefsStore((state) => state.timeZone);
  const [parts, setParts] = useState(() => formatUtc(startTime, withDate));

  useEffect(() => {
    setParts(formatLocal(startTime, withDate, timeZone));
  }, [startTime, withDate, timeZone]);

  return (
    <time dateTime={startTime} className={className}>
      {/* Day and time stack rather than sharing a separator: in a narrow column
          the joined form wraps and leaves a dangling "·" at the end of a line. */}
      {parts.day && <span className="block">{parts.day}</span>}
      <span className="block">{parts.time}</span>
    </time>
  );
}
