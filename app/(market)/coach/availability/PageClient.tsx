"use client";

import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import {
  useCoachAvailability,
  useSaveAvailability,
  useSaveException,
  useDeleteException,
} from "@/hooks/useCoachAvailability";
import { useBookings } from "@/hooks/useBookings";
import type { RuleInput } from "@/domains/marketplace";
import { cellKey, openHoursPerWeek } from "@/domains/marketplace/availabilityGrid";
import { WeeklyScheduleEditor } from "@/domains/marketplace/components/WeeklyScheduleEditor";
import { DateExceptionEditor } from "@/domains/marketplace/components/DateExceptionEditor";
import { MarketStat } from "@/domains/marketplace/components/hud/MarketStat";
import { HudPanel } from "@/domains/marketplace/components/hud/HudPanel";
import { ConsoleBreadcrumb } from "@/domains/marketplace/components/console/ConsoleBreadcrumb";
import { UI_LOCALE } from "@/lib/uiLocale";

const RULES = [
  "A slot disappears for everyone the moment one student takes it.",
  "Students see your hours in their timezone, never yours.",
  "An exception replaces that day entirely — it does not add hours.",
];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function CoachAvailabilityPage(): React.ReactElement {
  const { data, isLoading, isError, refetch } = useCoachAvailability();
  const { data: bookingData } = useBookings("coach");
  const saveRules = useSaveAvailability();
  const saveException = useSaveException();
  const removeException = useDeleteException();
  const [error, setError] = useState<string | null>(null);

  // Confirmed sessions inside the next week, mapped onto the grid so a coach
  // cannot close an hour they have already sold.
  const booked = useMemo(() => {
    const cells = new Set<string>();
    for (const booking of bookingData?.bookings ?? []) {
      if (booking.status !== "CONFIRMED" || !booking.startTime) continue;
      const start = new Date(booking.startTime);
      if (start.getTime() > Date.now() + WEEK_MS) continue;
      cells.add(cellKey(start.getDay(), start.getHours()));
    }
    return cells;
  }, [bookingData]);

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-[1240px] gap-4 px-5 pt-7 md:px-8">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-[1240px] px-5 pt-7 md:px-8">
        <ErrorState message="Could not load your availability." onRetry={() => void refetch()} />
      </div>
    );
  }

  async function handleSaveRules(rules: RuleInput[]): Promise<void> {
    await saveRules.mutateAsync(rules);
  }

  const rules = data.rules.map(({ days, startMinute, endMinute }) => ({
    days,
    startMinute,
    endMinute,
  }));
  const openHours = openHoursPerWeek(rules);

  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-16 pt-7 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <ConsoleBreadcrumb current="Availability" />
          <h1 className="mt-3.5 font-display text-[32px] font-black uppercase leading-none tracking-[0.02em] text-text md:text-[38px]">
            Availability
          </h1>
          <p className="mt-3 max-w-[60ch] text-[15px] text-text-body">
            When you can be booked. Students see these hours converted into their own timezone, and
            a slot disappears the moment somebody takes it.
          </p>
        </div>

        <div className="flex gap-6 pb-1">
          <MarketStat label="Open this week" value={String(openHours)} unit="h" />
          <MarketStat label="Booked" value={String(booked.size)} unit="hours" tone="accent" />
          <MarketStat label="Your clock" value={shortZone(data.timeZone)} />
        </div>
      </div>

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid min-w-0 gap-4">
          {error && (
            <p className="border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <WeeklyScheduleEditor
            initial={rules}
            timeZone={data.timeZone}
            booked={booked}
            saving={saveRules.isPending}
            onSave={handleSaveRules}
          />

          <DateExceptionEditor
            exceptions={data.exceptions}
            saving={saveException.isPending || removeException.isPending}
            onSave={(input) => {
              setError(null);
              saveException.mutate(input, {
                onError: (err) =>
                  setError(err instanceof Error ? err.message : "Could not save that date."),
              });
            }}
            onDelete={(date) => {
              setError(null);
              removeException.mutate(date, {
                onError: (err) =>
                  setError(err instanceof Error ? err.message : "Could not remove that date."),
              });
            }}
          />
        </div>

        <div className="grid gap-3.5 lg:sticky lg:top-20">
          <HudPanel label="What students see" className="bg-hero-fade">
            <p className="font-mono text-[22px] font-bold leading-none text-text">
              {openHours}h <span className="text-[13px] text-text-muted">a week</span>
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
              in {data.timeZone} &middot; {data.exceptions.length} exceptions ahead
            </p>
            <p className="mt-3 text-[13px] text-text-body">
              They pick from these hours in their own timezone, resolved per calendar day so 18:00
              stays 18:00 across a clock change. A booked slot vanishes for everyone else straight
              away.
            </p>
          </HudPanel>

          <HudPanel label="Rules">
            <ul className="grid gap-2.5">
              {RULES.map((rule) => (
                <li key={rule} className="grid grid-cols-[14px_1fr] items-start gap-2.5">
                  <span className="mt-1.5 h-[5px] w-[5px] bg-accent" aria-hidden />
                  <span className="text-[13px] text-text-body">{rule}</span>
                </li>
              ))}
            </ul>
          </HudPanel>
        </div>
      </div>
    </div>
  );
}

/** "UTC+3" for the header readout — the full IANA name is shown next to it. */
function shortZone(timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat(UI_LOCALE, {
      timeZone,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value ?? timeZone;
  } catch {
    return timeZone;
  }
}
