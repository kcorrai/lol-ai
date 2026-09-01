"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, MonitorDown } from "lucide-react";
import { getDesktopRelease, pickDownload, type DesktopDownload } from "@/lib/desktop/release";

/**
 * The desktop app, on the bar, on every page.
 *
 * It was a flat link reading "Desktop" between "Coaching" and "Pricing" — the sixth word in a
 * row of identical grey type, next to a search box and two calls to action. This is the same
 * destination given a border and an icon, which is the difference between a thing a visitor
 * can find and a thing a visitor notices.
 *
 * Bordered rather than filled: the bar rations its one solid accent control to whichever
 * action matters most right now — sign up, or open the dashboard — and a second filled button
 * beside it would leave the header with two things shouting and nothing leading.
 *
 * **It never says "Download" when there is nothing to download.** With no published build
 * (`NEXT_PUBLIC_DESKTOP_RELEASE_*`, and there is no signed release yet) the label is "Desktop
 * app" and it goes to `/download`, which explains why. The same degrade `DesktopBand` makes,
 * for the same reason: a button that promises a file and hands over a paragraph is a worse
 * first impression than the paragraph on its own.
 */

// Module scope, not render: `NEXT_PUBLIC_*` is inlined at build time, so this is a constant.
const RELEASE = getDesktopRelease();

const BASE =
  "tag-cut inline-flex items-center gap-1.5 border border-accent font-display font-bold uppercase " +
  "tracking-[0.1em] text-accent transition-colors hover:bg-accent hover:text-background " +
  "active:bg-acid-600 active:text-background";

export function DownloadCta({
  /** Drops the label and squares the control up, for the row shown below `xl`. */
  compact = false,
  /** Fills the width, for the mobile drawer where it is a row rather than a button. */
  block = false,
  onNavigate,
}: {
  compact?: boolean;
  block?: boolean;
  onNavigate?: () => void;
} = {}): React.ReactElement {
  // Server-rendered markup cannot know the visitor's OS, so this starts on the first
  // published platform and swaps after hydration — the same crude, overridable guess
  // `DownloadPanel` makes, where being wrong costs a click rather than a dead end.
  const [primary, setPrimary] = useState<DesktopDownload | undefined>(RELEASE?.downloads[0]);

  useEffect(() => {
    if (RELEASE === null) return;
    setPrimary(pickDownload(RELEASE, navigator.userAgent));
  }, []);

  const size = compact ? "h-8 px-2.5 text-[10px]" : "h-8 px-3.5 text-[11px]";
  const className = `${BASE} ${size} ${block ? "w-full justify-center" : ""}`;

  if (RELEASE === null || primary === undefined) {
    return (
      <Link href="/download" onClick={onNavigate} className={className} aria-label="Desktop app">
        <MonitorDown className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
        {compact ? null : "Desktop app"}
      </Link>
    );
  }

  return (
    <a
      href={primary.url}
      onClick={onNavigate}
      className={className}
      aria-label={`Download for ${primary.label}`}
    >
      <Download className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
      {compact ? null : "Download"}
    </a>
  );
}
