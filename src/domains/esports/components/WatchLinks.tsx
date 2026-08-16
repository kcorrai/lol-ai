import type { WatchLink } from "@/domains/esports/watch";

const PROVIDER_LABEL: Record<WatchLink["provider"], string> = {
  twitch: "Twitch",
  youtube: "YouTube",
};

/**
 * Where to watch, one chip per broadcast.
 *
 * Links out rather than embedding: an embed needs `frame-src` opened up for
 * Twitch and YouTube, and security headers are not something to change on the
 * way past. Every link is `rel="noopener"` because they all leave the site.
 *
 * Renders nothing when there is nothing to watch — an empty "watch" heading is
 * worse than no heading, and most older matches have no VOD published.
 */
export function WatchLinks({
  links,
  label,
}: {
  links: WatchLink[];
  label: string;
}): React.ReactElement | null {
  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="hud-label mr-1">{label}</span>
      {links.map((link) => (
        <a
          key={link.url}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="tag-cut bg-surface-2 px-2.5 py-1 font-mono text-[11px] uppercase tracking-label text-text-body transition-colors hover:bg-surface hover:text-text"
        >
          {PROVIDER_LABEL[link.provider]}
          <span className="ml-1.5 text-text-faint">{link.language}</span>
        </a>
      ))}
    </div>
  );
}
