"use client";

import { useEffect, useState } from "react";
import { formatDate, formatTime } from "@/lib/uiLocale";

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

function formatLocal(iso: string, withDate: boolean): Parts {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { day: null, time: "" };
  return {
    day: withDate ? formatDate(date, { weekday: "short", day: "numeric", month: "short" }) : null,
    time: formatTime(date, { hour: "2-digit", minute: "2-digit" }),
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
  const [parts, setParts] = useState(() => formatUtc(startTime, withDate));

  useEffect(() => {
    setParts(formatLocal(startTime, withDate));
  }, [startTime, withDate]);

  return (
    <time dateTime={startTime} className={className}>
      {/* Day and time stack rather than sharing a separator: in a narrow column
          the joined form wraps and leaves a dangling "·" at the end of a line. */}
      {parts.day && <span className="block">{parts.day}</span>}
      <span className="block">{parts.time}</span>
    </time>
  );
}
