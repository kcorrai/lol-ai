"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, MonitorDown } from "lucide-react";
import { getDesktopRelease, pickDownload, type DesktopDownload } from "@/lib/desktop/release";

/**
 * The download control, or an honest account of why there is nothing to download.
 *
 * There is no signed build and no release pipeline (`desktop/README.md`, phase 5d), so most
 * of the time this renders the second thing. Shipping a button that 404s, or a "coming
 * soon!" with a made-up date, would buy a click today at the cost of the one thing a
 * coaching product cannot spend — being believed when it tells you something.
 *
 * The moment `NEXT_PUBLIC_DESKTOP_RELEASE_*` names a file, this becomes a real button. No
 * code changes on that day.
 */

const PRIMARY =
  "tag-cut inline-flex h-11 items-center gap-2 bg-accent px-6 font-display text-[13px] font-bold uppercase tracking-[0.1em] text-background transition-colors hover:bg-acid-400 active:bg-acid-600";

// Module scope, not render: `NEXT_PUBLIC_*` is inlined at build time, so this is a constant
// and reading it once keeps it out of the effect's dependencies.
const RELEASE = getDesktopRelease();

export function DownloadPanel(): React.ReactElement {
  const release = RELEASE;

  // Server-rendered markup cannot know the visitor's OS, so the primary button starts on
  // the first published platform and swaps after hydration. Every platform stays listed
  // underneath either way, so a wrong guess costs one glance rather than a dead end.
  const [primary, setPrimary] = useState<DesktopDownload | undefined>(release?.downloads[0]);

  useEffect(() => {
    if (release === null) return;
    setPrimary(pickDownload(release, navigator.userAgent));
  }, [release]);

  if (release === null || primary === undefined) {
    return (
      <div className="notch relative border border-border bg-surface p-6 md:p-7">
        <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-accent opacity-40" />
        <span className="hud-label">{"// Not out yet"}</span>
        <p className="mt-3 max-w-[54ch] text-[15px] leading-relaxed text-text-body">
          There is no installer to hand you today. The application is built and it works — what
          it does not have is a signed release, and shipping an unsigned installer means asking
          you to click past your operating system telling you not to trust us.
        </p>
        <p className="mt-3 max-w-[54ch] text-[14px] leading-relaxed text-text-muted">
          Everything below is what it already does, not a roadmap. The rest of the product
          runs in this browser in the meantime.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link href="/register" className={PRIMARY}>
            <MonitorDown className="h-4 w-4" strokeWidth={2} />
            Start free in the browser
          </Link>
          <Link
            href="#pairing"
            className="font-mono text-[11px] uppercase tracking-label text-accent"
          >
            How pairing works &rarr;
          </Link>
        </div>
      </div>
    );
  }

  const others = release.downloads.filter((d) => d.platform !== primary.platform);

  return (
    <div className="notch relative border border-border bg-surface p-6 md:p-7">
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-accent" />
      <span className="hud-label">
        {release.version ? `// Version ${release.version}` : "// Latest build"}
      </span>

      <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <a href={primary.url} className={PRIMARY}>
          <Download className="h-4 w-4" strokeWidth={2} />
          Download for {primary.label}
        </a>
        <span className="font-mono text-[11px] uppercase tracking-label text-text-muted">
          {primary.format}
        </span>
      </div>

      {others.length > 0 && (
        <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-text-muted">
          <span>Also for</span>
          {others.map((d) => (
            <a key={d.platform} href={d.url} className="text-accent hover:underline">
              {d.label}{" "}
              {/* No brackets around the format: it already carries its own, so wrapping it
                  produced "macOS (Disk image (.dmg))". */}
              <span className="text-text-faint">&middot; {d.format}</span>
            </a>
          ))}
        </p>
      )}
    </div>
  );
}
