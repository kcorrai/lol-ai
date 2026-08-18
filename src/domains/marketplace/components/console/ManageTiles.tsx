import Link from "next/link";
import { CalendarClock, ClipboardList, Tags, UserRound } from "lucide-react";
import { StatusChip, type ChipTone } from "@/domains/marketplace/components/hud/StatusChip";

interface Props {
  live: boolean;
  activeListings: number;
  openHoursPerWeek: number;
  pending: number;
}

/**
 * The four places a coach goes to change something.
 *
 * Each tile carries the one number that says whether it needs attention, so the
 * grid answers "is anything wrong" without being opened.
 */
export function ManageTiles({
  live,
  activeListings,
  openHoursPerWeek,
  pending,
}: Props): React.ReactElement {
  const tiles = [
    {
      href: "/coach/profile",
      icon: UserRound,
      title: "Profile & rank",
      badge: live ? "Live" : "Not listed",
      tone: (live ? "good" : "neutral") as ChipTone,
      body: "What students read, and the account your rank is checked against.",
    },
    {
      href: "/coach/listings",
      icon: Tags,
      title: "Listings",
      badge: activeListings === 0 ? "None on sale" : `${activeListings} on sale`,
      tone: (activeListings === 0 ? "warn" : "neutral") as ChipTone,
      body: "What you sell, how long it takes, and what it costs.",
    },
    {
      href: "/coach/availability",
      icon: CalendarClock,
      title: "Availability",
      badge: openHoursPerWeek === 0 ? "No hours" : `${openHoursPerWeek}h open`,
      tone: (openHoursPerWeek === 0 ? "warn" : "neutral") as ChipTone,
      body: "The hours you are bookable, in your own timezone.",
    },
    {
      href: "/sessions",
      icon: ClipboardList,
      title: "Requests & sessions",
      badge: pending === 0 ? "All answered" : `${pending} waiting`,
      tone: (pending === 0 ? "neutral" : "warn") as ChipTone,
      body: "Accept or decline bookings, and deliver the work.",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {tiles.map((tile) => (
        <Link
          key={tile.href}
          href={tile.href}
          className="notch block border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-accent hover:bg-surface-2"
        >
          <span className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2.5">
              <tile.icon className="h-[18px] w-[18px] shrink-0 text-accent" aria-hidden />
              <span className="font-display text-[15px] font-extrabold uppercase tracking-[0.04em] text-text">
                {tile.title}
              </span>
            </span>
            <StatusChip tone={tile.tone}>{tile.badge}</StatusChip>
          </span>
          <span className="mt-2.5 block text-[13.5px] text-text-muted">{tile.body}</span>
        </Link>
      ))}
    </div>
  );
}
