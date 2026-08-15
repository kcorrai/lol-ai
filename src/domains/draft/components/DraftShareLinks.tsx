"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface Props {
  code: string;
  blueToken: string;
  redToken: string;
  team1Name?: string;
  team2Name?: string;
}

interface ShareLink {
  label: string;
  hint: string;
  href: string;
  accent: string;
}

function origin(): string {
  return typeof window === "undefined" ? "" : window.location.origin;
}

/**
 * Three labelled links rather than one.
 *
 * The reference tool hands you a single URL and leaves you to work out who joins
 * as what, which is how scrims end up with both coaches on the same side. Naming
 * the links makes the capability explicit: whoever holds a drafter link can
 * draft for that side, and that needs saying out loud rather than implying.
 */
export function DraftShareLinks({
  code,
  blueToken,
  redToken,
  team1Name = "Team 1",
  team2Name = "Team 2",
}: Props): React.ReactElement {
  const [copied, setCopied] = useState<string | null>(null);

  const links: ShareLink[] = [
    {
      label: `${team1Name} — blue side`,
      hint: "Send to the first team's drafter",
      href: `${origin()}/draft/${code}?as=${blueToken}`,
      accent: "text-accent-blue",
    },
    {
      label: `${team2Name} — red side`,
      hint: "Send to the second team's drafter",
      href: `${origin()}/draft/${code}?as=${redToken}`,
      accent: "text-danger",
    },
    {
      label: "Spectators",
      hint: "Safe to post publicly — watching only",
      href: `${origin()}/draft/${code}`,
      accent: "text-text-muted",
    },
  ];

  async function copy(link: ShareLink): Promise<void> {
    await navigator.clipboard.writeText(link.href);
    setCopied(link.label);
    window.setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="flex flex-col gap-2">
      {links.map((link) => (
        <div
          key={link.label}
          className="notch-sm flex items-center gap-3 border border-border bg-surface-2 px-3 py-2"
        >
          <div className="min-w-0 flex-1">
            <p className={`text-[13px] font-semibold ${link.accent}`}>{link.label}</p>
            <p className="truncate text-[11.5px] text-text-faint">{link.hint}</p>
          </div>
          <button
            type="button"
            onClick={() => void copy(link)}
            className="notch-sm inline-flex shrink-0 items-center gap-1.5 border border-border px-2.5 py-1.5 text-[11.5px] font-semibold text-text-body transition-colors hover:bg-surface"
            aria-label={`Copy the ${link.label} link`}
          >
            {copied === link.label ? (
              <Check className="h-3.5 w-3.5 text-accent" aria-hidden />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden />
            )}
            {copied === link.label ? "Copied" : "Copy"}
          </button>
        </div>
      ))}
      <p className="text-[11.5px] leading-relaxed text-text-faint">
        A drafter link is the seat. Anyone who has it can pick and ban for that side, so send each
        one directly rather than posting it in a shared channel.
      </p>
    </div>
  );
}
